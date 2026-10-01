export function driverAuthorization(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const session = JSON.parse(localStorage.getItem('driver_session') || 'null');
    return typeof session?.token === 'string' && session.token ? { Authorization: `Bearer ${session.token}` } : {};
  } catch { return {}; }
}
