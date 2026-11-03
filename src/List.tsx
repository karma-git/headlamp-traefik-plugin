import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, TextField, Typography } from '@mui/material';
import React from 'react';
import { ingressClass, listTraefikObjects, routesForInstance } from './api';
import { RefLink } from './refs';
import { InstanceSelect, useInstances } from './useInstance';

const specType = (o: any) => Object.keys(o.spec ?? {})[0] ?? '-';

function ListPage(props: {
  title: string;
  plural: string;
  byInstance?: boolean;
  columns: { label: string; getter: (o: any) => React.ReactNode }[];
}) {
  const { instances, instance, setInstance } = useInstances();
  const [items, setItems] = React.useState<any[]>([]);
  const [filter, setFilter] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    listTraefikObjects(props.plural)
      .then(setItems)
      .catch(e => setError(String(e?.message ?? e)));
  }, [props.plural]);

  const q = filter.toLowerCase();
  const rows = (props.byInstance && instance ? routesForInstance(items, instance) : items)
    .filter(o => !q || `${o.metadata.namespace}/${o.metadata.name}`.toLowerCase().includes(q))
    .sort(
      (a, b) =>
        a.metadata.namespace.localeCompare(b.metadata.namespace) ||
        a.metadata.name.localeCompare(b.metadata.name)
    );

  return (
    <SectionBox
      title={`${props.title} (${rows.length})`}
      headerProps={{
        actions: props.byInstance
          ? [
              <InstanceSelect
                key="i"
                instances={instances}
                value={instance}
                onChange={setInstance}
              />,
            ]
          : [],
      }}
    >
      {error && <Typography color="error">{error}</Typography>}
      <Box py={1}>
        <TextField
          fullWidth
          size="small"
          placeholder="Filter by namespace/name…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </Box>
      <SimpleTable
        data={rows}
        columns={[
          {
            label: 'Name',
            getter: (o: any) => (
              <RefLink
                r={{
                  name: o.metadata.name,
                  namespace: o.metadata.namespace,
                  label: o.metadata.name,
                }}
                crd={`${props.plural}.traefik.io`}
              />
            ),
          },
          { label: 'Namespace', getter: (o: any) => o.metadata.namespace },
          ...props.columns,
        ]}
      />
    </SectionBox>
  );
}

export const IngressRoutesList = () => (
  <ListPage
    title="IngressRoutes"
    plural="ingressroutes"
    byInstance
    columns={[
      { label: 'Routes', getter: o => o.spec.routes?.length ?? 0 },
      { label: 'EntryPoints', getter: o => (o.spec.entryPoints ?? []).join(', ') },
      { label: 'Ingress class', getter: ingressClass },
    ]}
  />
);

export const MiddlewaresList = () => (
  <ListPage
    title="Middlewares"
    plural="middlewares"
    columns={[{ label: 'Type', getter: specType }]}
  />
);

export const TraefikServicesList = () => (
  <ListPage
    title="TraefikServices"
    plural="traefikservices"
    columns={[{ label: 'Type', getter: specType }]}
  />
);
