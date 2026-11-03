import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';

export const PLUGIN_NAME = 'headlamp-traefik-plugin';

export interface TraefikConfig {
  namespace: string;
  metricsPort: number;
  apiPort: number;
}

// Defaults of the official Traefik Helm chart.
export const DEFAULTS: TraefikConfig = {
  namespace: 'traefik',
  metricsPort: 9100,
  apiPort: 8080,
};

export const store = new ConfigStore<Partial<TraefikConfig>>(PLUGIN_NAME);

export function withDefaults(c: Partial<TraefikConfig> | undefined | null): TraefikConfig {
  return {
    namespace: c?.namespace || DEFAULTS.namespace,
    metricsPort: Number(c?.metricsPort) || DEFAULTS.metricsPort,
    apiPort: Number(c?.apiPort) || DEFAULTS.apiPort,
  };
}

export const getConfig = () => withDefaults(store.get());

const useStoreConfig = store.useConfig();
export const useConfig = () => withDefaults(useStoreConfig());
