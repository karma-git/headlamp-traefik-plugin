import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import React from 'react';
import { IngressRoute, listIngressRoutes } from './api';
import { pathMatches } from './ruleUtils';
import RuleView from './RuleView';
import { InstanceSelect, useInstances } from './useInstance';

interface Ref {
  name: string;
  namespace: string;
  kind?: string;
  label: string;
}

interface Flow {
  route: Ref;
  rule: string;
  entryPoints: string;
  middlewares: Ref[];
  services: Ref[];
  priority?: number;
}

const external = (name: string) => name.includes('@');

function toFlows(irs: IngressRoute[]): Flow[] {
  return irs.flatMap(ir => {
    const ns = ir.metadata.namespace;
    return (ir.spec.routes ?? []).map(r => ({
      route: { name: ir.metadata.name, namespace: ns, label: ir.metadata.name },
      rule: r.match,
      entryPoints: (ir.spec.entryPoints ?? []).join(', '),
      priority: r.priority,
      middlewares: (r.middlewares ?? []).map(m => ({
        name: m.name,
        namespace: m.namespace ?? ns,
        label: m.name,
      })),
      services: (r.services ?? []).map(s => ({
        name: s.name,
        namespace: s.namespace ?? ns,
        kind: s.kind,
        label: `${s.namespace ? s.namespace + '/' : ''}${s.name}${s.port ? ':' + s.port : ''}`,
      })),
    }));
  });
}

function RefLink(props: { r: Ref; crd?: string; chip?: boolean }) {
  const { r, crd, chip } = props;
  const link = external(r.name) ? (
    r.label
  ) : crd ? (
    <Link routeName="customresource" params={{ crd, namespace: r.namespace, crName: r.name }}>
      {r.label}
    </Link>
  ) : (
    <Link routeName="service" params={{ namespace: r.namespace, name: r.name }}>
      {r.label}
    </Link>
  );
  return chip ? <Chip size="small" style={{ margin: 2 }} label={link} /> : <>{link}</>;
}

function ServiceRef({ r }: { r: Ref }) {
  return (
    <RefLink r={r} crd={r.kind === 'TraefikService' ? 'traefikservices.traefik.io' : undefined} />
  );
}

export default function Configuration() {
  const { instances, instance, setInstance, error: instErr } = useInstances();
  const [routes, setRoutes] = React.useState<IngressRoute[]>([]);
  const [filter, setFilter] = React.useState('');
  const [pathQuery, setPathQuery] = React.useState('');
  const [pretty, setPretty] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!instance) return;
    setError('');
    listIngressRoutes(instance)
      .then(setRoutes)
      .catch(e => setError(String(e?.message ?? e)));
  }, [instance]);

  const flows = React.useMemo(() => {
    const q = filter.toLowerCase();
    return toFlows(routes).filter(
      f => pathMatches(f.rule, pathQuery) && (!q || JSON.stringify(f).toLowerCase().includes(q))
    );
  }, [routes, filter, pathQuery]);

  return (
    <SectionBox
      title={`Traefik Configuration — ${routes.length} IngressRoutes, ${flows.length} routes`}
      headerProps={{
        actions: [
          <InstanceSelect key="i" instances={instances} value={instance} onChange={setInstance} />,
        ],
      }}
    >
      {(error || instErr) && <Typography color="error">{error || instErr}</Typography>}
      <Box py={1} display="flex" gap={2} alignItems="center">
        <TextField
          size="small"
          style={{ flex: 1 }}
          placeholder="Search by path: substring or concrete path, e.g. /loyalty/v2/summary"
          value={pathQuery}
          onChange={e => setPathQuery(e.target.value)}
        />
        <TextField
          size="small"
          style={{ flex: 1 }}
          placeholder="Filter by anything…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <FormControlLabel
          label="Prettify rule"
          control={<Switch checked={pretty} onChange={e => setPretty(e.target.checked)} />}
        />
      </Box>
      <SimpleTable
        data={flows}
        columns={[
          {
            label: 'IngressRoute',
            getter: (f: Flow) => <RefLink r={f.route} crd="ingressroutes.traefik.io" />,
          },
          {
            label: 'Rule',
            getter: (f: Flow) => <RuleView rule={f.rule} pretty={pretty} />,
          },
          { label: 'Prio', getter: (f: Flow) => f.priority ?? '' },
          { label: 'EntryPoints', getter: (f: Flow) => f.entryPoints },
          {
            label: 'Middlewares',
            getter: (f: Flow) =>
              f.middlewares.map(m => (
                <RefLink key={m.name} r={m} crd="middlewares.traefik.io" chip />
              )),
          },
          {
            label: 'Service',
            getter: (f: Flow) =>
              f.services.map(s => (
                <div key={s.label}>
                  <ServiceRef r={s} />
                </div>
              )),
          },
        ]}
      />
    </SectionBox>
  );
}
