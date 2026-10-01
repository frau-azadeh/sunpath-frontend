/** Same-origin proxy works on localhost, LAN IP and trusted HTTPS without rebuilding. */
export function getApiBaseUrl(): string {
  const configured = (typeof window !== 'undefined' ? window.CONFIG?.NEXT_PUBLIC_API_BASE : undefined)
    || process.env.NEXT_PUBLIC_API_BASE || '/backend';
  return configured.trim().replace(/\/+$/, '');
}
export function getHubBaseUrl(): string {
  return new URL(getApiBaseUrl(), window.location.origin).toString().replace(/\/+$/, '');
}
