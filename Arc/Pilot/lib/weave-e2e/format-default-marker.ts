/** DOM marker for an applied Weave input default (mirrors Scripts/e2e-shared/weave-input-matrix). */
export function formatDefaultMarker(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}
