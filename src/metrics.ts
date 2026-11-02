export interface ServiceCounters {
  total: number;
  errors: number;
  buckets: Map<number, number>;
}

export interface Snapshot {
  t: number;
  services: Map<string, ServiceCounters>;
  reloads: number;
  openConnections: number;
}

export interface ServiceRate {
  name: string;
  rps: number;
  errorRate: number;
  p95Ms: number | null;
}

const LINE = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(.*)\})?\s+(\S+)/;
const LABEL = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:[^"\\]|\\.)*)"/g;

export function parseMetrics(texts: string[], t: number): Snapshot {
  const snap: Snapshot = { t, services: new Map(), reloads: 0, openConnections: 0 };
  const svc = (name: string) => {
    const key = shortServiceName(name);
    let s = snap.services.get(key);
    if (!s) snap.services.set(key, (s = { total: 0, errors: 0, buckets: new Map() }));
    return s;
  };
  for (const text of texts) {
    for (const line of text.split('\n')) {
      if (!line.startsWith('traefik_')) continue;
      const m = LINE.exec(line);
      if (!m) continue;
      const [, metric, rawLabels = '', rawValue] = m;
      const value = Number(rawValue);
      if (Number.isNaN(value)) continue;
      if (metric === 'traefik_config_reloads_total') snap.reloads += value;
      else if (metric === 'traefik_open_connections') snap.openConnections += value;
      else if (
        metric === 'traefik_service_requests_total' ||
        metric === 'traefik_service_request_duration_seconds_bucket'
      ) {
        const labels: Record<string, string> = {};
        for (const l of rawLabels.matchAll(LABEL)) labels[l[1]] = l[2];
        if (!labels.service) continue;
        const s = svc(labels.service);
        if (metric === 'traefik_service_requests_total') {
          s.total += value;
          if (labels.code?.startsWith('5')) s.errors += value;
        } else {
          const le = labels.le === '+Inf' ? Infinity : Number(labels.le);
          s.buckets.set(le, (s.buckets.get(le) ?? 0) + value);
        }
      }
    }
  }
  return snap;
}

const delta = (a: number, b: number) => Math.max(0, b - a);

function quantile(q: number, buckets: Map<number, number>, prev?: Map<number, number>) {
  const les = [...buckets.keys()].sort((a, b) => a - b);
  const counts = les.map(le => delta(prev?.get(le) ?? 0, buckets.get(le)!));
  const total = counts[counts.length - 1];
  if (!total) return null;
  const rank = q * total;
  let lowLe = 0;
  let lowCount = 0;
  for (let i = 0; i < les.length; i++) {
    if (counts[i] >= rank) {
      if (les[i] === Infinity) return lowLe;
      const span = counts[i] - lowCount;
      return lowLe + (les[i] - lowLe) * (span ? (rank - lowCount) / span : 0);
    }
    lowLe = les[i];
    lowCount = counts[i];
  }
  return null;
}

export function computeRates(oldest: Snapshot, latest: Snapshot) {
  const dt = (latest.t - oldest.t) / 1000;
  const services: ServiceRate[] = [];
  for (const [name, cur] of latest.services) {
    const prev = oldest.services.get(name);
    const reqs = delta(prev?.total ?? 0, cur.total);
    const errs = delta(prev?.errors ?? 0, cur.errors);
    const p95 = quantile(0.95, cur.buckets, prev?.buckets);
    services.push({
      name,
      rps: reqs / dt,
      errorRate: reqs ? errs / reqs : 0,
      p95Ms: p95 === null ? null : p95 * 1000,
    });
  }
  const total = services.reduce((a, s) => a + s.rps, 0);
  const errRps = services.reduce((a, s) => a + s.rps * s.errorRate, 0);
  return {
    services,
    rps: total,
    errorRate: total ? errRps / total : 0,
    reloads: delta(oldest.reloads, latest.reloads),
  };
}

export const shortServiceName = (name: string) =>
  name.replace(/@.*$/, '').replace(/-[0-9a-f]{20}$/, '');
