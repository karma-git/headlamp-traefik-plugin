import { describe, expect, it } from 'vitest';
import { computeRates, parseMetrics, shortServiceName } from './metrics';

const mk = (ok: number, err: number, b01: number, b03: number, inf: number) => `
traefik_service_requests_total{code="200",method="GET",protocol="http",service="svc-aaaaaaaaaaaaaaaaaaaa@kubernetescrd"} ${ok}
traefik_service_requests_total{code="502",method="GET",protocol="http",service="svc-aaaaaaaaaaaaaaaaaaaa@kubernetescrd"} ${err}
traefik_service_request_duration_seconds_bucket{code="200",method="GET",protocol="http",service="svc-aaaaaaaaaaaaaaaaaaaa@kubernetescrd",le="0.1"} ${b01}
traefik_service_request_duration_seconds_bucket{code="200",method="GET",protocol="http",service="svc-aaaaaaaaaaaaaaaaaaaa@kubernetescrd",le="0.3"} ${b03}
traefik_service_request_duration_seconds_bucket{code="200",method="GET",protocol="http",service="svc-aaaaaaaaaaaaaaaaaaaa@kubernetescrd",le="+Inf"} ${inf}
traefik_config_reloads_total 5
`;

describe('metrics', () => {
  it('computes rps, error rate and p95 from deltas', () => {
    const a = parseMetrics([mk(100, 0, 100, 100, 100)], 0);
    const b = parseMetrics([mk(190, 10, 190, 198, 200)], 10000);
    const r = computeRates(a, b);
    expect(r.rps).toBeCloseTo(10);
    expect(r.errorRate).toBeCloseTo(0.1);
    expect(r.services[0].p95Ms).toBeGreaterThan(100);
    expect(r.services[0].p95Ms).toBeLessThanOrEqual(300);
  });
  it('shortens service names', () => {
    expect(shortServiceName('svc-aaaaaaaaaaaaaaaaaaaa@kubernetescrd')).toBe('svc');
  });
});
