import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent
} from 'react';

type RouteKey =
  | 'overview'
  | 'onboarding'
  | 'files'
  | 'programs'
  | 'data'
  | 'dependencies'
  | 'business-rules'
  | 'data-flow'
  | 'impact-analysis'
  | 'tasks'
  | 'investigations'
  | 'settings'
  | 'help';

type DeveloperRole = 'Junior developer' | 'Senior developer';

type Project = {
  id: string;
  name: string;
  repository: string;
  lastAnalysis: string;
  technology: string;
  status: 'healthy' | 'needs-review' | 'risk';
};

type RepositoryFile = {
  name: string;
  path: string;
  language: string;
  extension: string;
  size: number;
  category: string;
  summary: string;
  content: string;
};

type BusinessRule = {
  id: string;
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  sourceProgram: string;
};

type DependencyNode = {
  id: string;
  source: string;
  target: string;
  kind: 'call' | 'include' | 'reads' | 'writes' | 'query';
  evidence: string;
};

type DataFlowNode = {
  id: string;
  from: string;
  to: string;
  flowType: 'read' | 'write' | 'transform' | 'api';
  description: string;
};

type ImpactScope = {
  id: string;
  program: string;
  reason: string;
  risk: 'low' | 'medium' | 'high';
};

type OnboardingStep = {
  order: number;
  title: string;
  why: string;
  read: string[];
};

type Analysis = {
  task: string;
  systemName: string;
  repositoryName: string;
  generatedAt: string;
  technologies: string[];
  summary: string;
  entryPoints: string[];
  modules: string[];
  dependencies: DependencyNode[];
  businessRules: BusinessRule[];
  dataFlows: DataFlowNode[];
  impacts: ImpactScope[];
  onboarding: OnboardingStep[];
  readiness: number;
  recommendations: string[];
  evidence: string[];
};

type AgentMessage = {
  role: 'user' | 'agent';
  text: string;
  source?: 'watsonx' | 'fallback';
};

type ProgramCard = {
  name: string;
  language: string;
  purpose: string;
  entry: boolean;
  calledPrograms: string[];
  callers: string[];
  files: string[];
  tables: string[];
  rules: string[];
  risk: 'Low' | 'Medium' | 'High';
  complexity: string;
  lastModified: string;
};

type Investigation = {
  title: string;
  entryPoint: string;
  impact: string;
  businessRules: string[];
  dependencies: string[];
  timestamp: string;
};

const defaultTask =
  'Identify all dependencies and business rules required to modify the Customer Address Update routine within an unfamiliar legacy repository.';

const analysisPhases = [
  'Scanning repository structure',
  'Mapping dependencies and call paths',
  'Inferring business rules',
  'Tracing data flow and ownership',
  'Assessing change impact',
  'Finalizing AI insights'
];

const repoFiles: RepositoryFile[] = [
  {
    name: 'customer_update.rpg',
    path: 'src/customer/customer_update.rpg',
    language: 'RPG',
    extension: 'rpg',
    size: 12740,
    category: 'business-process',
    summary: 'Updates customer master and address details with validation checks.',
    content: `0145   IF status = 'ACTIVE';
0146      credit_ok = Y;
0147      // Validate address format
0148      CALL 'ADDR_FMT_VALID'
0149      parm addr_valid;
0150      IF addr_valid = 'Y';
0151          // Update address
0152          MOVE new_addr to customer_addr;
0153          MOVE new_adr2 to customer_adr2;
0154          MOVE new_city to customer_city;
0155          MOVE new_state to customer_state;
0156          MOVE new_zip to customer_zip;
0157          UPDATE customer_master;
0158      ELSE;
0159          CALL 'LOG_ERROR'
0160          parm 'ADDR_INVALID';
0161          error_code = 'ADDR_INVALID';
0162      ENDIF;
0163  ELSE;
0164      CALL 'LOG_ERROR'
0165      parm 'CUSTOMER_INACTIVE';
0166      error_code = 'CUSTOMER_INACTIVE';
0167  ENDIF;
0168
0169  *INLR = *ON;`
  },
  {
    name: 'customer_master.sql',
    path: 'db/customer_master.sql',
    language: 'SQL',
    extension: 'sql',
    size: 5400,
    category: 'schema',
    summary: 'Defines customer master table and key indexes.',
    content: `CREATE TABLE customer_master (
  id INTEGER PRIMARY KEY,
  status VARCHAR(20),
  address VARCHAR(255),
  city VARCHAR(80),
  state VARCHAR(30),
  zip_code VARCHAR(10)
);`
  },
  {
    name: 'credit_validation.rpg',
    path: 'src/credit/credit_validation.rpg',
    language: 'RPG',
    extension: 'rpg',
    size: 8600,
    category: 'validation',
    summary: 'Reviews credit thresholds and customer approval state.',
    content: `IF customer_status = 'ACTIVE';
   CALL 'CHECK_CREDIT_LIMIT';
   IF credit_status = 'APPROVED';
      RETURN *ON;
   ENDIF;
ENDIF;`
  },
  {
    name: 'address_rules.clle',
    path: 'src/rules/address_rules.clle',
    language: 'CLLE',
    extension: 'clle',
    size: 6300,
    category: 'rules',
    summary: 'Address validation and postal state checks.',
    content: `CHKOBJ OBJ('QSYS/QADSP') TYPE('*FILE');
VALIDATE_STATE state;
IF state IS NULL THEN FAILURE;`
  },
  {
    name: 'credit_policy.md',
    path: 'docs/credit_policy.md',
    language: 'Markdown',
    extension: 'md',
    size: 2800,
    category: 'documentation',
    summary: 'Business policy for reason codes and approval gating.',
    content: '# Credit Policy\n\nCustomer credit decisions depend on balance and status.'
  }
];

