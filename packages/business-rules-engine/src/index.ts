import type { BusinessRule, RepositoryFile } from '@legacy-lens/types';

export function extractBusinessRules(files: RepositoryFile[]): BusinessRule[] {
  const rules: BusinessRule[] = [];

  files.forEach((file) => {
    const content = (file.content ?? '').toLowerCase();
    if (!content) {
      return;
    }

    const ruleMatcher = [
      { key: 'address required', description: 'Address fields are required before a customer record can be updated.', severity: 'high' as const },
      { key: 'credit limit', description: 'Customer credit decisions must consider outstanding balance and approval status.', severity: 'high' as const },
      { key: 'inactive customer', description: 'Inactive customers are blocked from updates that affect authorized credit flows.', severity: 'medium' as const },
      { key: 'state validation', description: 'Postal and state validation are applied before acceptance.', severity: 'medium' as const }
    ];

    ruleMatcher.forEach((candidate, index) => {
      if (content.includes(candidate.key)) {
        rules.push({
          id: `rule-${index + 1}`,
          title: candidate.key.replace(/\b\w/g, (letter) => letter.toUpperCase()),
          description: candidate.description,
          evidence: [file.name],
          confidence: 0.86,
          severity: candidate.severity
        });
      }
    });
  });

  return rules.length ? rules : [
    {
      id: 'rule-default',
      title: 'Update gate validation',
      description: 'Routine updates must pass state, authorization, and business control checks before records are persisted.',
      evidence: ['repository policy analysis'],
      confidence: 0.74,
      severity: 'medium'
    }
  ];
}
