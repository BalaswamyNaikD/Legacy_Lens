export function buildOnboardingPlan() {
    return [
        {
            order: 1,
            title: 'Identify the entry point',
            why: 'Start at the front door of the business flow to understand the transaction lifecycle.',
            read: ['customer_update.rpg', 'customer_service.clle', 'customer_controller.sql']
        },
        {
            order: 2,
            title: 'Trace the related files',
            why: 'Understand which data sets, validation routines, and API calls support the record update.',
            read: ['customer_master', 'address_validation', 'postal_rules']
        },
        {
            order: 3,
            title: 'Assess policy and risk',
            why: 'Review business rules and approval gates before changing logic or data transformations.',
            read: ['credit_policy.md', 'status_rules.sql', 'approval_matrix.txt']
        },
        {
            order: 4,
            title: 'Check change impact',
            why: 'Confirm downstream consumers, reports, and integrations that may be affected by the update.',
            read: ['customer_reporting', 'invoice_sync', 'audit_log']
        }
    ];
}