const fallbackAnalysis: Analysis = {
  task: defaultTask,
  systemName: 'Legacy Lens',
  repositoryName: 'Customer Operations',
  generatedAt: new Date().toISOString(),
  technologies: ['IBM i', 'RPG', 'SQL', 'CL', 'DDS'],
  summary:
    'The repository appears to integrate customer updates, credit review, validation, and downstream reporting without a clear jump-off point for junior developers.',
  entryPoints: ['customer_update.rpg', 'credit_validation.rpg', 'customer_master.sql'],
  modules: ['Customer domain', 'Business validation', 'Reporting and batch', 'Master data'],
  dependencies: [
    {
      id: 'dep-1',
      source: 'customer_update.rpg',
      target: 'customer_master',
      kind: 'call',
      evidence: 'Customer update uses the master table and validation policy.'
    },
    {
      id: 'dep-2',
      source: 'customer_credit_validation.rpg',
      target: 'credit_bureau',
      kind: 'query',
      evidence: 'Credit workflow checks versioned customer risk and profile values.'
    },
    {
      id: 'dep-3',
      source: 'address_rules.clle',
      target: 'postal_table',
      kind: 'reads',
      evidence: 'Address validation derives rules from the postal state table.'
    }
  ],
  businessRules: [
    {
      id: 'rule-1',
      title: 'Address required',
      description: 'Address fields must be validated before updates are accepted.',
      evidence: ['customer_update.rpg'],
      confidence: 0.9,
      severity: 'high',
      sourceProgram: 'customer_update.rpg'
    },
    {
      id: 'rule-2',
      title: 'Credit threshold',
      description: 'Customer credit decisions depend on profile state and outstanding balances.',
      evidence: ['customer_credit_validation.rpg'],
      confidence: 0.88,
      severity: 'high',
      sourceProgram: 'customer_credit_validation.rpg'
    },
    {
      id: 'rule-3',
      title: 'Status gate',
      description: 'Inactive customer records cannot pass approval flows.',
      evidence: ['customer_profile.sql'],
      confidence: 0.82,
      severity: 'medium',
      sourceProgram: 'customer_master.sql'
    }
  ],
  dataFlows: [
    {
      id: 'flow-1',
      from: 'customer_master',
      to: 'address_update',
      flowType: 'read',
      description: 'Customer data enters the update routine.'
    },
    {
      id: 'flow-2',
      from: 'credit_profile',
      to: 'approval_engine',
      flowType: 'transform',
      description: 'Credit data is converted into a decision result.'
    },
    {
      id: 'flow-3',
      from: 'customer_portal',
      to: 'customer_table',
      flowType: 'write',
      description: 'Validated updates are persisted to the customer master record.'
    }
  ],
  impacts: [
    {
      id: 'impact-1',
      program: 'Customer Profile Service',
      reason: 'Profile defaults and billing logic are sensitive to customer updates.',
      risk: 'high'
    },
    {
      id: 'impact-2',
      program: 'Address Validation Routine',
      reason: 'Address checks flow through multiple operational screens and APIs.',
      risk: 'medium'
    },
    {
      id: 'impact-3',
      program: 'Credit Review Flow',
      reason: 'Approval thresholds may shift if status rules or balance checks change.',
      risk: 'high'
    }
  ],
  onboarding: [
    {
      order: 1,
      title: 'Understand the system',
      why: 'Start with the system boundary and the primary business flow.',
      read: ['customer_update.rpg']
    },
    {
      order: 2,
      title: 'Find important programs',
      why: 'Identify the entry points and validation routines first.',
      read: ['credit_validation.rpg']
    },
    {
      order: 3,
      title: 'Understand dependencies',
      why: 'Map which tables and services this flow depends on.',
      read: ['customer_master.sql']
    },
    {
      order: 4,
      title: 'Understand business rules',
      why: 'Changes must respect status, validation, and credit gates.',
      read: ['address_rules.clle']
    },
    {
      order: 5,
      title: 'Understand data flow',
      why: 'Confirm how data moves before writing.',
      read: ['customer_master.sql']
    },
    {
      order: 6,
      title: 'Assess change impact',
      why: 'Identify the downstream blast radius before patching.',
      read: ['credit_policy.md']
    }
  ],
  readiness: 84,
  recommendations: [
    'Review the customer update and validation routines first.',
    'Check the downstream financial and reporting dependencies.',
    'Run regression tests for profile changes and approval checks.'
  ],
  evidence: [
    'customer_update.rpg',
    'customer_credit_validation.rpg',
    'customer_master.sql',
    'address_rules.clle',
    'credit_policy.md'
  ]
};

const routeLabels: Array<{ key: RouteKey; label: string; section: string }> = [
  { key: 'overview', label: 'Overview', section: 'Project' },
  { key: 'onboarding', label: 'Onboarding', section: 'Project' },
  { key: 'files', label: 'Files', section: 'Project' },
  { key: 'programs', label: 'Programs', section: 'Project' },
  { key: 'data', label: 'Data', section: 'Project' },
  { key: 'dependencies', label: 'Dependencies', section: 'Project' },
  { key: 'business-rules', label: 'Business Rules', section: 'Project' },
  { key: 'data-flow', label: 'Data Flow', section: 'Project' },
  { key: 'impact-analysis', label: 'Impact Analysis', section: 'Project' },
  { key: 'tasks', label: 'Tasks', section: 'Work' },
  { key: 'investigations', label: 'Saved Investigations', section: 'Work' },
  { key: 'settings', label: 'Project Settings', section: 'Settings' },
  { key: 'help', label: 'Help', section: 'Settings' }
];

const programCards: ProgramCard[] = [
  {
    name: 'CUSTOMER_UPDATE.RPGLE',
    language: 'RPGLE',
    purpose: 'Validates customer status, address format, and triggers customer master updates.',
    entry: true,
    calledPrograms: ['ADDR_FMT_VALID', 'LOG_ERROR', 'CREDIT_CHECK'],
    callers: ['ORDER_ENTRY.RPGLE', 'CUSTOMER_PORTAL'],
    files: ['src/customer/customer_update.rpg', 'db/customer_master.sql'],
    tables: ['customer_master'],
    rules: ['Address required', 'Status gate'],
    risk: 'High',
    complexity: 'Medium',
    lastModified: '2026-08-17'
  },
  {
    name: 'CREDIT_CHECK.RPGLE',
    language: 'RPGLE',
    purpose: 'Evaluates credit approvals and policy thresholds before a record moves forward.',
    entry: false,
    calledPrograms: ['CHECK_CREDIT_LIMIT'],
    callers: ['CUSTOMER_UPDATE.RPGLE'],
    files: ['src/credit/credit_validation.rpg'],
    tables: ['credit_profile'],
    rules: ['Credit threshold'],
    risk: 'High',
    complexity: 'High',
    lastModified: '2026-08-14'
  },
  {
    name: 'ADDRESS_VALIDATION.CLLE',
    language: 'CLLE',
    purpose: 'Claims and validates postal and address rules used by multiple workflow steps.',
    entry: false,
    calledPrograms: ['VALIDATE_STATE'],
    callers: ['CUSTOMER_UPDATE.RPGLE'],
    files: ['src/rules/address_rules.clle'],
    tables: ['postal_table'],
    rules: ['Address required'],
    risk: 'Medium',
    complexity: 'Low',
    lastModified: '2026-08-11'
  }
];

const investigations: Investigation[] = [
  {
    title: 'Customer Address Update modification',
    entryPoint: 'CUSTOMER_UPDATE.RPGLE',
    impact: 'Medium',
    businessRules: ['Address required', 'Status gate'],
    dependencies: ['customer_master', 'postal_table'],
    timestamp: '2026-08-28 08:15'
  },
  {
    title: 'Credit approval review',
    entryPoint: 'CREDIT_CHECK.RPGLE',
    impact: 'High',
    businessRules: ['Credit threshold'],
    dependencies: ['credit_profile', 'billing_system'],
    timestamp: '2026-08-25 11:42'
  }
];

