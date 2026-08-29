export function assessImpact(files) {
    const candidates = [];
    files.forEach((file) => {
        const name = file.name.toLowerCase();
        if (name.includes('customer')) {
            candidates.push({ id: 'impact-customer', program: 'Customer Profile Service', reason: 'Customer data changes can affect profile, status, and authorization logic.', risk: 'high' });
        }
        if (name.includes('address')) {
            candidates.push({ id: 'impact-address', program: 'Address Validation Routine', reason: 'Address validation logic is shared across update flows.', risk: 'medium' });
        }
        if (name.includes('credit')) {
            candidates.push({ id: 'impact-credit', program: 'Credit Review Flow', reason: 'Credit decisions depend on thresholds and account state.', risk: 'high' });
        }
    });
    return candidates.length ? candidates : [{ id: 'impact-default', program: 'Core Transaction Flow', reason: 'Broader business workflows may need regression coverage after a routine change.', risk: 'medium' }];
}
