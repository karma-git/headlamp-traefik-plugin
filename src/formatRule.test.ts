import { describe, expect, it } from 'vitest';
import { formatRule } from './formatRule';

describe('formatRule', () => {
  it('breaks on top-level and nested operators', () => {
    expect(formatRule('Method(`GET`) && (Path(`/a`) || Path(`/b`))')).toBe(
      'Method(`GET`) &&\n(\n  Path(`/a`) ||\n  Path(`/b`)\n)'
    );
  });
  it('keeps operators inside backticks', () => {
    expect(formatRule('PathRegexp(`^/a(x||y)$`)')).toBe('PathRegexp(`^/a(x||y)$`)');
  });
});