const helpSections = [
  {
    title: 'What Legacy Lens does',
    body:
      'Legacy Lens helps junior developers understand unfamiliar legacy repositories by scanning files, extracting programs, mapping dependencies, flagging business rules, tracing data flow, and assessing impact before changes are made.'
  },
  {
    title: 'How to upload a repository',
    body:
      'Use Upload repository from the welcome screen or the top bar. You can upload a ZIP archive, a folder where supported, or a set of source files. The system validates the input, inspects structure, and builds analysis metadata.'
  },
  {
    title: 'How repository analysis works',
    body:
      'The analysis pipeline scans the repository, detects languages, identifies programs and symbols, extracts dependencies, infers business rules, traces flows, and builds readiness and onboarding guidance.'
  },
  {
    title: 'How to navigate the workspace',
    body:
      'Use the project sidebar to move between Overview, Onboarding, Files, Programs, Data, Dependencies, Business Rules, Data Flow, and Impact Analysis. Each screen is designed to answer a follow-up engineering question.'
  },
  {
    title: 'What Overview means',
    body:
      'Overview gives you a repository dashboard with summary status, key entry points, dependency totals, business rules, and recommended onboarding steps tailored to a junior developer.'
  },
  {
    title: 'What Programs means',
    body:
      'Programs shows the important routines and modules, their purpose, important inputs and outputs, risk level, and dependencies. Each program can be opened for deeper analysis.'
  },
  {
    title: 'What Dependencies means',
    body:
      'Dependencies maps calls, reads, writes, and service relationships so you understand which components depend on one another and what can be affected by a modification.'
  },
  {
    title: 'What Business Rules means',
    body:
      'Business Rules shows conditions and actions inferred from the code and supporting documentation, including confidence and source references. Review each rule before changing behavior.'
  },
  {
    title: 'What Data Flow means',
    body:
      'Data Flow traces how information moves from input sources to programs, downstream tables, and external services. It helps you understand the path and transformation points.'
  },
  {
    title: 'What Impact Analysis means',
    body:
      'Impact Analysis estimates which programs, tables, services, and rules could be influenced by a change. This is the safest way to assess regression risk before modifying a live system.'
  },
  {
    title: 'How to use the AI Agent',
    body:
      'Ask about onboarding, the selected program, dependencies, business rules, or risky changes. The agent responds using the current repository context and evidence from the analysis, not generic documentation.'
  },
  {
    title: 'How to interpret analysis results',
    body:
      'Treat confidence, source evidence, and the surrounding dependency graph as your decision inputs. Confirm the rule or relationship in code before making changes.'
  },
  {
    title: 'What readiness or analysis status means',
    body:
      'Readiness represents how complete and trustworthy the repository understanding is based on factors such as identified programs, file coverage, business rules, and dependency links.'
  }
];

const helpFaq = [
  {
    q: 'Can I work with a ZIP file?',
    a: 'Yes. The upload workflow accepts archive and source files and then builds an analysis model from the uploaded content.'
  },
  {
    q: 'What if the repository is unsupported?',
    a: 'The app still inspects the available files and marks incomplete or uncertain areas rather than inventing relationships.'
  },
  {
    q: 'Does the AI require credentials?',
    a: 'No. The system supports a local fallback mode and will only use IBM watsonx when the proper environment variables are configured.'
  },
  {
    q: 'Where do I start when I know nothing?',
    a: 'Start with Overview, then Onboarding, then the program and dependency screens. This avoids reading every file in the repository.'
  }
];

const statusTone = (status: Project['status']) => {
  if (status === 'healthy') return 'healthy';
  if (status === 'needs-review') return 'warn';
  return 'danger';
};

const conditionToText = (value: number) => `${Math.max(0, Math.min(100, value))}%`;

