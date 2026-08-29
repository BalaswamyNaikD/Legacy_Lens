export function traceDataFlow(files) {
    const dataFlows = [];
    files.forEach((file) => {
        const lower = file.name.toLowerCase();
        if (lower.includes('address')) {
            dataFlows.push({ id: 'flow-address', from: 'customer_master', to: 'address_update', flowType: 'read', description: 'Customer address data enters the update workflow for validation.' });
        }
        if (lower.includes('credit')) {
            dataFlows.push({ id: 'flow-credit', from: 'credit_profile', to: 'approval_engine', flowType: 'transform', description: 'Credit data is transformed into a decision result.' });
        }
        if (lower.includes('customer')) {
            dataFlows.push({ id: 'flow-customer', from: 'customer_portal', to: 'customer_table', flowType: 'write', description: 'Customer updates are persisted to the master table.' });
        }
    });
    return dataFlows;
}
