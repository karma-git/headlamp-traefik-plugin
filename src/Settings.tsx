import { Box, TextField } from '@mui/material';
import React from 'react';
import { DEFAULTS, TraefikConfig } from './config';

export default function Settings(props: {
  data?: Partial<TraefikConfig>;
  onDataChange?: (data: Partial<TraefikConfig>) => void;
}) {
  const { data, onDataChange } = props;
  const set = (k: keyof TraefikConfig, v: string) =>
    onDataChange?.({
      ...data,
      [k]: k === 'namespace' ? v.trim() : v === '' ? undefined : Number(v),
    });

  return (
    <Box display="flex" flexDirection="column" gap={2} maxWidth={420}>
      <TextField
        label="Traefik namespace"
        helperText="Namespace of the Traefik pods (label app.kubernetes.io/name=traefik)"
        placeholder={DEFAULTS.namespace}
        value={data?.namespace ?? ''}
        onChange={e => set('namespace', e.target.value)}
      />
      <TextField
        label="Metrics port"
        type="number"
        helperText="Container port of the Prometheus metrics entrypoint"
        placeholder={String(DEFAULTS.metricsPort)}
        value={data?.metricsPort ?? ''}
        onChange={e => set('metricsPort', e.target.value)}
      />
      <TextField
        label="API port"
        type="number"
        helperText="Container port serving the Traefik API (/api)"
        placeholder={String(DEFAULTS.apiPort)}
        value={data?.apiPort ?? ''}
        onChange={e => set('apiPort', e.target.value)}
      />
    </Box>
  );
}
