import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

export const NAMESPACE = 'traefik';
const METRICS_PORT = 8090;
const API_PORT = 9000;

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
  metadata: { name: string; labels?: Record<string, string> };
  status?: { phase?: string };
}

const podProxy = (pod: string, port: number, path: string) =>
  `/api/v1/namespaces/${NAMESPACE}/pods/${pod}:${port}/proxy${path}`;

export async function listInstances(): Promise<Record<string, string[]>> {
  const res = await ApiProxy.request(
    `/api/v1/namespaces/${NAMESPACE}/pods?labelSelector=${encodeURIComponent(
      'app.kubernetes.io/name=traefik'
    )}`
  );
  const out: Record<string, string[]> = {};
  for (const p of (res.items ?? []) as Pod[]) {
    const inst = p.metadata.labels?.['app.kubernetes.io/instance'];
    if (inst && p.status?.phase === 'Running') {
      (out[inst] ??= []).push(p.metadata.name);
    }
  }
  return out;
}

export async function listIngressRoutes(instance: string): Promise<IngressRoute[]> {
  const res = await ApiProxy.request(
    `/apis/traefik.io/v1alpha1/namespaces/${NAMESPACE}/ingressroutes`
  );
  return ((res.items ?? []) as IngressRoute[]).filter(
    ir => ir.metadata.annotations?.['kubernetes.io/ingress.class'] === instance
  );
}

export async function fetchMetricsText(pod: string): Promise<string> {
  const res = await ApiProxy.request(podProxy(pod, METRICS_PORT, '/metrics'), { isJSON: false });
  return res.text();
}

export async function fetchTraefikServices(pod: string): Promise<TraefikApiService[]> {
  return ApiProxy.request(podProxy(pod, API_PORT, '/api/http/services?per_page=1000'));
}

export async function listAllIngressRoutes(): Promise<IngressRoute[]> {
  const res = await ApiProxy.request(
    `/apis/traefik.io/v1alpha1/namespaces/${NAMESPACE}/ingressroutes`
  );
  return (res.items ?? []) as IngressRoute[];
}

export async function getTraefikObject(plural: string, namespace: string, name: string) {
  return ApiProxy.request(`/apis/traefik.io/v1alpha1/namespaces/${namespace}/${plural}/${name}`);
}

export async function listTraefikObjects(plural: string): Promise<any[]> {
  const res = await ApiProxy.request(`/apis/traefik.io/v1alpha1/namespaces/${NAMESPACE}/${plural}`);
  return res.items ?? [];
}
