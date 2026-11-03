import {
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Typography } from '@mui/material';
import React from 'react';
import { useParams } from 'react-router-dom';
import { getTraefikObject, ingressClass, IngressRoute, listAllIngressRoutes } from './api';
import { Ref, RefLink, ServiceRef, serviceRef } from './refs';
import RuleView from './RuleView';

const stringify = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));

export function IngressRouteDetails({ ir }: { ir: IngressRoute }) {
  const ns = ir.metadata.namespace;
  const routes = ir.spec.routes ?? [];
  return (
    <SectionBox title={`Routes (${routes.length})`}>
      <NameValueTable
        rows={[{ name: 'EntryPoints', value: (ir.spec.entryPoints ?? []).join(', ') || '-' }]}
      />
      <SimpleTable
        data={routes}
        columns={[
          { label: 'Rule', getter: r => <RuleView rule={r.match} pretty /> },
          { label: 'Prio', getter: r => r.priority ?? '' },
          {
            label: 'Middlewares',
            getter: r =>
              (r.middlewares ?? []).map(m => (
                <RefLink
                  key={`${m.namespace ?? ns}/${m.name}`}
                  r={{ name: m.name, namespace: m.namespace ?? ns, label: m.name }}
                  crd="middlewares.traefik.io"
                  chip
                />
              )),
          },
          {
            label: 'Service',
            getter: r =>
              (r.services ?? []).map(s => {
                const ref = serviceRef(s, ns);
                return (
                  <div key={ref.label}>
                    <ServiceRef r={ref} />
                    {s.weight !== undefined && ` (weight ${s.weight})`}
                  </div>
                );
              }),
          },
        ]}
      />
    </SectionBox>
  );
}

export function MiddlewareDetails({ mw }: { mw: { metadata: any; spec: Record<string, any> } }) {
  const [routes, setRoutes] = React.useState<IngressRoute[] | null>(null);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    listAllIngressRoutes()
      .then(setRoutes)
      .catch(e => setError(String(e?.message ?? e)));
  }, [mw.metadata.name, mw.metadata.namespace]);

  const { name, namespace } = mw.metadata;
  const users = (routes ?? []).flatMap(ir =>
    (ir.spec.routes ?? [])
      .filter(r =>
        (r.middlewares ?? []).some(
          m => m.name === name && (m.namespace ?? ir.metadata.namespace) === namespace
        )
      )
      .map(r => ({ ir, rule: r.match }))
  );
  const irs = new Map<string, { ns: string; n: string; count: number }>();
  for (const { ir } of users) {
    const key = `${ir.metadata.namespace}/${ir.metadata.name}`;
    const e = irs.get(key) ?? { ns: ir.metadata.namespace, n: ir.metadata.name, count: 0 };
    e.count++;
    irs.set(key, e);
  }

  const [type, params] = Object.entries(mw.spec ?? {})[0] ?? ['-', {}];
  const rows =
    params && typeof params === 'object'
      ? Object.entries(params).map(([k, v]) => ({ name: k, value: stringify(v) }))
      : [{ name: String(type), value: stringify(params) }];

  return (
    <>
      <SectionBox title={`Configuration: ${type}`}>
        <NameValueTable rows={rows} />
      </SectionBox>
      <SectionBox title={`Used in ${irs.size} IngressRoutes (${users.length} routes)`}>
        {error && <Typography color="error">{error}</Typography>}
        {routes === null && !error && <Typography>Loading…</Typography>}
        <SimpleTable
          data={[...irs.values()]}
          columns={[
            {
              label: 'IngressRoute',
              getter: (u: { ns: string; n: string }) => (
                <RefLink
                  r={{ name: u.n, namespace: u.ns, label: `${u.ns}/${u.n}` } as Ref}
                  crd="ingressroutes.traefik.io"
                />
              ),
            },
            { label: 'Routes', getter: (u: { count: number }) => u.count },
          ]}
        />
      </SectionBox>
    </>
  );
}

export function TraefikServiceDetails({
  ts,
}: {
  ts: { metadata: any; spec: Record<string, any> };
}) {
  const ns = ts.metadata.namespace;
  const kind = ts.spec.weighted ? 'weighted' : ts.spec.mirroring ? 'mirroring' : 'other';
  const cfg = ts.spec.weighted ?? ts.spec.mirroring ?? {};
  const main = ts.spec.mirroring ? [cfg] : [];
  const members = [...main, ...(cfg.services ?? []), ...(cfg.mirrors ?? [])];
  return (
    <SectionBox title={`TraefikService: ${kind}`}>
      <SimpleTable
        data={members}
        columns={[
          {
            label: 'Service',
            getter: (s: any) => <ServiceRef r={serviceRef(s, ns)} />,
          },
          { label: 'Weight', getter: (s: any) => s.weight ?? '' },
          { label: 'Percent', getter: (s: any) => s.percent ?? '' },
        ]}
      />
    </SectionBox>
  );
}

function ObjectPage(props: {
  plural: string;
  kind: string;
  render: (obj: any) => React.ReactNode;
}) {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [obj, setObj] = React.useState<any>(null);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    setObj(null);
    setError('');
    getTraefikObject(props.plural, namespace, name)
      .then(setObj)
      .catch(e => setError(String(e?.message ?? e)));
  }, [props.plural, namespace, name]);

  const crd = `${props.plural}.traefik.io`;
  return (
    <>
      <SectionBox
        title={`${props.kind}: ${name}`}
        headerProps={{
          actions: [
            <Link key="raw" routeName="customresource" params={{ crd, namespace, crName: name }}>
              Raw object
            </Link>,
          ],
        }}
      >
        <NameValueTable
          rows={[
            { name: 'Namespace', value: namespace },
            {
              name: 'Ingress class',
              value: (obj && ingressClass(obj)) || '-',
              hide: props.plural !== 'ingressroutes',
            },
          ]}
        />
        {error && <Typography color="error">{error}</Typography>}
      </SectionBox>
      {obj && props.render(obj)}
    </>
  );
}

export const IngressRoutePage = () => (
  <ObjectPage
    plural="ingressroutes"
    kind="IngressRoute"
    render={o => <IngressRouteDetails ir={o} />}
  />
);
export const MiddlewarePage = () => (
  <ObjectPage plural="middlewares" kind="Middleware" render={o => <MiddlewareDetails mw={o} />} />
);
export const TraefikServicePage = () => (
  <ObjectPage
    plural="traefikservices"
    kind="TraefikService"
    render={o => <TraefikServiceDetails ts={o} />}
  />
);
