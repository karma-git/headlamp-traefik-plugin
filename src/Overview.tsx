import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Typography } from '@mui/material';
import React from 'react';
import { fetchMetricsText, fetchTraefikServices, TraefikApiService } from './api';
import { backendColor, errorColor, latencyColor } from './colors';
import { computeRates, parseMetrics, shortServiceName, Snapshot } from './metrics';
import { InstanceSelect, useInstances } from './useInstance';

const POLL_MS = 5000;
const WINDOW_MS = 60000;

function Stat(props: { label: string; value: string; color?: string }) {
  return (
    <Box textAlign="center" flex={1}>
      <Typography variant="h4" color="primary" style={{ color: props.color }}>
        {props.value}
      </Typography>
      <Typography variant="caption">{props.label}</Typography>
    </Box>
  );
}

export default function Overview() {
  const { instances, instance, setInstance, error: instErr } = useInstances();
  const [history, setHistory] = React.useState<Snapshot[]>([]);
  const [apiServices, setApiServices] = React.useState<Map<string, string[]>>(new Map());
  const [openConns, setOpenConns] = React.useState(0);
  const [error, setError] = React.useState('');
  const pods = instances[instance];

  React.useEffect(() => {
    setHistory([]);
    if (!pods?.length) return;
    let stop = false;
    const tick = async () => {
      try {
        const [texts, svcs] = await Promise.all([
          Promise.all(pods.map(fetchMetricsText)),
          fetchTraefikServices(pods[0]),
        ]);
        if (stop) return;
        const snap = parseMetrics(texts, Date.now());
        setHistory(h => [...h.filter(s => snap.t - s.t <= WINDOW_MS), snap]);
        setOpenConns(snap.openConnections);
        const byName = new Map<string, string[]>();
        for (const s of svcs as TraefikApiService[]) {
          const key = shortServiceName(s.name);
          byName.set(key, [...(byName.get(key) ?? []), ...Object.values(s.serverStatus ?? {})]);
        }
        setApiServices(byName);
        setError('');
      } catch (e: any) {
        if (!stop) setError(String(e?.message ?? e));
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [pods?.join(',')]);

  const rates = React.useMemo(
    () => (history.length >= 2 ? computeRates(history[0], history[history.length - 1]) : null),
    [history]
  );

  const rows = (rates?.services ?? [])
    .map(s => {
      const servers = apiServices.get(s.name) ?? [];
      return {
        ...s,
        label: s.name,
        upCount: servers.filter(x => x === 'UP').length,
        total: servers.length,
        up: servers.length ? `${servers.filter(x => x === 'UP').length}/${servers.length}` : '-',
      };
    })
    .filter(r => r.rps > 0)
    .sort((a, b) => b.rps - a.rps);

  return (
    <SectionBox
      title="Traefik Overview"
      headerProps={{
        actions: [
          <InstanceSelect key="i" instances={instances} value={instance} onChange={setInstance} />,
        ],
      }}
    >
      {(error || instErr) && <Typography color="error">{error || instErr}</Typography>}
      <Box display="flex" py={2}>
        <Stat label="RPS" value={rates ? rates.rps.toFixed(1) : '…'} />
        <Stat
          label="ERROR RATE (5xx)"
          value={rates ? `${(rates.errorRate * 100).toFixed(2)}%` : '…'}
          color={rates ? errorColor(rates.errorRate) : undefined}
        />
        <Stat label="OPEN CONNECTIONS" value={String(openConns)} />
        <Stat label="CONFIG RELOADS (WINDOW)" value={rates ? String(rates.reloads) : '…'} />
      </Box>
      <Typography variant="caption">
        Rates over the last ~{WINDOW_MS / 1000}s, summed across {pods?.length ?? 0} pod(s).
        Collecting… needs two samples.
      </Typography>
      <SimpleTable
        data={rows}
        defaultSortingColumn={2}
        columns={[
          { label: 'Service', getter: (r: any) => r.label },
          {
            label: 'Backend',
            getter: (r: any) => (
              <span style={{ color: backendColor(r.upCount, r.total), fontWeight: 600 }}>
                {r.up}
              </span>
            ),
          },
          {
            label: 'RPS',
            getter: (r: any) => r.rps.toFixed(1),
            sort: (a: any, b: any) => b.rps - a.rps,
          },
          {
            label: 'Errors',
            getter: (r: any) => (
              <span style={{ color: errorColor(r.errorRate), fontWeight: 600 }}>
                {(r.errorRate * 100).toFixed(1)}%
              </span>
            ),
          },
          {
            label: 'P95 latency',
            getter: (r: any) => (
              <span style={{ color: latencyColor(r.p95Ms), fontWeight: 600 }}>
                {r.p95Ms === null ? '-' : `${r.p95Ms.toFixed(0)}ms`}
              </span>
            ),
          },
        ]}
      />
    </SectionBox>
  );
}
