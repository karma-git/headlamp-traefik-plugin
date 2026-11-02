const INDENT = '  ';

function groupEnd(s: string, open: number): number {
  let depth = 0;
  let tick = false;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (c === '`') tick = !tick;
    else if (!tick && c === '(') depth++;
    else if (!tick && c === ')' && --depth === 0) return i;
  }
  return s.length - 1;
}

function splitTop(s: string): { parts: string[]; ops: string[] } {
  const parts: string[] = [];
  const ops: string[] = [];
  let depth = 0;
  let tick = false;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '`') tick = !tick;
    if (!tick) {
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (depth === 0 && (s.startsWith('&&', i) || s.startsWith('||', i))) {
        parts.push(cur.trim());
        ops.push(s.slice(i, i + 2));
        cur = '';
        i++;
        continue;
      }
    }
    cur += c;
  }
  parts.push(cur.trim());
  return { parts, ops };
}

function fmt(expr: string, level: number): string[] {
  const { parts, ops } = splitTop(expr.trim());
  const pad = INDENT.repeat(level);
  const lines: string[] = [];
  parts.forEach((p, idx) => {
    const op = idx < ops.length ? ` ${ops[idx]}` : '';
    if (
      p.startsWith('(') &&
      groupEnd(p, 0) === p.length - 1 &&
      splitTop(p.slice(1, -1)).parts.length > 1
    ) {
      lines.push(`${pad}(`);
      lines.push(...fmt(p.slice(1, -1), level + 1));
      lines.push(`${pad})${op}`);
    } else {
      lines.push(`${pad}${p}${op}`);
    }
  });
  return lines;
}

export function formatRule(rule: string): string {
  const flat = rule.replace(/\s+/g, ' ').trim();
  return fmt(flat, 0).join('\n');
}
