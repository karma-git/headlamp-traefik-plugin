import { MenuItem, Select } from '@mui/material';
import React from 'react';
import { listInstances } from './api';

export function useInstances() {
  const [instances, setInstances] = React.useState<Record<string, string[]>>({});
  const [instance, setInstance] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  React.useEffect(() => {
    listInstances()
      .then(res => {
        setInstances(res);
        setInstance(
          cur => cur || (res['traefik-external'] ? 'traefik-external' : Object.keys(res)[0] ?? '')
        );
      })
      .catch(e => setError(String(e?.message ?? e)));
  }, []);
  return { instances, instance, setInstance, error };
}

export function InstanceSelect(props: {
  instances: Record<string, string[]>;
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
