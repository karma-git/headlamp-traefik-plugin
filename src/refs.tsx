import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip } from '@mui/material';
import React from 'react';

export interface Ref {
  name: string;
  namespace: string;
  kind?: string;
  label: string;
}

const ROUTE_BY_CRD: Record<string, string> = {
  'ingressroutes.traefik.io': 'traefik-ingressroute',
  'middlewares.traefik.io': 'traefik-middleware',
  'traefikservices.traefik.io': 'traefik-traefikservice',
};

const external = (name: string) => name.includes('@');

export function RefLink(props: { r: Ref; crd?: string; chip?: boolean }) {
  const { r, crd, chip } = props;
  const link = external(r.name) ? (
    r.label
  ) : crd ? (
    <Link
      routeName={ROUTE_BY_CRD[crd] ?? 'customresource'}
      params={
        ROUTE_BY_CRD[crd]
          ? { namespace: r.namespace, name: r.name }
          : { crd, namespace: r.namespace, crName: r.name }
      }
    >
      {r.label}
    </Link>
  ) : (
    <Link routeName="service" params={{ namespace: r.namespace, name: r.name }}>
      {r.label}
    </Link>
  );
  return chip ? <Chip size="small" style={{ margin: 2 }} label={link} /> : <>{link}</>;
}

export function ServiceRef({ r }: { r: Ref }) {
  return (
    <RefLink r={r} crd={r.kind === 'TraefikService' ? 'traefikservices.traefik.io' : undefined} />
  );
}

export function serviceRef(
  s: { name: string; namespace?: string; port?: string | number; kind?: string },
  ns: string
): Ref {
  return {
    name: s.name,
    namespace: s.namespace ?? ns,
    kind: s.kind,
    label: `${s.namespace ? s.namespace + '/' : ''}${s.name}${s.port ? ':' + s.port : ''}`,
  };
}
