import { describe, expect, it } from 'vitest';
import { extractPaths, pathMatches } from './ruleUtils';

const rule = 'Method(`GET`) && (Path(`/a/b`) || PathPrefix(`/p/`) || PathRegexp(`^/r/[^/]+/x$`))';

describe('ruleUtils', () => {
  it('extracts paths', () => {
    expect(extractPaths(rule).map(p => p.kind)).toEqual(['Path', 'PathPrefix', 'PathRegexp']);
  });
  it('matches substring and concrete paths', () => {
    expect(pathMatches(rule, 'a/b')).toBe(true);
    expect(pathMatches(rule, '/p/deep/er')).toBe(true);
    expect(pathMatches(rule, '/r/42/x')).toBe(true);
    expect(pathMatches(rule, '/r/42/y')).toBe(false);
    expect(pathMatches(rule, '/zzz')).toBe(false);
  });
});
