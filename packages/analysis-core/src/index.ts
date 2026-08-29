import { buildDependencyMap } from '@legacy-lens/dependency-engine';
import { extractBusinessRules } from '@legacy-lens/business-rules-engine';
import { traceDataFlow } from '@legacy-lens/data-flow-engine';
import { assessImpact } from '@legacy-lens/impact-engine';
import { buildOnboardingPlan } from '@legacy-lens/onboarding-engine';
import { scanRepository } from '@legacy-lens/repository-engine';
import type { AnalysisRequest, AnalysisResult, RepositoryFile } from '@legacy-lens/types';

const DEFAULT_FILES: RepositoryFile[] = [
  { name: 'customer_update.rpg', path: 'src/customer/customer_update.rpg', language: 'rpg', extension: 'rpg', size: 5512, category: 'business-process', summary: 'Updates customer master and address information.', content: 'address required; validate state; customer update required; credit limit check; inactive customer blocked' },
  { name: 'customer_credit_validation.rpg', path: 'src/credit/customer_credit_validation.rpg', language: 'rpg', extension: 'rpg', size: 7021, category: 'validation', summary: 'Validates customer credit and policy thresholds.', content: 'credit limit; balance; customer profile; inactive customer; address required' },
  { name: 'customer_master.sql', path: 'db/customer_master.sql', language: 'sql', extension: 'sql', size: 2871, category: 'schema', summary: 'Defines the customer master table and indexes.', content: 'CREATE TABLE customer_master (id INT, address VARCHAR(255), status VARCHAR(30));' },
  { name: 'address_rules.clle', path: 'src/rules/address_rules.clle', language: 'clle', extension: 'clle', size: 3811, category: 'rules', summary: 'Address validation and postal checks.', content: 'validate state; address required; postal state rules' },
  { name: 'credit_policy.md', path: 'docs/credit_policy.md', language: 'markdown', extension: 'md', size: 2450, category: 'documentation', summary: 'Business policy for approval criteria.', content: 'Customer credit limit is set by balance and approval status.' }
];

export function analyzeRepository(request: AnalysisRequest): AnalysisResult {
  const files = request.files?.length ? request.files : DEFAULT_FILES;
  const scan = scanRepository(files, request.repoName || 'Customer operations legacy project');

  const dependencies = buildDependencyMap(files);
  const businessRules = extractBusinessRules(files);
  const dataFlows = traceDataFlow(files);
  const impacts = assessImpact(files);
  const onboarding = buildOnboardingPlan();

  const recommendationText = [
    'Start with the customer update and validation routines before making any changes.',
    'Trace the data contract between the master files and any downstream reporting or billing modules.',
    'Verify business rules for address validity and credit limits before validating the patch.',
    'Run regression checks for customer profile, credit review, and any downstream ledger updates.'
  ];

  const readiness = Math.min(95, 62 + businessRules.length * 8 + dataFlows.length * 4);

  return {
    task: request.task,
    systemName: 'Legacy Lens',
    repositoryName: request.repoName,
    generatedAt: new Date().toISOString(),
    technologies: scan.technologies,
    summary: scan.summary,
    entryPoints: scan.entryPoints,
    modules: scan.modules,
    dependencies,
    businessRules,
    dataFlows,
    impacts,
    onboarding,
    readiness: Math.round(readiness),
    recommendations: recommendationText,
    evidence: [
      'customer_update.rpg contains the address update workflow',
      'customer_credit_validation.rpg contains credit decision logic',
      'customer_master.sql defines the authoritative customer record',
      'address_rules.clle imposes validation requirements',
      'credit_policy.md documents the approval guidance'
    ]
  };
}
