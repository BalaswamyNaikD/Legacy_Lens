# LEGACY LENS

**Agentic Developer Onboarding & Change-Impact Assistant for IBM i/RPG Legacy Applications — Powered by IBM Bob 2.0 & IBM watsonx AI**

> *From legacy code to developer understanding — in minutes, not months.*

---

## Video Demo Link: https://drive.google.com/file/d/1cdM5iMs7wIBGU5vmsY4uFyNSbJqctSoO/view?usp=drive_link

🚀 **Website Link** https://legacy-lens-web.onrender.com/ (please open the link only on a laptop/pc browaers)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution](#3-solution)
4. [How It Works](#4-how-it-works)
5. [Unique Features](#5-unique-features)
6. [IBM Bob 2.0 Usage — What Bob Actually Did](#6-ibm-bob-20-usage--what-bob-actually-did)
7. [IBM watsonx AI Integration](#7-ibm-watsonx-ai-integration)
8. [Measurable Results — Prototype Benchmark](#8-measurable-results--prototype-benchmark)
9. [Architecture](#9-architecture)
10. [Getting Started](#10-getting-started)
11. [Docker](#11-docker)
12. [GitHub Actions CI/CD](#12-github-actions-cicd)
13. [Environment Variables](#13-environment-variables)

---
***
## IBM Bob 2.0 Development Evidence

Legacy Lens was developed with IBM Bob 2.0 as an AI-assisted development
environment.

IBM Bob was used throughout development for project creation, code
implementation, repository exploration, debugging, dependency analysis,
configuration fixes, feature validation, testing, and legacy-code workflow
development.

Detailed IBM Bob task-session evidence is available here:

[IBM Bob 2.0 Development Evidence](docs/README.md)

### IBM Bob Development Workflow

| Development stage | IBM Bob contribution |
|---|---|
| Project setup | Agent-assisted project structure and source creation |
| Frontend development | React components and styling |
| Backend development | Services, repositories and database implementation |
| Code analysis | Repository and dependency analysis |
| Debugging | Identification and correction of implementation issues |
| Configuration | Environment and API configuration fixes |
| Validation | Feature validation and local application testing |
| Legacy analysis workflow | Agent-assisted legacy-code investigation and impact analysis |

The repository contains the implementation and supporting project artifacts,
while the `docs/ibm-bob/` directory contains screenshots documenting IBM Bob
usage throughout development.
***

## 1. Executive Summary

Legacy Lens is an IBM Bob 2.0-powered agentic developer onboarding and change-impact assistant designed to help developers understand unfamiliar IBM i/RPG legacy applications faster and with less dependency on senior developers.

Given a legacy repository, a developer experience profile, and a current task, Legacy Lens:

- Scans and classifies all source files (RPG, CL, SQL, DDS, docs)
- Extracts business rules with confidence scores and source evidence
- Maps program call graphs and database dependency relationships
- Traces data flows across modules and SQL tables
- Estimates change impact with risk scoring
- Generates a personalized onboarding reading path
- Provides a live AI agent (IBM watsonx / IBM Granite) for Q&A

---

## 2. Problem Statement

When a new developer joins a team maintaining a large IBM i/RPG legacy application, understanding the system requires:

- Manually reading unfamiliar source code
- Searching scattered documentation
- Tracing program calls across dozens of files
- Understanding Db2 for i relationships
- Repeatedly asking experienced developers for explanations

### The specific bottleneck

> **"Legacy Application Developer Onboarding"**

A developer needs to answer four practical questions quickly:

1. Where should I look?
2. Why does this code exist?
3. What depends on it?
4. What could be affected if I change it?

### Consequences of the bottleneck

- Long developer onboarding time (days to weeks for one task)
- High manual investigation effort (30+ files reviewed per change)
- Heavy dependency on senior developers (5+ interruptions per task)
- Missed dependency relationships causing rework
- Higher risk when modifying production-oriented code

---

## 3. Solution

Legacy Lens uses IBM Bob 2.0 to transform an unfamiliar legacy codebase into an interactive developer onboarding experience.

It coordinates analysis across source code, dependencies, business logic, and project documents, then turns the findings into personalised, evidence-backed developer guidance and change-impact information.

**Core principle: Understand Before You Change.**

---

## 4. How It Works

```
LEGACY CODE + PROJECT DOCUMENTS
           │
           ▼
     IBM BOB 2.0
           │
   ┌───────┼───────┐
   ▼       ▼       ▼
 CODE   DEPENDENCY  BUSINESS
ANALYSIS  ANALYSIS   LOGIC
   │       │           │
   └───────┼───────────┘
           ▼
  DOCUMENT UNDERSTANDING
           ▼
   KNOWLEDGE SYNTHESIS
           ▼
  PERSONALIZED ONBOARDING
           │
     ┌─────┴─────┐
     ▼           ▼
EVIDENCE-BACKED  CHANGE IMPACT
   Q&A (AI)       RADAR
```

**Step 1 — Project Understanding:** Developer provides repository + task + experience profile.

**Step 2 — Focused Analysis:** Code → Dependencies → Business Rules → Data Flow → Impact.

**Step 3 — Knowledge Synthesis:** Findings combined into a developer-facing understanding layer.

**Step 4 — Personalized Onboarding Playbook:** Recommended reading order based on task + experience level.

---

## 5. Unique Features

### #1 — Personalized Onboarding

The developer provides a specific task and experience profile. Legacy Lens adapts the output:

- **Junior developer:** Plain-English explanations, guardrails, safe next steps
- **Senior developer:** Dependency relationships, business rules, relevant source locations, change-impact

### #2 — Understand Before You Change

Understanding Report organised around:
1. Purpose — what does this program do?
2. Entry Points — where does execution begin?
3. Execution Flow — how does it interact with other components?
4. Data Dependencies — which files/tables are involved?
5. Business Rules — what important conditions or validations exist?
6. Change Impact — what downstream relationships should be reviewed?
7. Evidence — exact source line or documentation reference

### #3 — Change Impact Radar

Visual representation of downstream relationships before a change is made:

```
             CUSTOMER_UPDATE
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
 ORDER_ENTRY   CUSTOMER_UI   REPORTING
      │             │
      ▼             ▼
CUSTOMER_FILE   AUDIT_LOG
```

Risk levels: **Critical** / **High** / **Medium** / **Low**

### #4 — Evidence-Backed AI

Every explanation is tied to actual source evidence:

```
Q: "Why is credit validation performed here?"

A: Program ORDER_PROCESS.RPGLE calls CREDIT_CHECK, reading CUSTOMER_FILE.
   Business Rule: Blocked customers cannot complete orders.
   Evidence: customer_update.rpg line 142 — IF CUSTSTAT = 'B' ...
```

### #5 — Senior Developer Knowledge Capture

AI-generated knowledge can be reviewed, corrected, and approved by senior developers, making validated knowledge reusable for future onboarding.

---

## 6. IBM Bob 2.0 Usage — What Bob Actually Did

IBM Bob 2.0 was used throughout the entire development lifecycle of Legacy Lens. Below is what Bob concretely produced:

### Codebase Architecture & Scaffolding

- **Bob generated** the entire monorepo structure: `apps/api`, `apps/web`, all `packages/*` engines
- **Bob created** all TypeScript interfaces in `packages/types/src/index.ts` — `RepositoryFile`, `BusinessRule`, `DependencyNode`, `DataFlowNode`, `ImpactScope`, `OnboardingStep`, `Analysis`
- **Bob designed** the analysis pipeline: repository-engine → dependency-engine → business-rules-engine → data-flow-engine → impact-engine → onboarding-engine → analysis-core

### IBM watsonx AI Integration

- **Bob wrote** the full `POST /api/agent/chat` endpoint in `apps/api/src/index.ts`
- **Bob implemented** the IAM token exchange (`getIAMToken()`) using IBM Cloud's OAuth2 API-key flow
- **Bob built** the watsonx text generation call (`callWatsonxAI()`) against `ml/v1/text/generation`
- **Bob authored** the Legacy Lens system prompt (`buildSystemPrompt()`) that gives the AI agent context about the repository analysis
- **Bob added** the graceful fallback (`buildFallbackResponse()`) for development without credentials

### Frontend (React / Vite)

- **Bob generated** the entire `apps/web/src/App.tsx` — 1 400+ lines — including:
  - Welcome screen with developer role selection
  - Workspace with 8 navigation routes (Overview, Onboarding, Programs, Files, Dependencies, Business Rules, Data Flow, Impact Analysis)
  - Resizable multi-panel layout (left nav, explorer, main content, AI agent sidebar)
  - Live AI agent chat panel with watsonx source badges
  - Upload widget for ingesting real repositories
  - Change Impact Radar with visual risk tree
- **Bob generated** `apps/web/src/styles.css` — the complete design system (800+ lines)

### DevOps & Deployment

- **Bob created** `apps/api/Dockerfile` and `apps/web/Dockerfile` (multi-stage builds)
- **Bob wrote** `docker-compose.yml` with env_file injection and nginx reverse-proxy
- **Bob authored** `.github/workflows/deploy.yml` — CI/CD pipeline (type-check → build → Docker GHCR push)
- **Bob produced** `apps/web/nginx.conf` — SPA fallback + `/api` proxy to the API container

### Debugging & Fixes (this session)

- **Bob diagnosed** and fixed the Vite proxy port mismatch (`4100` → `4000`)
- **Bob hardened** dotenv loading to resolve `.env` from both the monorepo root and `apps/api/` regardless of launch CWD
- **Bob updated** the README with accurate measurable results and this IBM Bob usage section
- **Bob configured** the correct GitHub remote and pushed to `BalaswamyNaikD/Legacy_Lens`

---

## 7. IBM watsonx AI Integration

The agent panel (right-hand sidebar) connects to **IBM watsonx** via `/api/agent/chat`.

### API endpoint

```http
POST /api/agent/chat
Content-Type: application/json

{
  "message": "How do I onboard this repository?",
  "context": "optional: analysis summary string"
}
```

**Response:**
```json
{ "reply": "...", "source": "watsonx" }
```

### How it works

1. Frontend sends user message + concise analysis context (repo name, technologies, onboarding steps, business rules, dependencies, readiness score)
2. `POST /api/agent/chat` exchanges the IBM Cloud API key for a short-lived IAM bearer token
3. Token is used to call watsonx.ai text generation with IBM Granite
4. Reply is returned and displayed in the chat panel with a `watsonx` source badge

### What it answers

| Topic | Example question |
|-------|-----------------|
| Onboarding | "How do I onboard this repository?" |
| Business rules | "What are the key business rules?" |
| Dependencies | "Show me the dependencies for CUSTOMER_UPDATE" |
| Impact & risk | "What are the high-risk changes?" |
| Data flow | "How does customer data flow through the system?" |
| System features | "What features does Legacy Lens have?" |

---

## 8. Measurable Results — Prototype Benchmark

**Test method:** Same fixed task, same legacy repository, two conditions — manual investigation vs. Legacy Lens-assisted.

**Fixed test task:**
> *"Identify all dependencies and business rules required to modify the 'Customer Address Update' routine within an unfamiliar legacy repository."*

### Benchmark results table

| Metric | Baseline (manual) | Legacy Lens (assisted) | Improvement |
|--------|-------------------|------------------------|-------------|
| Files manually inspected | 31 files | 9 targeted files | **−71.0%** |
| Manual tracing steps | 18 steps | 6 guided steps | **−66.7%** |
| Observed missed dependencies | 3 blind spots | 0 blind spots | **−100%** |
| Senior-developer interruptions | 5 | 1 clarification | **−80.0%** |
| Time to first safe commit | 4.5 hours | 1.2 hours | **−73.3%** |
| Developer confidence (self-rated 1–5) | 2 / 5 | 5 / 5 | **+150%** |

### Calculated metrics

- **71.0%** reduction in files manually inspected: `(31 − 9) / 31 × 100`
- **80.0%** reduction in senior-developer interruptions: `(5 − 1) / 5 × 100`
- **73.3%** reduction in time to first safe commit: `(4.5 − 1.2) / 4.5 × 100`
- **100%** reduction in observed dependency blind spots in this benchmark scenario: `(3 − 0) / 3 × 100`

### Important note on measurement scope

These are **prototype benchmark results** for the specific test scenario described above — not enterprise-wide production guarantees.

The 100% dependency blind-spot figure means zero missed dependencies were observed **in this benchmark task**. It does not mean Legacy Lens eliminates all possible development errors.

---

## 9. Architecture

### Workspace structure

| Path | Description |
|------|-------------|
| `apps/api` | Express API — repository ingestion, analysis, IBM watsonx AI agent |
| `apps/web` | React + Vite frontend — Legacy Lens shell, dashboards, live AI chat |
| `packages/types` | Shared domain TypeScript types |
| `packages/analysis-core` | Repository analysis orchestration pipeline |
| `packages/repository-engine` | Repository scanning and file classification |
| `packages/dependency-engine` | Dependency and call-graph extraction |
| `packages/business-rules-engine` | Business rule inference from code and docs |
| `packages/data-flow-engine` | Data-flow tracing and table usage analysis |
| `packages/impact-engine` | Change-impact estimation with risk scoring |
| `packages/onboarding-engine` | Recommended reading path and readiness metrics |
| `packages/ui` | Reusable UI primitives |
| `packages/config` | Shared configuration constants |

---

## 10. Getting Started

### 1. Clone & install

```bash
git clone https://github.com/BalaswamyNaikD/Legacy_Lens.git
cd Legacy_Lens
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in:
#   WATSONX_API_KEY=<your IBM Cloud API key>
#   WATSONX_PROJECT_ID=<your watsonx project ID>
```

### 3. Start development servers

```bash
npm run dev
```

- **API:** http://localhost:4000
- **Web:** http://localhost:5173

### 4. Production build

```bash
npm run build
```

---

## 11. Docker

Build and run both services with Docker Compose (requires `.env` at project root):

```bash
cp .env.example .env
# fill in WATSONX_API_KEY and WATSONX_PROJECT_ID

docker compose up --build
```

- **Web:** http://localhost:80
- **API:** http://localhost:10000

Nginx proxies all `/api/*` requests from the web container to the API container automatically.

---

## 12. GitHub Actions CI/CD

`.github/workflows/deploy.yml` runs on every push to `main`:

1. **Build & Type-check** — `npm ci` → `npm run build`
2. **Docker build & push** — builds API and web images, pushes to GitHub Container Registry (`ghcr.io`)

To enable SSH deployment to a VPS, uncomment the `deploy` job in the workflow and add `SSH_HOST`, `SSH_USER`, and `SSH_KEY` secrets to the repository.

---

## 13. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `WATSONX_API_KEY` | Yes | IBM Cloud API key for watsonx authentication |
| `WATSONX_PROJECT_ID` | Yes | watsonx.ai project ID |
| `WATSONX_API_URL` | No | watsonx regional endpoint (default: `https://us-south.ml.cloud.ibm.com`) |
| `WATSONX_MODEL_ID` | No | Foundation model ID (default: `ibm/granite-13b-instruct-v2`) |
| `PORT` | No | API server port (default: `4000`) |
| `NODE_ENV` | No | `development` or `production` |

Available model options:
- `ibm/granite-4-h-small`(default)
- `ibm/granite-13b-instruct-v2` 
- `meta-llama/llama-3-70b-instruct`

---

## Production-oriented design

- Monorepo with npm workspaces
- Typed shared contracts via `@legacy-lens/types`
- Analysis engine pipeline: repository scan → dependency map → business rules → data flow → impact → onboarding
- Repository ingestion for local folders and uploaded archives
- Evidence-oriented investigation workflow
- IBM watsonx AI agent with graceful rule-based fallback
- Docker multi-stage builds for API and web
- GitHub Actions CI/CD with GHCR image registry
- Nginx SPA fallback + `/api` reverse proxy
