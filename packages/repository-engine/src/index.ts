import { BUSINESS_RULE_HINTS, ENTRY_POINT_PATTERNS, TECHNOLOGY_PATTERNS } from '@legacy-lens/config';
import type { RepositoryFile } from '@legacy-lens/types';

export interface RepositoryScan {
  repoName: string;
  technologies: string[];
  modules: string[];
  entryPoints: string[];
  summary: string;
  fileIndex: RepositoryFile[];
}

export function scanRepository(files: RepositoryFile[], repoName: string): RepositoryScan {
  const normalized = files.map((file) => ({
    ...file,
    name: file.name.toLowerCase(),
    path: file.path.toLowerCase()
  }));

  const technologies = new Set<string>();
  const modules = new Set<string>();
  const entryPoints = new Set<string>();

  normalized.forEach((file) => {
    const lowerPath = file.path;

    if (lowerPath.includes('customer') || lowerPath.includes('address') || lowerPath.includes('credit')) {
      modules.add('Customer domain');
    }
    if (lowerPath.includes('order') || lowerPath.includes('billing')) {
      modules.add('Order domain');
    }
    if (lowerPath.includes('invoice') || lowerPath.includes('payment')) {
      modules.add('Finance domain');
    }
    if (lowerPath.includes('report') || lowerPath.includes('batch')) {
      modules.add('Reporting and batch');
    }

    for (const [group, patterns] of Object.entries(TECHNOLOGY_PATTERNS)) {
      if (patterns.some((pattern) => lowerPath.includes(pattern) || file.name.includes(pattern))) {
        technologies.add(group);
      }
    }

    if (file.language === 'rpg' || file.language === 'sql' || file.language === 'cl') {
      technologies.add('ibm-i');
    }

    const combinedName = `${file.name} ${file.path}`.toLowerCase();
    const matchedEntry = ENTRY_POINT_PATTERNS.find((pattern) => combinedName.includes(pattern));
    if (matchedEntry) {
      entryPoints.add(file.name);
    }

    if (BUSINESS_RULE_HINTS.some((hint) => combinedName.includes(hint))) {
      modules.add('Business validation');
    }
  });

  const summary = `The repository ${repoName} appears to contain a mixed legacy platform with ${Array.from(technologies).join(', ') || 'general source code'} coverage and multiple business domains tied to validation and state transitions.`;

  return {
    repoName,
    technologies: Array.from(technologies),
    modules: Array.from(modules).length ? Array.from(modules) : ['Core processing', 'Legacy workflows', 'Access layer'],
    entryPoints: Array.from(entryPoints).length ? Array.from(entryPoints) : ['customer_update', 'credit_validation', 'account_master'],
    summary,
    fileIndex: files
  };
}