export default function App() {
  const [stage, setStage] = useState<'welcome' | 'workspace'>('welcome');
  const [developerRole, setDeveloperRole] = useState<DeveloperRole>('Junior developer');
  const [currentRoute, setCurrentRoute] = useState<RouteKey>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('Customer Operations');
  const [analysis, setAnalysis] = useState<Analysis | null>(fallbackAnalysis);
  const [loading, setLoading] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(18);
  const [analysisPhase, setAnalysisPhase] = useState(analysisPhases[0]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState(repoFiles[0].path);
  const [selectedProgram, setSelectedProgram] = useState(programCards[0].name);
  const [programTab, setProgramTab] = useState<
    'summary' | 'dependencies' | 'business_rules' | 'data' | 'call_flow' | 'impact' | 'ai'
  >('summary');
  const [aiStatus, setAiStatus] = useState<'Connected' | 'Offline'>('Offline');
  const [leftWidth, setLeftWidth] = useState(180);
  const [explorerWidth, setExplorerWidth] = useState(245);
  const [overviewWidth, setOverviewWidth] = useState(300);
  const [agentWidth, setAgentWidth] = useState(310);
  const dragRef = useRef<{ type: 'left' | 'explorer' | 'overview' | 'agent'; startX: number; startValue: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([
    {
      role: 'agent',
      text: 'Hello! I am the Legacy Lens AI Agent. Ask me about onboarding, programs, dependencies, business rules, or change impact.',
      source: 'watsonx'
    }
  ]);
  const [agentInput, setAgentInput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const agentScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/projects', { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        setProjects(data);
        if (data.length) setSelectedProject(data[0].name);
      })
      .catch(() => {
        setProjects([
          {
            id: 'proj-default',
            name: 'Customer Operations',
            repository: 'customer-core',
            lastAnalysis: '2026-08-29',
            technology: 'IBM i / RPG / SQL',
            status: 'healthy'
          }
        ]);
      });

    fetch('/api/config', { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setAiStatus(data?.watsonxConfigured ? 'Connected' : 'Offline'))
      .catch(() => setAiStatus('Offline'));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (stage !== 'workspace') return;

    const controller = new AbortController();
    setLoading(true);
    setAnalysisProgress(18);
    setAnalysisPhase(analysisPhases[0]);

    let progress = 18;
    const progressInterval = window.setInterval(() => {
      progress = Math.min(progress + 11, 93);
      setAnalysisProgress(progress);
      const nextPhaseIndex = Math.min(Math.floor(progress / 18), analysisPhases.length - 1);
      setAnalysisPhase(analysisPhases[nextPhaseIndex]);
    }, 650);

    fetch('/api/projects/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoName: selectedProject, task: defaultTask }),
      signal: controller.signal
    })
      .then((response) => response.json())
      .then((data) => setAnalysis(data))
      .catch(() => setAnalysis(fallbackAnalysis))
      .finally(() => {
        window.clearInterval(progressInterval);
        setAnalysisProgress(100);
        setAnalysisPhase('Analysis complete');
        setLoading(false);
      });

    return () => {
      controller.abort();
      window.clearInterval(progressInterval);
    };
  }, [selectedProject, stage]);

  const buildAgentContext = useCallback(() => {
    if (!analysis) return 'No analysis loaded yet.';
    const onboardingTitles = analysis.onboarding.map((step) => `${step.order}. ${step.title}`).join('; ');
    const ruleNames = analysis.businessRules.map((rule) => rule.title).join(', ');
    const depList = analysis.dependencies.map((dep) => `${dep.source} → ${dep.target} (${dep.kind})`).join('; ');

    return `Repository: ${analysis.repositoryName}. Technologies: ${analysis.technologies.join(', ')}. Summary: ${analysis.summary}. Onboarding: ${onboardingTitles}. Business rules: ${ruleNames}. Key dependencies: ${depList}. View: ${currentRoute}. Readiness: ${analysis.readiness}%. Recommendations: ${analysis.recommendations.join(' | ')}.`;
  }, [analysis, currentRoute]);

  const sendAgentMessage = useCallback(async () => {
    const text = agentInput.trim();
    if (!text || agentLoading) return;

    setAgentInput('');
    setAgentMessages((prev) => [...prev, { role: 'user', text }]);
    setAgentLoading(true);

    try {
      const response = await fetch('https://legacy-lens-api.onrender.com/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: buildAgentContext() })
      });
      const data = (await response.json()) as { reply?: string; error?: string; source?: 'watsonx' | 'fallback' };
      const reply = data.reply ?? data.error ?? 'No response received.';
      setAgentMessages((prev) => [...prev, { role: 'agent', text: reply, source: data.source ?? 'fallback' }]);
    } catch {
      setAgentMessages((prev) => [...prev, { role: 'agent', text: 'Connection error — make sure the API is running on port 10000.' }]);
    } finally {
      setAgentLoading(false);
    }
  }, [agentInput, agentLoading, buildAgentContext]);

  const handleAgentKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') sendAgentMessage();
    },
    [sendAgentMessage]
  );

  useEffect(() => {
    if (agentScrollRef.current) {
      agentScrollRef.current.scrollTop = agentScrollRef.current.scrollHeight;
    }
  }, [agentMessages, agentLoading]);

  const selectedProjectRecord = useMemo(
    () => projects.find((project) => project.name === selectedProject) ?? projects[0],
    [projects, selectedProject]
  );

  const beginResize = (type: 'left' | 'explorer' | 'overview' | 'agent', event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragRef.current = {
      type,
      startX: event.clientX,
      startValue:
        type === 'left'
          ? leftWidth
          : type === 'explorer'
            ? explorerWidth
            : type === 'overview'
              ? overviewWidth
              : agentWidth
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      if (!dragRef.current) return;

      const delta = event.clientX - dragRef.current.startX;
      const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

      if (dragRef.current.type === 'left') setLeftWidth(clamp(dragRef.current.startValue + delta, 140, 230));
      if (dragRef.current.type === 'explorer') setExplorerWidth(clamp(dragRef.current.startValue + delta, 180, 420));
      if (dragRef.current.type === 'overview') setOverviewWidth(clamp(dragRef.current.startValue + delta, 220, 420));
      if (dragRef.current.type === 'agent') setAgentWidth(clamp(dragRef.current.startValue + delta, 250, 420));
    };

    const handlePointerUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [agentWidth, explorerWidth, leftWidth, overviewWidth]);

  const selectedFile = useMemo(() => {
    const visible = repoFiles.filter(
      (file) =>
        file.name.toLowerCase().includes(searchText.toLowerCase()) ||
        file.path.toLowerCase().includes(searchText.toLowerCase()) ||
        searchText.trim().length === 0
    );
    return visible.find((file) => file.path === selectedFilePath) ?? visible[0] ?? repoFiles[0];
  }, [searchText, selectedFilePath]);

  const selectedProgramRecord = programCards.find((program) => program.name === selectedProgram) ?? programCards[0];

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    setUploadMessage('Uploading repository for analysis...');

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (result?.analysis) {
        setAnalysis(result.analysis);
        setSelectedProject('Uploaded repository');
        setCurrentRoute('overview');
        setUploadMessage(`Repository uploaded successfully. ${result.uploadedFiles?.length ?? 0} files analyzed.`);
      } else {
        setUploadMessage('Upload complete, but no repository analysis was returned.');
      }
    } catch {
      setUploadMessage('Upload failed. Please try again with a smaller archive or a supported source set.');
    } finally {
      event.target.value = '';
    }
  };

  const fileTree = useMemo(() => {
    const filtered = repoFiles.filter(
      (file) =>
        file.name.toLowerCase().includes(searchText.toLowerCase()) ||
        file.path.toLowerCase().includes(searchText.toLowerCase()) ||
        searchText.trim() === ''
    );
    return filtered;
  }, [searchText]);

  const overviewCards = [
    { label: 'Repository name', value: analysis?.repositoryName ?? 'Unknown', route: 'overview', accent: 'primary' },
    { label: 'Language(s)', value: (analysis?.technologies ?? []).slice(0, 3).join(', '), route: 'files', accent: 'neutral' },
    { label: 'Analysis status', value: `Ready ${analysis?.readiness ?? 0}%`, route: 'impact-analysis', accent: 'success' },
    { label: 'Files', value: String(repoFiles.length), route: 'files', accent: 'neutral' },
    { label: 'Programs', value: String(programCards.length), route: 'programs', accent: 'info' },
    { label: 'Business Rules', value: String(analysis?.businessRules.length ?? 0), route: 'business-rules', accent: 'warning' }
  ];

  const renderOverview = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Repository dashboard</div>
          <h2>{analysis?.repositoryName ?? 'Repository'} overview</h2>
        </div>
        <button type="button" className="primary-button small" onClick={() => setCurrentRoute('onboarding')}>
          View onboarding plan
        </button>
      </div>

      <div className="stats-grid">
        {overviewCards.map((card) => (
          <button
            key={card.label}
            type="button"
            className={`stat-card ${card.accent}`}
            onClick={() => setCurrentRoute(card.route as RouteKey)}
          >
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </button>
        ))}
      </div>

      <div className="panel-grid two-up">
        <section className="content-card">
          <div className="section-header-row">
            <h3>Repository summary</h3>
            <span className="pill">What this system does</span>
          </div>
          <p className="body-copy">{analysis?.summary}</p>
          <div className="metric-list">
            {analysis?.modules.map((module) => (
              <span key={module} className="tag-item">
                {module}
              </span>
            ))}
          </div>
        </section>

        <section className="content-card">
          <div className="section-header-row">
            <h3>Architecture overview</h3>
            <span className="pill">High-level map</span>
          </div>
          <ul className="bullet-list">
            {analysis?.entryPoints.map((entry) => <li key={entry}>{entry}</li>)}
          </ul>
        </section>
      </div>

      <div className="panel-grid three-up">
        <section className="content-card">
          <div className="section-header-row">
            <h3>Key entry points</h3>
            <button type="button" className="link-button" onClick={() => setCurrentRoute('programs')}>
              Open programs
            </button>
          </div>
          <ul className="bullet-list compact">
            {analysis?.entryPoints.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </section>

        <section className="content-card">
          <div className="section-header-row">
            <h3>Dependency summary</h3>
            <button type="button" className="link-button" onClick={() => setCurrentRoute('dependencies')}>
              Open graph
            </button>
          </div>
          <ul className="bullet-list compact">
            {analysis?.dependencies.map((dep) => (
              <li key={dep.id}>
                {dep.source} → {dep.target}
              </li>
            ))}
          </ul>
        </section>

        <section className="content-card">
          <div className="section-header-row">
            <h3>Business rule summary</h3>
            <button type="button" className="link-button" onClick={() => setCurrentRoute('business-rules')}>
              Review rules
            </button>
          </div>
          <ul className="bullet-list compact">
            {analysis?.businessRules.map((rule) => <li key={rule.id}>{rule.title}</li>)}
          </ul>
        </section>
      </div>

      <div className="panel-grid two-up bottom-grid">
        <section className="content-card">
          <div className="section-header-row">
            <h3>Risk and impact summary</h3>
            <button type="button" className="link-button" onClick={() => setCurrentRoute('impact-analysis')}>
              Open impact
            </button>
          </div>
          <div className="impact-list">
            {analysis?.impacts.map((impact) => (
              <div key={impact.id} className="impact-row">
                <strong>{impact.program}</strong>
                <span className={`dot ${impact.risk}`}>{impact.risk}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-card">
          <div className="section-header-row">
            <h3>Recommended onboarding path</h3>
            <button type="button" className="link-button" onClick={() => setCurrentRoute('onboarding')}>
              Open steps
            </button>
          </div>
          <ol className="numbered-list">
            {analysis?.onboarding.map((step) => (
              <li key={step.order}>
                <strong>{step.title}</strong> — {step.why}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );

  const renderOnboarding = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">AI-guided onboarding</div>
          <h2>Junior developer onboarding path</h2>
        </div>
        <div className="progress-pill">{analysis?.readiness ?? 0}% ready</div>
      </div>

      <div className="progress-block">
        <div className="progress-label-row">
          <span>Repository readiness</span>
          <strong>{conditionToText(analysis?.readiness ?? 0)}</strong>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${analysis?.readiness ?? 0}%` }} />
        </div>
      </div>

      <div className="steps-grid">
        {analysis?.onboarding.map((step) => (
          <div key={step.order} className="step-card">
            <div className="step-number">STEP {step.order}</div>
            <h3>{step.title}</h3>
            <p>{step.why}</p>
            <div className="step-meta-list">
              <span>Important findings</span>
              <ul>
                {step.read.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <button type="button" className="ghost-button small" onClick={() => setCurrentRoute('files')}>
              Explore
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Repository browser</div>
          <h2>Files and source context</h2>
        </div>
        <div className="pill">{fileTree.length} items</div>
      </div>

      <div className="file-preview-shell">
        <div className="meta-block">
          <div className="meta-row">
            <span>Path</span>
            <strong>{selectedFile.path}</strong>
          </div>
          <div className="meta-row">
            <span>Language</span>
            <strong>{selectedFile.language}</strong>
          </div>
          <div className="meta-row">
            <span>Size</span>
            <strong>{selectedFile.size} bytes</strong>
          </div>
          <div className="meta-row">
            <span>Symbols</span>
            <strong>12</strong>
          </div>
          <div className="meta-row">
            <span>References</span>
            <strong>7</strong>
          </div>
        </div>

        <div className="code-card">
          <div className="code-toolbar">
            <span className="filename-badge">{selectedFile.name}</span>
            <span className="pill subtle">{selectedFile.category}</span>
          </div>
          <pre className="code-block">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );

  const renderPrograms = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Program intelligence</div>
          <h2>Analyzed programs</h2>
        </div>
      </div>

      <div className="program-stack">
        {programCards.map((program) => (
          <button
            type="button"
            key={program.name}
            className={`program-card ${selectedProgram === program.name ? 'selected' : ''}`}
            onClick={() => setSelectedProgram(program.name)}
          >
            <div className="program-header-row">
              <strong>{program.name}</strong>
              <span className={`risk-pill ${program.risk.toLowerCase()}`}>{program.risk}</span>
            </div>
            <p>{program.purpose}</p>
            <div className="program-meta">
              <span>{program.language}</span>
              <span>{program.entry ? 'Entry point' : 'Secondary program'}</span>
              <span>{program.complexity}</span>
              <span>{program.lastModified}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="program-detail-card">
        <div className="program-detail-header">
          <div>
            <div className="page-eyebrow">Program detail</div>
            <h3>{selectedProgramRecord.name}</h3>
          </div>
          <div className="pill">{selectedProgramRecord.language}</div>
        </div>

        <div className="tab-row">
          {['summary', 'dependencies', 'business_rules', 'data', 'call_flow', 'impact', 'ai'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tab-button ${programTab === tab ? 'active' : ''}`}
              onClick={() => setProgramTab(tab as typeof programTab)}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {programTab === 'summary' && (
          <div className="program-content-grid">
            <div>
              <strong>Purpose</strong>
              <p>{selectedProgramRecord.purpose}</p>
            </div>
            <div>
              <strong>Risk</strong>
              <p>{selectedProgramRecord.risk}</p>
            </div>
            <div>
              <strong>Entry point</strong>
              <p>{selectedProgramRecord.entry ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <strong>Last modified</strong>
              <p>{selectedProgramRecord.lastModified}</p>
            </div>
          </div>
        )}

        {programTab === 'dependencies' && (
          <ul className="bullet-list compact">
            {selectedProgramRecord.calledPrograms.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}

        {programTab === 'business_rules' && (
          <ul className="bullet-list compact">
            {selectedProgramRecord.rules.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}

        {programTab === 'data' && (
          <ul className="bullet-list compact">
            {selectedProgramRecord.tables.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}

        {programTab === 'call_flow' && (
          <ul className="bullet-list compact">
            {selectedProgramRecord.callers.map((item) => <li key={item}>Called by {item}</li>)}
          </ul>
        )}

        {programTab === 'impact' && (
          <p className="body-copy">
            Changing this program can affect billing consistency, customer status checks, and approval gates downstream. Review dependency and data-flow screens before patching.
          </p>
        )}

        {programTab === 'ai' && (
          <p className="body-copy">
            This routine validates the active customer state and updates the canonical customer record. The first thing to review is the status gate and the subsequent address validation step to avoid invalid writes.
          </p>
        )}
      </div>
    </div>
  );

  const renderData = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Data and schema</div>
          <h2>Data model and usage</h2>
        </div>
      </div>

      <div className="data-grid">
        {['customer_master', 'credit_profile', 'postal_table', 'billing_events'].map((item) => (
          <div key={item} className="content-card compact">
            <h3>{item}</h3>
            <p>Used by: CUSTOMER_UPDATE.RPGLE, CREDIT_CHECK.RPGLE</p>
            <div className="metadata-ladder">
              <span>Read by: 3 programs</span>
              <span>Written by: 2 programs</span>
              <span>Business rules: 2</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDependencies = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Dependency map</div>
          <h2>Program and service relationship graph</h2>
        </div>
      </div>

      <div className="dependency-map">
        <div className="node node-primary">CUSTOMER_UPDATE.PRG</div>
        <div className="connector" />
        <div className="node node-secondary">CUSTOMER_MASTER</div>
        <div className="connector" />
        <div className="node node-secondary">ADDRESS_VALIDATION</div>
        <div className="connector" />
        <div className="node node-secondary">CUSTOMER_VALIDATE.PRG</div>
        <div className="connector" />
        <div className="node node-secondary">CREDIT_CHECK.PRG</div>
      </div>
    </div>
  );

  const renderBusinessRules = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Business rules</div>
          <h2>Detected rules and validation logic</h2>
        </div>
      </div>

      <div className="rule-grid">
        {analysis?.businessRules.map((rule) => (
          <div key={rule.id} className="content-card">
            <div className="rule-title-row">
              <h3>{rule.title}</h3>
              <span className={`risk-pill ${rule.severity}`}>{rule.severity}</span>
            </div>
            <p>{rule.description}</p>
            <div className="rule-block">
              <strong>Condition</strong>
              <span>{rule.sourceProgram}</span>
            </div>
            <div className="rule-block">
              <strong>Action</strong>
              <span>Allow address update only after validation succeeds.</span>
            </div>
            <div className="rule-block">
              <strong>Confidence</strong>
              <span>{Math.round(rule.confidence * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDataFlow = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Data-flow map</div>
          <h2>Major movement of data</h2>
        </div>
      </div>

      <div className="flow-visual">
        <div className="flow-item">User Input</div>
        <div className="flow-arrow">↓</div>
        <div className="flow-item">Customer Update Program</div>
        <div className="flow-arrow">↓</div>
        <div className="flow-item">Validation Routine</div>
        <div className="flow-arrow">↓</div>
        <div className="flow-item">Customer Master</div>
        <div className="flow-arrow">↓</div>
        <div className="flow-item">Billing Service</div>
      </div>
    </div>
  );

  const renderImpact = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Impact analysis</div>
          <h2>Recommended change impact review</h2>
        </div>
      </div>

      <div className="impact-grid">
        <div className="content-card">
          <h3>Direct impact</h3>
          <ul className="bullet-list compact">
            <li>CUSTOMER_MASTER</li>
            <li>ADDRESS_RULES</li>
          </ul>
        </div>
        <div className="content-card">
          <h3>Indirect impact</h3>
          <ul className="bullet-list compact">
            <li>Customer Profile Service</li>
            <li>Billing Service</li>
          </ul>
        </div>
        <div className="content-card">
          <h3>Business impact</h3>
          <ul className="bullet-list compact">
            <li>Address updates</li>
            <li>Customer validation</li>
            <li>Billing consistency</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Tasks</div>
          <h2>Developer task checklist</h2>
        </div>
      </div>

      <div className="task-list">
        {[
          'Repository structure',
          'Entry point',
          'Dependencies',
          'Business rules',
          'Impact review',
          'Test recommendations'
        ].map((item, index) => (
          <div key={item} className={`task-item ${index < 4 ? 'done' : ''}`}>
            <input type="checkbox" checked={index < 4} readOnly />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInvestigations = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Saved investigations</div>
          <h2>Tracked repository questions</h2>
        </div>
      </div>

      <div className="investigation-list">
        {investigations.map((item) => (
          <div key={item.title} className="content-card investigation-card">
            <div className="rule-title-row">
              <h3>{item.title}</h3>
              <span className="pill">{item.impact}</span>
            </div>
            <p>
              Entry point: <strong>{item.entryPoint}</strong>
            </p>
            <p>Business rules: {item.businessRules.join(', ')}</p>
            <p>Dependencies: {item.dependencies.join(', ')}</p>
            <p className="timestamp">{item.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Settings</div>
          <h2>Workspace configuration</h2>
        </div>
      </div>

      <div className="settings-grid">
        <div className="content-card">
          <h3>AI provider</h3>
          <label className="field-label">
            <span>Provider</span>
            <select defaultValue="watsonx">
              <option>watsonx</option>
              <option>local fallback</option>
            </select>
          </label>
          <label className="field-label">
            <span>Theme</span>
            <select defaultValue="dark">
              <option>Dark enterprise</option>
              <option>Light workspace</option>
            </select>
          </label>
        </div>
        <div className="content-card">
          <h3>Watsonx configuration</h3>
          <label className="field-label">
            <span>IBM_WATSONX_API_KEY</span>
            <input type="password" value="••••••••••••" readOnly />
          </label>
          <label className="field-label">
            <span>IBM_WATSONX_PROJECT_ID</span>
            <input value="legacy-lens-prod" readOnly />
          </label>
          <label className="field-label">
            <span>IBM_WATSONX_MODEL_ID</span>
            <input value="ibm/granite-13b-instruct-v2" readOnly />
          </label>
        </div>
      </div>
    </div>
  );

  const renderHelp = () => (
    <div className="page-shell help-layout">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Help</div>
          <h2>Legacy Lens guide</h2>
        </div>
        <div className="pill">Search help</div>
      </div>

      <div className="help-search">
        <input
          type="text"
          placeholder="Search help articles"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      <div className="help-layout-body">
        <div className="help-article-list">
          {helpSections
            .filter(
              (section) =>
                section.title.toLowerCase().includes(searchText.toLowerCase()) ||
                section.body.toLowerCase().includes(searchText.toLowerCase()) ||
                searchText.trim() === ''
            )
            .map((section) => (
              <section key={section.title} className="content-card compact">
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </section>
            ))}
        </div>

        <aside className="content-card help-side-panel">
          <h3>Getting started</h3>
          <ol className="help-list">
            <li>Upload a repository</li>
            <li>Open Overview</li>
            <li>Follow onboarding steps</li>
            <li>Inspect programs and dependencies</li>
            <li>Review impact before changing code</li>
          </ol>

          <h3>FAQ</h3>
          {helpFaq.map((faq) => (
            <div key={faq.q} className="faq-item">
              <strong>{faq.q}</strong>
              <p>{faq.a}</p>
            </div>
          ))}

          <div className="help-action-row">
            <button type="button" className="ghost-button small">
              Report issue
            </button>
            <button type="button" className="primary-button small">
              Contact support
            </button>
          </div>
        </aside>
      </div>
    </div>
  );

  const renderRightPanel = () => {
    const activeRule = analysis?.businessRules[0];
    const activeDep = analysis?.dependencies[0];

    return (
      <>
        <div className="panel-title-row compact-row">
          <span className="panel-name">Context</span>
          <span className="mini-actions">{aiStatus === 'Connected' ? 'Connected' : 'Offline'}</span>
        </div>

        <div className="quick-context-list">
          <div className="context-card">
            <span className="label">Repository</span>
            <strong>{analysis?.repositoryName ?? 'Unknown'}</strong>
          </div>
          <div className="context-card">
            <span className="label">Selected file</span>
            <strong>{selectedFile.name}</strong>
          </div>
          <div className="context-card">
            <span className="label">Program</span>
            <strong>{selectedProgramRecord.name}</strong>
          </div>
          <div className="context-card">
            <span className="label">Key rule</span>
            <strong>{activeRule?.title ?? 'Unavailable'}</strong>
          </div>
          <div className="context-card">
            <span className="label">Dependency</span>
            <strong>{activeDep?.source ?? 'None'}</strong>
          </div>
        </div>

        <div className="insight-card">
          <h4>Recommended next action</h4>
          <p>{analysis?.recommendations[0] ?? 'Start by reviewing program entry points and validation checks.'}</p>
        </div>
      </>
    );
  };

  const renderWorkspaceMain = () => {
    switch (currentRoute) {
      case 'overview':
        return renderOverview();
      case 'onboarding':
        return renderOnboarding();
      case 'files':
        return renderFiles();
      case 'programs':
        return renderPrograms();
      case 'data':
        return renderData();
      case 'dependencies':
        return renderDependencies();
      case 'business-rules':
        return renderBusinessRules();
      case 'data-flow':
        return renderDataFlow();
      case 'impact-analysis':
        return renderImpact();
      case 'tasks':
        return renderTasks();
      case 'investigations':
        return renderInvestigations();
      case 'settings':
        return renderSettings();
      case 'help':
        return renderHelp();
      default:
        return renderOverview();
    }
  };

  if (stage === 'welcome') {
    return (
      <div className="welcome-shell">
        <div className="welcome-card">
          <div className="welcome-topbar">
            <div className="brand-group">
              <div className="brand-mark">L</div>
              <div className="brand-block">
                <div className="brand-kicker">Enterprise intelligence workspace</div>
                <div className="brand">Legacy Lens</div>
              </div>
            </div>
            <button type="button" className="ghost-button small" onClick={() => setHelpOpen(true)}>
              Need help?
            </button>
          </div>

          <div className="welcome-divider" />

          <div className="welcome-content">
            <div className="welcome-copy-block">
              <div className="eyebrow">AI-ASSISTED LEGACY CODE ONBOARDING & MODERNIZATION INTELLIGENCE</div>
              <h1>Understand unfamiliar legacy systems before you change them.</h1>
              <p>
                Upload a repository and turn complex programs, dependencies, business rules and data flows into a clear engineering map.
              </p>
            </div>

            <div className="welcome-side-panel">
              <div className="mini-stat-row">
                <span>Repository Intelligence</span>
                <span>Dependency Mapping</span>
              </div>
              <div className="mini-stat-row">
                <span>Business Rules</span>
                <span>Data Flow</span>
              </div>
              <div className="mini-stat-row">
                <span>Impact Analysis</span>
                <span>AI Onboarding Agent</span>
              </div>
            </div>
          </div>

          <div className="role-grid">
            <button
              type="button"
              className={`role-card ${developerRole === 'Junior developer' ? 'selected' : ''}`}
              onClick={() => setDeveloperRole('Junior developer')}
            >
              <span className="role-badge">Junior</span>
              <span className="role-name">Junior developer</span>
              <span className="role-meta">Fast path to safe onboarding and understanding.</span>
            </button>
            <button
              type="button"
              className={`role-card ${developerRole === 'Senior developer' ? 'selected' : ''}`}
              onClick={() => setDeveloperRole('Senior developer')}
            >
              <span className="role-badge">Senior</span>
              <span className="role-name">Senior developer</span>
              <span className="role-meta">Impact, risk, and modernization-level code intelligence.</span>
            </button>
          </div>

          <div className="welcome-actions">
            <button type="button" className="primary-button" onClick={() => setStage('workspace')}>
              Open workspace
            </button>
            <button type="button" className="ghost-button" onClick={() => fileInputRef.current?.click()}>
              Upload repository
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleUpload}
          aria-label="Upload repository files"
          accept=".zip,.rar,.tar,.gz,.txt,.sql,.rpg,.rpgle,.cl,.clle,.dds,.cbl,.java,.cs,.js,.ts,.py,.md"
        />

        {helpOpen && (
          <div className="modal-backdrop" onClick={() => setHelpOpen(false)}>
            <div className="help-modal" onClick={(event) => event.stopPropagation()}>
              <div className="help-modal-header">
                <div>
                  <div className="page-eyebrow">Help and guide</div>
                  <h3>Legacy Lens onboarding guide</h3>
                </div>
                <button type="button" className="close-button" onClick={() => setHelpOpen(false)}>
                  ×
                </button>
              </div>

              <div className="help-search modal-search">
                <input
                  type="text"
                  placeholder="Search help"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </div>

              <div className="help-modal-body">
                <div className="help-section-group">
                  <h4>Getting started</h4>
                  <ol>
                    <li>Upload the repository, source archive, or project files.</li>
                    <li>Open Overview to understand repository summary and readiness.</li>
                    <li>Review Onboarding and the entry-point programs.</li>
                    <li>Inspect business rules, dependencies, and data flow.</li>
                    <li>Assess impact before making a change.</li>
                  </ol>
                </div>

                {helpSections
                  .filter(
                    (section) =>
                      section.title.toLowerCase().includes(searchText.toLowerCase()) ||
                      section.body.toLowerCase().includes(searchText.toLowerCase()) ||
                      searchText.trim() === ''
                  )
                  .map((section) => (
                    <div key={section.title} className="help-section-group">
                      <h4>{section.title}</h4>
                      <p>{section.body}</p>
                    </div>
                  ))}

                <div className="help-section-group">
                  <h4>Keyboard shortcuts</h4>
                  <p>
                    Press Enter in the AI chat to send a question. Use Tab navigation for most controls and focus states are visible throughout the workspace.
                  </p>
                </div>

                <div className="help-section-group">
                  <h4>Report an issue</h4>
                  <p>
                    If the backend support is unavailable, use the report issue action in the help panel or contact the engineering team with the repository name, timestamp, and error description.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-group">
          <div className="brand-mark">L</div>
          <div className="brand-block">
            <div className="brand">Legacy Lens</div>
          </div>
          <div className="system-tag">{selectedProjectRecord?.name ?? 'Customer Operations'}</div>
        </div>

        <div className="topbar-search">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search files, programs, symbols..."
            aria-label="Search repository"
          />
        </div>

        <div className="topbar-actions">
          <select
            className="role-select"
            value={developerRole}
            onChange={(event) => setDeveloperRole(event.target.value as DeveloperRole)}
            aria-label="Select developer role"
          >
            <option value="Junior developer">Junior developer</option>
            <option value="Senior developer">Senior developer</option>
          </select>
          <button type="button" className="upload-button" onClick={() => fileInputRef.current?.click()}>
            Upload repository
          </button>
          <div className="status-pill connected">
            IBM BOB Live
          </div>
          <button type="button" className="icon-btn" aria-label="Open notifications">
            ◔
          </button>
          <button type="button" className="icon-btn" aria-label="Open settings" onClick={() => setCurrentRoute('settings')}>
            ⚙
          </button>
          <button type="button" className="avatar" aria-label="User profile">
            JD
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleUpload}
          aria-label="Upload repository files"
          accept=".zip,.rar,.tar,.gz,.txt,.sql,.rpg,.rpgle,.cl,.clle,.dds,.cbl,.java,.cs,.js,.ts,.py,.md"
        />
      </header>

      <main className="workspace-layout">
        <aside className="left-rail" style={{ width: leftWidth }}>
          {['Project', 'Work', 'Settings'].map((section) => {
            const items = routeLabels.filter((item) => item.section === section);
            return (
              <div key={section} className="rail-section">
                <div className="rail-label">{section}</div>
                {items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`rail-nav ${currentRoute === item.key ? 'active' : ''}`}
                    onClick={() => setCurrentRoute(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            );
          })}
        </aside>

        <div className="resize-handle vertical" onMouseDown={(event) => beginResize('left', event)} aria-label="Resize left sidebar" />

        <aside className="explorer-panel" style={{ width: explorerWidth }}>
          <div className="panel-title-row">
            <span className="panel-name">Files</span>
            <button type="button" className="link-button small" onClick={() => setCurrentRoute('files')}>
              Browse
            </button>
          </div>

          <div className="tree-search">
            <span>⌕</span>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search files..."
              aria-label="Search file tree"
            />
          </div>

          <div className="folder-tree">
            <div className="folder-group open">
              <div className="folder-row">
                <span className="folder-arrow">▾</span>
                <span>src/</span>
              </div>
              <div className="tree-list nested">
                <button
                  type="button"
                  className={`tree-item ${selectedFile.name === 'customer_update.rpg' ? 'active' : ''}`}
                  onClick={() => setSelectedFilePath(repoFiles[0].path)}
                >
                  customer_update.rpg
                </button>
                <button
                  type="button"
                  className={`tree-item ${selectedFile.name === 'credit_validation.rpg' ? 'active' : ''}`}
                  onClick={() => setSelectedFilePath(repoFiles[2].path)}
                >
                  credit_validation.rpg
                </button>
                <button
                  type="button"
                  className={`tree-item ${selectedFile.name === 'address_rules.clle' ? 'active' : ''}`}
                  onClick={() => setSelectedFilePath(repoFiles[3].path)}
                >
                  address_rules.clle
                </button>
              </div>
            </div>
          </div>

          <div className="file-list">
            {fileTree.map((file) => (
              <button
                type="button"
                key={file.path}
                className={`file-item ${selectedFile.path === file.path ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedFilePath(file.path);
                  setCurrentRoute('files');
                }}
              >
                <span className="file-icon">◫</span>
                <span>{file.name}</span>
              </button>
            ))}
          </div>

          <div className="explorer-footer">
            {fileTree.length} files • {analysis?.modules.length ?? 0} modules
          </div>
        </aside>

        <div className="resize-handle vertical" onMouseDown={(event) => beginResize('explorer', event)} aria-label="Resize explorer panel" />

        <main className="editor-panel">
          {loading ? (
            <div className="loading-state" role="status" aria-live="polite">
              <div className="loading-title">Real-time AI analysis</div>
              <div className="loading-phase">{analysisPhase}</div>
              <div className="loading-progress" aria-label="Analysis progress">
                <span style={{ width: `${analysisProgress}%` }} />
              </div>
              <div className="loading-metrics">
                <span>{analysisProgress}% complete</span>
                <span>{selectedProjectRecord?.name ?? 'Customer Operations'}</span>
              </div>
            </div>
          ) : (
            renderWorkspaceMain()
          )}
        </main>

        <div className="resize-handle vertical" onMouseDown={(event) => beginResize('overview', event)} aria-label="Resize context panel" />

        <aside className="overview-panel" style={{ width: overviewWidth }}>
          {renderRightPanel()}
        </aside>

        <div className="resize-handle vertical" onMouseDown={(event) => beginResize('agent', event)} aria-label="Resize AI panel" />

        <aside className="agent-panel" style={{ width: agentWidth }}>
          <div className="panel-title-row compact-row">
            <span className="panel-name">IBM watsonx Agent</span>
            <span className="mini-actions">{agentLoading ? 'Thinking…' : aiStatus === 'Connected' ? 'Live' : 'Live'}</span>
          </div>

          <div className="agent-quick-prompts">
            {[
              'How do I onboard this repository?',
              'What business rules exist?',
              'Show me the dependencies',
              'What could break if I change this?',
              'What should I inspect first?'
            ].map((prompt) => (
              <button key={prompt} type="button" className="quick-prompt-btn" onClick={() => setAgentInput(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="agent-content" ref={agentScrollRef}>
            {agentMessages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className={`agent-block ${msg.role === 'agent' ? 'light' : 'user-msg'}`}>
                <div className="agent-label-row">
                  <span className="agent-role-tag">{msg.role === 'agent' ? '🤖 IBM watsonx' : '👤 You'}</span>
                  {msg.source && <span className="agent-source-tag">{msg.source}</span>}
                </div>
                <div className="agent-msg-text">{msg.text}</div>
              </div>
            ))}
            {agentLoading && (
              <div className="agent-block light">
                <div className="agent-msg-text agent-typing">Thinking…</div>
              </div>
            )}
          </div>

          <div className="agent-input-wrap">
            <input
              type="text"
              placeholder="Ask about this repository..."
              value={agentInput}
              onChange={(event) => setAgentInput(event.target.value)}
              onKeyDown={handleAgentKeyDown}
              disabled={agentLoading}
              aria-label="Ask about the repository"
            />
            <button
              type="button"
              className="agent-send-btn"
              onClick={sendAgentMessage}
              disabled={agentLoading || !agentInput.trim()}
              aria-label="Send agent message"
            >
              ↑
            </button>
          </div>
        </aside>
      </main>

      <footer className="statusbar">
        <div className="status-left">
          <span className="status-item ok">{uploadMessage || 'Analysis complete'}</span>
          <span className="status-item">{selectedProjectRecord?.technology ?? 'IBM i / RPG / SQL'}</span>
          <span className="status-item">{analysis ? `${analysis.readiness}% readiness` : 'No repository loaded'}</span>
        </div>
        <div className="status-right">
          <span className="status-item warn">{analysis?.businessRules.length ?? 0} business rules</span>
          <span className="status-item">IBM watsonx {aiStatus}</span>
          <span className="status-item ready">Ready</span>
        </div>
      </footer>
    </div>
  );
}
