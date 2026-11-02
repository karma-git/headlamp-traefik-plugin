export const GREEN = '#2e7d32';
export const YELLOW = '#ed6c02';
export const RED = '#d32f2f';

export const errorColor = (rate: number) => (rate >= 0.05 ? RED : rate >= 0.01 ? YELLOW : GREEN);
export const latencyColor = (ms: number | null) =>
  ms === null ? undefined : ms >= 1000 ? RED : ms >= 300 ? YELLOW : GREEN;
export const backendColor = (up: number, total: number) =>
  total === 0 ? undefined : up === total ? GREEN : up === 0 ? RED : YELLOW;
