import { describe, expect, it, vi } from 'vitest';
import { groupInstances, podsUrl, routesForInstance } from './api';
import { withDefaults } from './config';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {},
  ConfigStore: class {
    get() {
      return {};
    }
    useConfig() {
      return () => ({});
    }
  },
}));

const ir = (name: string, cls?: string) => ({
  metadata: {
    name,
    namespace: 'default',
    annotations: cls ? { 'kubernetes.io/ingress.class': cls } : undefined,
  },
  spec: {},
});

describe('routesForInstance', () => {
  const irs = [ir('a'), ir('b', 'internal'), ir('c', 'external')];
  it('keeps routes annotated with the instance name', () => {
    expect(routesForInstance(irs, 'internal').map(r => r.metadata.name)).toEqual(['b']);
  });
  it('falls back to unannotated routes', () => {
    expect(routesForInstance(irs, 'traefik').map(r => r.metadata.name)).toEqual(['a']);
  });
});

describe('withDefaults', () => {
  it('fills Helm chart defaults', () => {
    expect(withDefaults(undefined)).toEqual({
      namespace: '',
      metricsPort: 9100,
      apiPort: 8080,
    });
  });
  it('keeps overrides', () => {
    expect(withDefaults({ namespace: 'ingress', metricsPort: 8090 })).toEqual({
      namespace: 'ingress',
      metricsPort: 8090,
      apiPort: 8080,
    });
  });
});

describe('podsUrl', () => {
  it('searches all namespaces when none is configured', () => {
    expect(podsUrl('')).toBe('/api/v1/pods?labelSelector=app.kubernetes.io%2Fname%3Dtraefik');
  });
  it('scopes to the configured namespace', () => {
    expect(podsUrl('ingress')).toBe(
      '/api/v1/namespaces/ingress/pods?labelSelector=app.kubernetes.io%2Fname%3Dtraefik'
    );
  });
});

describe('groupInstances', () => {
  const pod = (name: string, namespace: string, inst: string, phase = 'Running') => ({
    metadata: { name, namespace, labels: { 'app.kubernetes.io/instance': inst } },
    status: { phase },
  });
  it('keeps the pod namespace and skips non-running pods', () => {
    expect(
      groupInstances([
        pod('a', 'razer-ingress', 'traefik-razer'),
        pod('b', 'razer-ingress', 'traefik-razer', 'Pending'),
        pod('c', 'edge', 'edge'),
      ])
    ).toEqual({
      'traefik-razer': [{ namespace: 'razer-ingress', name: 'a' }],
      edge: [{ namespace: 'edge', name: 'c' }],
    });
  });
});
