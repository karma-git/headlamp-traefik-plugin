import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { getConfig } from './config';

const CRD_API = '/apis/traefik.io/v1alpha1';
export const INGRESS_CLASS = 'kubernetes.io/ingress.class';

export interface IngressRouteService {
  name: string;
  namespace?: string;
  port?: string | number;
  kind?: string;
  weight?: number;
}

export interface IngressRouteRule {
  match: string;
  priority?: number;
  middlewares?: { name: string; namespace?: string }[];
  services?: IngressRouteService[];
}

export interface Middleware {
  metadata: { name: string; namespace: string };
  spec: Record<string, any>;
}

export interface IngressRoute {
  metadata: { name: string; namespace: string; annotations?: Record<string, string> };
  spec: { entryPoints?: string[]; routes?: IngressRouteRule[] };
}

export interface TraefikApiService {
  name: string;
  status?: string;
  serverStatus?: Record<string, string>;
}

export interface Pod {
  metadata: { name: string; namespace: string; labels?: Record<string, string> };
  status?: { phase?: string };
}

export interface PodRef {
  namespace: string;
  name: string;
}

export const TRAEFIK_POD_SELECTOR = 'app.kubernetes.io/name=traefik';

const podProxy = (pod: PodRef, port: number, path: string) =>
  `/api/v1/namespaces/${pod.namespace}/pods/${pod.name}:${port}/proxy${path}`;

// Without a configured namespace, Traefik pods are discovered across the whole cluster.
export const podsUrl = (namespace: string) =>
  `/api/v1${namespace ? `/namespaces/${namespace}` : ''}/pods?labelSelector=${encodeURIComponent(
    TRAEFIK_POD_SELECTOR
  )}`;

export function groupInstances(pods: Pod[]): Record<string, PodRef[]> {
  const out: Record<string, PodRef[]> = {};
  for (const p of pods) {
    const inst = p.metadata.labels?.['app.kubernetes.io/instance'];
    if (inst && p.status?.phase === 'Running') {
      (out[inst] ??= []).push({ namespace: p.metadata.namespace, name: p.metadata.name });
    }
  }
  return out;
}

export async function listInstances(): Promise<Record<string, PodRef[]>> {
  const res = await ApiProxy.request(podsUrl(getConfig().namespace));
  return groupInstances((res.items ?? []) as Pod[]);
}

export const ingressClass = (o: { metadata: { annotations?: Record<string, string> } }) =>
  o.metadata.annotations?.[INGRESS_CLASS] ?? '';

// An instance configured with an ingressClass only serves routes annotated with it; without
// one it serves the routes that have no annotation. We cannot read the provider settings, so
// an instance counts as class-filtered when some route carries its name.
export function routesForInstance<T extends IngressRoute>(irs: T[], instance: string): T[] {
  const filtered = irs.some(ir => ingressClass(ir) === instance);
  return irs.filter(ir => ingressClass(ir) === (filtered ? instance : ''));
}

export async function fetchMetricsText(pod: PodRef): Promise<string> {
  const res = await ApiProxy.request(podProxy(pod, getConfig().metricsPort, '/metrics'), {
    isJSON: false,
  });
  return res.text();
}

export async function fetchTraefikServices(pod: PodRef): Promise<TraefikApiService[]> {
  return ApiProxy.request(podProxy(pod, getConfig().apiPort, '/api/http/services?per_page=1000'));
}

export async function listTraefikObjects(plural: string): Promise<any[]> {
  const res = await ApiProxy.request(`${CRD_API}/${plural}`);
  return res.items ?? [];
}

export const listAllIngressRoutes = () =>
  listTraefikObjects('ingressroutes') as Promise<IngressRoute[]>;

export async function getTraefikObject(plural: string, namespace: string, name: string) {
  return ApiProxy.request(`${CRD_API}/namespaces/${namespace}/${plural}/${name}`);
}
