import { MenuItem, Select } from '@mui/material';
import React from 'react';
import { listInstances, PodRef } from './api';
import { useConfig } from './config';

export function useInstances() {
  const [instances, setInstances] = React.useState<Record<string, PodRef[]>>({});
  const [instance, setInstance] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  const { namespace } = useConfig();
  React.useEffect(() => {
    setError('');
    listInstances()
      .then(res => {
        setInstances(res);
        setInstance(cur => (res[cur] ? cur : Object.keys(res).sort()[0] ?? ''));
        if (!Object.keys(res).length) {
          setError(
            'No running Traefik pods (app.kubernetes.io/name=traefik) ' +
              (namespace ? `in namespace "${namespace}". ` : 'in any namespace. ') +
              'Check the namespace in Settings → Plugins → headlamp-traefik-plugin.'
          );
        }
      })
      .catch(e => setError(String(e?.message ?? e)));
  }, [namespace]);
  return { instances, instance, setInstance, error };
}

export function InstanceSelect(props: {
  instances: Record<string, PodRef[]>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select
      size="small"
      value={props.value}
      onChange={e => props.onChange(e.target.value as string)}
    >
      {Object.keys(props.instances)
        .sort()
        .map(i => (
          <MenuItem key={i} value={i}>
            {i}
          </MenuItem>
        ))}
    </Select>
  );
}
