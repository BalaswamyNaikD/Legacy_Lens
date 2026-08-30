import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RepositoryFile } from '@legacy-lens/types';
import { analyzeRepository } from '@legacy-lens/analysis-core';
import multer from 'multer';

// Load .env from the directory containing this file (apps/api) first,
// then fall back to the monorepo root .env so keys are always found
// regardless of which directory the process was launched from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });    // apps/api (overrides root)

const app = express();
const port = Number(process.env.PORT ?? 4000);
const uploadDir = path.resolve(process.cwd(), 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 25 * 1024 * 1024 }
});

const projects = [
  { id: 'proj-001', name: 'Customer Operations', repository: 'customer-core', lastAnalysis: '2026-08-29', technology: 'IBM i / RPG / SQL', status: 'healthy' },
  { id: 'proj-002', name: 'Tenant Billing', repository: 'billing-suite', lastAnalysis: '2026-08-21', technology: 'Java / SQL', status: 'needs-review' },
  { id: 'proj-003', name: 'Inventory Gateway', repository: 'inventory-platform', lastAnalysis: '2026-08-18', technology: 'C# / Web APIs', status: 'risk' }
] as const;

// ─── IBM watsonx AI helpers ───────────────────────────────────────────────────

const WATSONX_API_URL = process.env.WATSONX_API_URL ?? 'https://us-south.ml.cloud.ibm.com';
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID ?? '';
const WATSONX_API_KEY = process.env.WATSONX_API_KEY ?? '';
const WATSONX_MODEL_ID = process.env.WATSONX_MODEL_ID ?? 'ibm/granite-4-h-instruct';

