export const MATCHER = /\b(\w+)\((`[^`]*`(?:\s*,\s*`[^`]*`)*)\)/g;

export interface PathMatcher {
  kind: 'Path' | 'PathPrefix' | 'PathRegexp';
  value: string;
}

export function extractPaths(rule: string): PathMatcher[] {
  const out: PathMatcher[] = [];
  for (const m of rule.matchAll(MATCHER)) {
    if (m[1] === 'Path' || m[1] === 'PathPrefix' || m[1] === 'PathRegexp') {
      for (const v of m[2].matchAll(/`([^`]*)`/g)) out.push({ kind: m[1], value: v[1] });
    }
  }
  return out;
}

export function pathMatches(rule: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  return extractPaths(rule).some(p => {
    if (p.value.includes(q)) return true;
    if (!q.startsWith('/')) return false;
    if (p.kind === 'Path') return p.value === q;
    if (p.kind === 'PathPrefix') return q.startsWith(p.value);
    try {
      return new RegExp(p.value).test(q);
    } catch {
      return false;
    }
  });
}
