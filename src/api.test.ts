import { describe, expect, it, vi } from 'vitest';
import { routesForInstance } from './api';
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
      namespace: 'traefik',
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