/** Exchange an IBM Cloud API key for a short-lived IAM bearer token. */
async function getIAMToken(): Promise<string> {
  const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: WATSONX_API_KEY
    })
  });
  if (!response.ok) {
    throw new Error(`IAM token exchange failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json() as { access_token: string };
  return data.access_token;
}

/** Build the system prompt that gives the IBM AI agent context about Legacy Lens. */
function buildSystemPrompt(analysisContext: string): string {
  return `You are the Legacy Lens AI Agent — an expert assistant embedded inside Legacy Lens, an enterprise modernization platform.
Your job is to help developers understand legacy codebases, identify onboarding challenges, trace analysis problems, and explain system features.

Current analysis context:
${analysisContext}

Guidelines:
- Answer questions about analysis results, onboarding steps, business rules, dependencies, and data flows clearly and concisely.
- When asked about onboarding problems, explain what the issue is, which files are involved, and what the developer should do first.
- When asked about system features, describe how Legacy Lens helps with repository intelligence, impact analysis, and modernization.
- Always cite evidence files or modules when available.
- Keep answers focused and actionable for legacy system work.`;
}

/** Call IBM watsonx text generation API.
 *  Uses the Granite instruct chat format: <|system|> … <|user|> … <|assistant|>
 */
async function callWatsonxAI(systemPrompt: string, userMessage: string): Promise<string> {
  const token = await getIAMToken();

  // Granite-3 instruct models expect the special-token chat format.
  const input =
    `<|system|>\n${systemPrompt}\n<|user|>\n${userMessage}\n<|assistant|>\n`;

  const payload = {
    model_id: WATSONX_MODEL_ID,
    project_id: WATSONX_PROJECT_ID,
    input,
    parameters: {
      decoding_method: 'greedy',
      max_new_tokens: 512,
      min_new_tokens: 1,
      stop_sequences: ['<|user|>', '<|endoftext|>'],
      repetition_penalty: 1.05
    }
  };

  const response = await fetch(
    `${WATSONX_API_URL}/ml/v1/text/generation?version=2024-05-31`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`watsonx API error ${response.status}: ${errText}`);
  }

  const result = await response.json() as { results: Array<{ generated_text: string }> };
  return result.results?.[0]?.generated_text?.trim() ?? 'No response generated.';
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV ?? 'development' });
});

app.get('/api/config', (_req, res) => {
  const watsonxConfigured = Boolean(WATSONX_API_KEY && WATSONX_PROJECT_ID);

  res.json({
    watsonxConfigured,
    modelId: WATSONX_MODEL_ID,
    apiUrl: WATSONX_API_URL,
    projectIdConfigured: Boolean(WATSONX_PROJECT_ID),
    apiKeyConfigured: Boolean(WATSONX_API_KEY)
  });
});

app.get('/api/projects', (_req, res) => {
  res.json(projects);
});

app.post('/api/projects/analyze', (req, res) => {
  const repoName = String(req.body?.repoName ?? 'Customer Operations');
  const task = String(req.body?.task ?? 'Identify all dependencies and business rules required to modify the Customer Address Update routine within an unfamiliar legacy repository.');
  const files = Array.isArray(req.body?.files) ? req.body.files as RepositoryFile[] : undefined;

  const result = analyzeRepository({ repoName, task, files });
  res.json(result);
});

app.post('/api/upload', upload.array('files', 200), async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const uploadedFiles: RepositoryFile[] = [];

  for (const file of files) {
    const filePath = file.path;
    const content = fs.readFileSync(filePath, 'utf8');
    const extension = path.extname(file.originalname).replace('.', '') || 'txt';
    const language = extension === 'rpg' || extension === 'rpgle' ? 'rpg' : extension === 'sql' ? 'sql' : extension === 'cl' ? 'cl' : extension === 'md' ? 'markdown' : 'text';

    uploadedFiles.push({
      name: file.originalname,
      path: file.originalname,
      language,
      extension,
      size: file.size,
      category: extension === 'sql' ? 'database' : extension === 'md' ? 'documentation' : 'source',
      summary: `Uploaded file ${file.originalname}`,
      content
    });
  }

  const result = analyzeRepository({
    repoName: 'Uploaded repository',
    task: 'Understand the uploaded project and identify key dependencies and business rules.',
    files: uploadedFiles
  });

  res.json({ uploadedFiles, analysis: result });
});

/**
 * POST /api/agent/chat
 * Body: { message: string; context?: string }
 *
 * Sends the user message to IBM watsonx AI with Legacy Lens analysis context
 * and streams the reply back as JSON.
 */
app.post('/api/agent/chat', async (req, res) => {
  const message = String(req.body?.message ?? '').trim();
  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  // Optional analysis context passed from the frontend (summary, onboarding steps, etc.)
  const context = String(req.body?.context ?? 'No analysis context provided.');

  if (!WATSONX_API_KEY || !WATSONX_PROJECT_ID) {
    // Fallback when credentials are not configured — useful in development
    const fallback = buildFallbackResponse(message, context);
    res.json({ reply: fallback, source: 'fallback' });
    return;
  }

  try {
    const systemPrompt = buildSystemPrompt(context);
    const reply = await callWatsonxAI(systemPrompt, message);
    res.json({ reply, source: 'watsonx' });
  } catch (error) {
    const message_ = error instanceof Error ? error.message : String(error);
    console.error('watsonx error:', message_);
    res.status(500).json({ error: message_, source: 'watsonx' });
  }
});

/** Rule-based fallback used when IBM watsonx credentials are not configured. */
function buildFallbackResponse(message: string, context: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('onboard') || lower.includes('start') || lower.includes('begin') || lower.includes('how do i')) {
    return 'To onboard this repository, start by reading the entry-point program (e.g. customer_update.rpg), then trace through the validation routines and data definitions. The Onboarding panel lists the recommended reading order with the reasoning behind each step.';
  }
  if (lower.includes('business rule') || lower.includes('rule')) {
    return 'Business rules are extracted from source code patterns and documentation. Key rules include address validation requirements, credit threshold checks, and customer status gates. See the Business Rules tab for confidence scores and evidence files.';
  }
  if (lower.includes('depend') || lower.includes('call')) {
    return 'The dependency map shows which programs call each other, which SQL tables are read or written, and which shared services are referenced. Navigate to the Dependencies tab to see the full call graph.';
  }
  if (lower.includes('impact') || lower.includes('change') || lower.includes('risk')) {
    return 'The impact analysis identifies which programs would be affected by a given change. High-risk areas include the Customer Profile Service and the Credit Review Flow. Review the Impact Analysis tab before making modifications.';
  }
  if (lower.includes('data flow') || lower.includes('data')) {
    return 'Data flows trace how records move through the system: reads from master tables, transformations in business logic layers, and writes back to persistent storage. Check the Data Flow tab for a visual trace.';
  }
  if (lower.includes('feature') || lower.includes('what can') || lower.includes('what does legacy lens')) {
    return 'Legacy Lens provides: repository scanning and classification, dependency and call-graph mapping, business rule extraction, data-flow tracing, change-impact analysis, onboarding path generation, and this AI agent for answering questions about any of those results in real time.';
  }

  return `I am the Legacy Lens Agent. Based on the current analysis context:\n\n${context.slice(0, 300)}...\n\nAsk me about onboarding steps, business rules, dependencies, data flows, impact analysis, or any Legacy Lens feature.`;
}

app.listen(port, () => {
  console.log(`Legacy Lens API running on http://localhost:${port}`);
});
