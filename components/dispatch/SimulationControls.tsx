'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api/request';
import type { Dispatch } from '@/types/dispatch';

type Point = { latitude: number; longitude: number };
export function SimulationControls({ dispatch }: { dispatch: Dispatch }) {
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [speed, setSpeed] = useState(40);
  const active = ['Assigned', 'Started', 'InProgress', '1', '2'].includes(String(dispatch.status));
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const status = await apiRequest<{ running: boolean }>(`/api/simulation/status/${dispatch.vehicleId}`);
        if (alive) setRunning(status.running);
      } catch { /* The start request shows actionable errors. */ }
    };
    void check(); const timer = setInterval(() => void check(), 5000);
    return () => { alive = false; clearInterval(timer); };
  }, [dispatch.vehicleId, dispatch.status]);
  const start = async () => {
    setBusy(true);
    try {
      const { originLatitude: a, originLongitude: b, destinationLatitude: c, destinationLongitude: d } = dispatch;
      if ([a, b, c, d].some(value => value == null || !Number.isFinite(value))) throw new Error('ابتدا مبدأ و مقصد معتبر ثبت کنید.');
      let route: Point[] | undefined;
      try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${b},${a};${d},${c}?overview=full&geometries=geojson`, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) throw new Error('route failed');
        const data = await response.json();
        const coordinates: unknown = data?.routes?.[0]?.geometry?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2 || coordinates.length > 10000) throw new Error('route unavailable');
        route = coordinates.map((point: number[]) => ({ latitude: point[1], longitude: point[0] }));
      } catch { toast.info('مسیریاب در دسترس نیست؛ حرکت آزمایشی روی خط مستقیم مبدأ تا مقصد اجرا می‌شود.'); }
      await apiRequest(`/api/simulation/start-mission/${dispatch.id}`, { method: 'POST', body: JSON.stringify({ speedKmh: speed, route }) });
      setRunning(true); toast.success('حرکت آزمایشی شروع شد؛ آن را روی نقشه زنده ببینید.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'شروع حرکت ناموفق بود.'); }
    finally { setBusy(false); }
  };
  const stop = async () => {
    setBusy(true);
    try { await apiRequest(`/api/simulation/stop/${dispatch.vehicleId}`, { method: 'DELETE' }); setRunning(false); toast.success('حرکت آزمایشی متوقف شد.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'توقف ناموفق بود.'); }
    finally { setBusy(false); }
  };
  if (!active && !running) return null;
  return <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
    <span className="font-bold">حرکت آزمایشی</span>
    <label className="flex items-center gap-1">سرعت <input type="number" min={5} max={120} value={speed} disabled={busy || running} onChange={event => setSpeed(Number(event.target.value))} className="w-16 rounded border bg-white px-1 py-1 text-neutral-900" /> km/h</label>
    <button type="button" disabled={busy || (!running && (!Number.isFinite(speed) || speed < 5 || speed > 120))} onClick={() => void (running ? stop() : start())} className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white disabled:opacity-50">{busy ? 'در حال انجام…' : running ? 'توقف شبیه‌سازی' : 'حرکت از مبدأ به مقصد'}</button>
    <span className="w-full text-[10px]">این حرکت شبیه‌سازی است. برای موقعیت واقعی، GPS پنل راننده را روی HTTPS فعال کنید. هنگام شبیه‌سازی GPS واقعی را متوقف نگه دارید.</span>
  </div>;
}
