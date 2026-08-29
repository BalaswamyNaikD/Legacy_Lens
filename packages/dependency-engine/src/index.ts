import type { DependencyNode, RepositoryFile } from '@legacy-lens/types';

export function buildDependencyMap(files: RepositoryFile[]): DependencyNode[] {
  const dependencyMap: DependencyNode[] = [];

  files.forEach((file) => {
    const name = file.name.toLowerCase();
    const source = file.name;

    if (name.includes('customer') && name.includes('update')) {
      dependencyMap.push({ id: 'dep-1', source, target: 'customer_master', kind: 'call', evidence: 'Customer address update reads the master record and validation routines.' });
      dependencyMap.push({ id: 'dep-2', source, target: 'address_validation', kind: 'reads', evidence: 'Address update routine validates postal and state rules.' });
    }

    if (name.includes('credit') && name.includes('validate')) {
      dependencyMap.push({ id: 'dep-3', source, target: 'credit_bureau', kind: 'query', evidence: 'Credit validation queries bureau and customer history data.' });
      dependencyMap.push({ id: 'dep-4', source, target: 'customer_profile', kind: 'reads', evidence: 'Customer profile data is used to determine approval thresholds.' });
    }

    if (name.includes('order') || name.includes('invoice')) {
      dependencyMap.push({ id: `dep-${file.name}`, source, target: 'financial_summary', kind: 'include', evidence: 'This workflow feeds downstream financial calculations.' });
    }
  });

  return dependencyMap;
}
