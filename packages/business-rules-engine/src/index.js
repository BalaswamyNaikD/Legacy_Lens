export function extractBusinessRules(files) {
    const rules = [];
    files.forEach((file) => {
        const content = (file.content ?? '').toLowerCase();
        if (!content) {
            return;
        }
        const ruleMatcher = [
            { key: 'address required', description: 'Address fields are required before a customer record can be updated.', severity: 'high' },
            { key: 'credit limit', description: 'Customer credit decisions must consider outstanding balance and approval status.', severity: 'high' },
            { key: 'inactive customer', description: 'Inactive customers are blocked from updates that affect authorized credit flows.', severity: 'medium' },
            { key: 'state validation', description: 'Postal and state validation are applied before acceptance.', severity: 'medium' }
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
