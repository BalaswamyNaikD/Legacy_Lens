export type Severity = 'low' | 'medium' | 'high';
export type FlowType = 'read' | 'write' | 'transform' | 'api';

export interface RepositoryFile {
  name: string;
  path: string;
  language: string;
  extension: string;
  size: number;
  category: string;
  summary: string;
  content?: string;
}

export interface DependencyNode {
  id: string;
  source: string;
  target: string;
  kind: 'call' | 'include' | 'reads' | 'writes' | 'query';
  evidence: string;
}

export interface BusinessRule {
  id: string;
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  severity: Severity;
}

export interface DataFlowNode {
  id: string;
  from: string;
  to: string;
  flowType: FlowType;
  description: string;
}

export interface ImpactScope {
  id: string;
  program: string;
  reason: string;
  risk: Severity;
}

export interface OnboardingStep {
  order: number;
  title: string;
  why: string;
  read: string[];
}

export interface ProjectRecord {
  id: string;
  name: string;
  repository: string;
  lastAnalysis: string;
  technology: string;
  status: 'healthy' | 'needs-review' | 'risk';
}

export interface AnalysisResult {
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
}

export interface AnalysisRequest {
  repoName: string;
  task: string;
  files?: RepositoryFile[];
}
