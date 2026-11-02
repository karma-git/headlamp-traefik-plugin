import React from 'react';
import { formatRule } from './formatRule';
import { MATCHER } from './ruleUtils';

const COLORS: Record<string, string> = {
  Host: '#42a5f5',
  HostRegexp: '#42a5f5',
  HostSNI: '#42a5f5',
  Method: '#ab47bc',
  Path: '#66bb6a',
  PathPrefix: '#66bb6a',
  PathRegexp: '#66bb6a',
};

export default function RuleView({ rule, pretty }: { rule: string; pretty: boolean }) {
  const text = pretty ? formatRule(rule) : rule.replace(/\s+/g, ' ').trim();
  const nodes: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(MATCHER)) {
    const idx = m.index ?? 0;
    if (idx > last) nodes.push(text.slice(last, idx));
    const color = COLORS[m[1]];
    nodes.push(
      <span key={idx} style={color ? { color, fontWeight: 600 } : undefined}>
        {m[0]}
      </span>
    );
    last = idx + m[0].length;
  }
  nodes.push(text.slice(last));
  return (
    <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      {nodes}
    </pre>
  );
}
