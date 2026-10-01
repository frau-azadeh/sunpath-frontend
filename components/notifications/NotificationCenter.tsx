'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import * as signalR from '@microsoft/signalr';
import { enableBrowserNotifications, showBrowserNotification } from '@/lib/browser-notifications';
import { apiRequest } from '@/lib/api/request';
import { getHubBaseUrl } from '@/lib/api/base';
import { driverAuthorization } from '@/lib/api/auth';
import { unseenUnread, type MissionNotification } from '@/lib/notifications';

type Inbox = { items: MissionNotification[]; unreadCount: number };
export function NotificationCenter() {
  const pathname = usePathname(); const router = useRouter();
  const driverPage = pathname.startsWith('/driver');
  const audience = driverPage ? 'driver' : 'admin';
  const [items, setItems] = useState<MissionNotification[]>([]);
  const [count, setCount] = useState(0); const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null); const [pending, setPending] = useState<number | null>(null);
  const [nativeStatus, setNativeStatus] = useState<string>('');
  const reload = useRef<() => Promise<void>>(async () => {});
  const eligible = pathname !== '/driver/login';
  useEffect(() => { const show = () => setOpen(true); window.addEventListener('sunpath:open-notifications', show); return () => window.removeEventListener('sunpath:open-notifications', show); }, []);
  useEffect(() => {
    setItems([]); setCount(0); setError(null); setOpen(false);
    if (!eligible) return;
    let session: { driverId?: number; token?: string } | null = null;
    try { session = JSON.parse(localStorage.getItem('driver_session') || 'null'); } catch { /* Bad session is treated as signed out. */ }
    if (driverPage && (!session?.driverId || !session.token)) {
      setError('برای دریافت اعلان و ثبت پذیرش، دوباره وارد حساب راننده شوید.'); return;
    }
    let alive = true; let busy = false;
    const seenKey = `sunpath-notification-seen-${audience}-${driverPage ? session?.driverId : 'all'}`;
    let seen = new Set<number>();
    try { seen = new Set<number>(JSON.parse(sessionStorage.getItem(seenKey) || '[]')); } catch { /* Use an empty set. */ }
    const refresh = async () => {
      if (!alive || busy) return; busy = true;
      try {
        const data = await apiRequest<Inbox>(`/api/notifications?audience=${audience}`, { headers: driverPage ? driverAuthorization() : {} });
        if (!alive) return;
        setItems(data.items); setCount(data.unreadCount); setError(null);
        const fresh = unseenUnread(data.items, seen);
        fresh.forEach(item => seen.add(item.id));
        try { sessionStorage.setItem(seenKey, JSON.stringify([...seen].slice(-500))); } catch { /* Notifications still work without storage. */ }
        fresh.slice(-3).forEach(item => {
          const url = driverPage ? '/driver/dispatch' : '/vehicles';
          toast(item.title, { description: item.message, duration: 7000, action: { label: 'مشاهده', onClick: () => { setOpen(true); router.push(url); } } });
          void showBrowserNotification(item, url).catch(() => { /* In-app inbox remains available. */ });
        });
        if (fresh.length) window.dispatchEvent(new Event('sunpath:workflow-updated'));
      } catch (failure) {
        if (alive) setError(failure instanceof Error ? failure.message : 'دریافت اعلان‌ها ناموفق بود.');
      } finally { busy = false; }
    };
    reload.current = refresh;
    const connection = new signalR.HubConnectionBuilder().withUrl(`${getHubBaseUrl()}/vehicleHub`, { transport: signalR.HttpTransportType.LongPolling }).withAutomaticReconnect([0, 2000, 5000, 10000]).build();
    const subscribe = async () => { await connection.invoke('SubscribeNotifications', audience, session?.token || ''); await refresh(); };
    connection.on('NotificationCreated', () => { void refresh(); });
    connection.onreconnected(() => subscribe().catch(() => {}));
    const connect = async () => {
      if (!alive || connection.state !== signalR.HubConnectionState.Disconnected) return;
      try { await connection.start(); if (alive) await subscribe(); else await connection.stop(); } catch { /* Persistent inbox polling is the fallback. */ }
    };
    void refresh(); void connect();
    const timer = window.setInterval(() => { void refresh(); void connect(); }, 4000);
    const focus = () => void refresh(); window.addEventListener('focus', focus);
    return () => { alive = false; reload.current = async () => {}; window.clearInterval(timer); window.removeEventListener('focus', focus); void connection.stop().catch(() => {}); };
  }, [audience, driverPage, eligible, router]);
  const read = async (id: number) => {
    setPending(id);
    try { await apiRequest(`/api/notifications/${id}/read?audience=${audience}`, { method: 'PUT', headers: driverPage ? driverAuthorization() : {} }); await reload.current(); }
    catch (failure) { toast.error(failure instanceof Error ? failure.message : 'ثبت خواندن ناموفق بود.'); }
    finally { setPending(null); }
  };
  const enableNative = async () => {
    if (!window.isSecureContext || !('Notification' in window)) { setNativeStatus('اعلان سیستم روی این مرورگر/HTTP در دسترس نیست؛ اعلان داخل برنامه فعال است.'); return; }
    try { const enabled = await enableBrowserNotifications(); setNativeStatus(enabled ? 'اعلان سیستم در مرورگر فعال شد؛ صفحه برنامه را باز نگه دارید.' : 'اجازه اعلان سیستم داده نشد؛ اعلان داخل برنامه فعال است.'); }
    catch { setNativeStatus('اعلان سیستم در این مرورگر فعال نشد؛ صندوق اعلان داخل برنامه فعال است.'); }
  };
  if (!eligible) return null;
  return <div dir="rtl" className={`fixed left-4 z-[2500] ${driverPage ? 'bottom-24' : 'bottom-4'}`}>
    {open && <section aria-label="صندوق اعلان‌ها" className="mb-3 flex max-h-[65vh] w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-700"><h2 className="font-bold">اعلان‌ها <span className="text-xs text-orange-600">{count.toLocaleString('fa-IR')} خوانده‌نشده</span></h2><button type="button" onClick={() => setOpen(false)} aria-label="بستن اعلان‌ها"><X size={18}/></button></div>
      <div className="border-b p-3 text-xs dark:border-neutral-700"><button type="button" onClick={() => void enableNative()} className="text-blue-600">فعال‌کردن اعلان سیستم</button>{nativeStatus && <p className="mt-2 text-neutral-500">{nativeStatus}</p>}{error && <p role="alert" className="mt-2 text-rose-600">{error}</p>}</div>
      <div className="overflow-y-auto p-3">{!items.length && <p className="py-6 text-center text-xs text-neutral-500">اعلانی ثبت نشده است.</p>}{items.map(item => <article key={item.id} className={`mb-2 rounded-xl border p-3 ${item.readAtUtc ? 'border-neutral-200 dark:border-neutral-700' : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20'}`}>
        <p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-xs leading-6">{item.message}</p><p className="mt-1 text-[10px] text-neutral-500">مأموریت #{item.missionId.toLocaleString('fa-IR')} · {new Date(item.createdAtUtc).toLocaleString('fa-IR')}</p>
        {!item.readAtUtc && <button type="button" disabled={pending === item.id} onClick={() => void read(item.id)} className="mt-2 flex items-center gap-1 text-xs text-blue-600 disabled:opacity-50"><Check size={13}/>خوانده شد</button>}
      </article>)}</div>
    </section>}
    <button type="button" aria-label={`اعلان‌ها، ${count} خوانده‌نشده`} aria-expanded={open} onClick={() => setOpen(value => !value)} className="relative flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg"><Bell size={22}/>{count > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 text-[10px] text-white">{count > 99 ? '۹۹+' : count.toLocaleString('fa-IR')}</span>}</button>
  </div>;
}
