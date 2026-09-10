'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Award, BadgeCheck, Bell, CircleDotDashed, Clock, Clock3, Flag, Fuel,
  Gauge, Loader2, LogOut, Map, MapPin, Menu, Navigation, PauseCircle,
  Play, Route, UserRound, X, Square,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDriverAuthStore } from '@/store/useDriverAuthStore';
import { dispatchService } from '@/services/dispatchService';
import { vehicleService } from '@/services/vehicleService';
import { useDriverNavigation, type ActiveMission } from '@/hooks/useDriverNavigation';
import type { Dispatch } from '@/types/dispatch';
import type { Vehicle } from '@/types/vehicle';

const DriverNavigationMap = dynamic(() => import('@/components/driver/DriverNavigationMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full animate-pulse items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
      در حال بارگذاری نقشه ناوبری...
    </div>
  ),
});

type DriverPageTab = 'dispatch' | 'route' | 'profile';

const toMission = (d: Dispatch | null): ActiveMission | null => {
  if (!d || d.id == null || d.vehicleId == null ||
      d.originLatitude == null || d.originLongitude == null ||
      d.destinationLatitude == null || d.destinationLongitude == null) return null;

  const status = String(d.status).toLowerCase();
  return {
    id: d.id,
    driverId: d.driverId,
    vehicleId: d.vehicleId,
    originName: d.originTitle || 'مبدأ مأموریت',
    originLat: Number(d.originLatitude),
    originLng: Number(d.originLongitude),
    destinationName: d.destinationTitle || 'مقصد مأموریت',
    destinationLat: Number(d.destinationLatitude),
    destinationLng: Number(d.destinationLongitude),
    status: status === '2' || status === 'started' || status === 'inprogress'
      ? 'in_progress'
      : status === '3' || status === 'completed'
        ? 'completed'
        : 'assigned',
  };
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toLocaleString('fa-IR')} دقیقه و ${s.toLocaleString('fa-IR')} ثانیه`;
}

export function DriverDispatchPageClient() {
  const router = useRouter();
  const { driver, hydrate, logout } = useDriverAuthStore();
  const [activeTab, setActiveTab] = useState<DriverPageTab>('dispatch');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!driver?.driverId) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const active = await dispatchService.getActiveForDriver(driver.driverId);
        if (cancelled) return;
        setDispatch(active);
        if (active?.vehicleId) {
          try {
            setVehicle(await vehicleService.getById(active.vehicleId));
          } catch { setVehicle(null); }
        } else {
          setVehicle(null);
        }
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'دریافت مأموریت ناموفق بود.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [driver?.driverId]);

  useEffect(() => {
    if (!driver && typeof window !== 'undefined' && !localStorage.getItem('driver_session')) {
      router.replace('/driver/login');
    }
  }, [driver, router]);

  const mission = useMemo(() => toMission(dispatch), [dispatch]);
  const navigation = useDriverNavigation(mission, driver?.driverId || 0);

  const handleStart = async () => {
    if (!dispatch) return;
    setIsSubmitting(true);
    try {
      await dispatchService.updateStatus(dispatch.id, { status: 'InProgress' });
      setDispatch(prev => prev ? { ...prev, status: 'Started' } : prev);
      navigation.startTracking();
      toast.success('مأموریت شروع شد. GPS زنده فعال است.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'شروع مأموریت ناموفق بود.');
    } finally { setIsSubmitting(false); }
  };

  const handleComplete = async () => {
    if (!dispatch) return;
    setIsSubmitting(true);
    try {
      await dispatchService.updateStatus(dispatch.id, { status: 'Completed' });
      navigation.stopTracking();
      setDispatch(prev => prev ? { ...prev, status: 'Completed' } : prev);
      toast.success('مأموریت با موفقیت پایان یافت.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'پایان مأموریت ناموفق بود.');
    } finally { setIsSubmitting(false); }
  };

  const handleLogout = () => {
    navigation.stopTracking();
    logout();
    router.replace('/driver/login');
  };

  const fullName = driver?.fullName || 'راننده';
  const initials = useMemo(() => {
    const p = fullName.trim().split(/\s+/);
    return p.length > 1 ? `${p[0][0]} ${p[1][0]}` : fullName.slice(0, 2);
  }, [fullName]);

  const status = mission?.status || 'assigned';
  const hasMission = Boolean(mission);

  return (
    <main className="min-h-dvh bg-neutral-50 pb-28 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50" dir="rtl">
      <div className="mx-auto w-full max-w-3xl">
        <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-neutral-50/90 px-4 py-3 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/90 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setIsProfileOpen(true)} className="flex min-w-0 items-center gap-2.5 rounded-2xl p-1 text-right transition hover:bg-neutral-100 dark:hover:bg-neutral-900">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-sm font-bold text-white">{initials}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{fullName}</p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{driver?.phone || '—'}</p>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => toast.info('اعلان جدیدی برای شما وجود ندارد.')} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                <Bell size={18} /><span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500" />
              </button>
              <button type="button" onClick={() => document.documentElement.classList.toggle('dark')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                <span className="text-xs">◐</span>
              </button>
              <button type="button" onClick={handleLogout} className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <section className="px-4 pt-5 sm:px-6">
          <div className="flex items-center justify-between rounded-3xl border border-orange-100 bg-white p-4 dark:border-orange-950/60 dark:bg-neutral-900">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"><Navigation size={24} /></div>
              <div><p className="text-lg tracking-tight">SunPath Driver</p><p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">مدیریت مأموریت و مسیر راننده</p></div>
            </div>
            <div className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-orange-50 px-2 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"><TruckIcon /></div>
          </div>
        </section>

        <div className="px-4 pb-6 pt-5 sm:px-6">
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center"><Loader2 size={38} className="animate-spin text-orange-500" /></div>
          ) : !hasMission ? (
            <section className="rounded-3xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
              <Navigation className="mx-auto text-neutral-400" size={42} />
              <p className="mt-4 text-base font-bold">در حال حاضر مأموریت فعالی ندارید.</p>
              <p className="mt-2 text-xs leading-6 text-neutral-500 dark:text-neutral-400">پس از تخصیص مأموریت توسط مدیر، مسیر و مقصد در همین پنل نمایش داده می‌شود.</p>
            </section>
          ) : activeTab === 'dispatch' ? (
            <div className="flex flex-col gap-5">
              <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-neutral-100 p-5 dark:border-neutral-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">مأموریت #{dispatch?.id.toLocaleString('fa-IR')}</p>
                        <span className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300">
                          {status === 'assigned' ? 'آماده‌ی شروع' : status === 'in_progress' ? 'در حال انجام (GPS زنده)' : 'تکمیل‌شده'}
                        </span>
                      </div>
                      <h1 className="mt-2 text-xl font-bold">{dispatch?.title || `حرکت به ${mission?.destinationName}`}</h1>
                      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">خودرو: {vehicle?.plateNumber || `#${mission?.vehicleId}`} {vehicle?.model ? `— ${vehicle.model}` : ''}</p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"><Navigation size={21} /></div>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <InfoRow icon={<MapPin size={18} />} iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" label="مبدأ مأموریت" value={mission!.originName} />
                  <InfoRow icon={<Flag size={18} />} iconClassName="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400" label="مقصد مأموریت" value={mission!.destinationName} />
                  <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                    <InfoRow compact icon={<Route size={17} />} label="مسافت پیموده‌شده" value={`${navigation.stats.totalDistanceKm.toLocaleString('fa-IR')} کیلومتر`} />
                    <InfoRow compact icon={<Clock3 size={17} />} label="مدت زمان سفر" value={formatDuration(navigation.stats.durationSeconds)} />
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SmallStat icon={<Gauge size={18} className="text-amber-500" />} label="سرعت لحظه‌ای" value={`${navigation.stats.currentSpeed.toLocaleString('fa-IR')} km/h`} />
                <SmallStat icon={<Fuel size={18} className="text-emerald-500" />} label="مصرف سوخت" value={`${navigation.stats.fuelConsumedLiters.toLocaleString('fa-IR')} لیتر`} />
                <SmallStat icon={<PauseCircle size={18} className="text-rose-500" />} label="مدت توقف درجا" value={formatDuration(navigation.stats.stopDurationSeconds)} />
                <SmallStat icon={<Award size={18} className="text-orange-500" />} label="امتیاز رانندگی" value={`${navigation.stats.efficiencyScore.toLocaleString('fa-IR')} از ۱۰۰`} />
              </div>

              <TrackingCard active={navigation.isDriving} error={navigation.gpsError} />

              {status === 'assigned' && (
                <button type="button" onClick={() => void handleStart()} disabled={isSubmitting} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 text-base font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:opacity-60">
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Play size={19} fill="currentColor" /> شروع مأموریت و ردیابی</>}
                </button>
              )}
              {status === 'in_progress' && (
                <button type="button" onClick={() => void handleComplete()} disabled={isSubmitting} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-base font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60">
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Square size={19} fill="currentColor" /> پایان مأموریت و ثبت عملکرد</>}
                </button>
              )}
              {status === 'completed' && <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"><BadgeCheck size={19} /> این مأموریت با موفقیت تکمیل گردید.</div>}
            </div>
          ) : activeTab === 'route' ? (
            <div className="flex flex-col gap-5">
              <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between border-b border-neutral-100 p-5 dark:border-neutral-800"><div><p className="text-lg font-bold">نقشه‌ی ناوبری و ترافیک زنده</p><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">مسیر حرکت از {mission!.originName} به مقصد {mission!.destinationName}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"><Map size={21} /></div></div>
                <div className="p-4 sm:p-5">
                  <div className="relative h-[380px] w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    <DriverNavigationMap currentLocation={navigation.currentLocation} destination={{lat: mission!.destinationLat, lng: mission!.destinationLng, name: mission!.destinationName}} origin={{lat: mission!.originLat, lng: mission!.originLng, name: mission!.originName}} routeCoordinates={navigation.routeCoordinates} heading={navigation.stats.heading} showTrafficLayer={true} />
                  </div>
                  <div className="mt-4">{navigation.isDriving ? <button type="button" onClick={() => void handleComplete()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 font-bold text-white"><Square size={18} fill="currentColor" /> توقف و ثبت پایان مأموریت</button> : <button type="button" onClick={() => void handleStart()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-bold text-white"><Play size={18} fill="currentColor" /> شروع حرکت به سمت مقصد</button>}</div>
                </div>
              </section>
              <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm font-bold">خلاصه تله‌متری و مصرف سوخت</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <SmallStat icon={<Route size={17} />} label="مسافت پیموده" value={`${navigation.stats.totalDistanceKm.toLocaleString('fa-IR')} کیلومتر`} />
                  <SmallStat icon={<Clock size={17} />} label="زمان کل سفر" value={formatDuration(navigation.stats.durationSeconds)} />
                  <SmallStat icon={<Fuel size={17} />} label="مصرف سوخت تخمینی" value={`${navigation.stats.fuelConsumedLiters.toLocaleString('fa-IR')} لیتر`} />
                </div>
              </section>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-600 text-lg font-bold text-white">{initials}</div><div><h1 className="text-lg font-bold">{fullName}</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">شماره تماس: {driver?.phone || '—'}</p><p className="text-xs text-neutral-400">شناسه راننده: {driver?.driverId}</p></div></div>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-5 dark:border-neutral-800">
                  <SmallStat icon={<Award size={17} className="text-amber-500" />} label="امتیاز رانندگی" value={`${navigation.stats.efficiencyScore.toLocaleString('fa-IR')} از ۱۰۰`} />
                  <SmallStat icon={<BadgeCheck size={17} className="text-emerald-500" />} label="خودروی جاری" value={vehicle?.plateNumber || 'تخصیص نشده'} />
                </div>
              </section>
              <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"><UserRound size={19} /></div><div><p className="text-sm font-bold">وضعیت اتصال GPS</p><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{navigation.isDriving ? 'ارسال لحظه‌ای موقعیت فعال است.' : 'برای شروع ردیابی، مأموریت را آغاز کنید.'}</p></div></div></section>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} onChangeTab={setActiveTab} />
      <ProfileSheet isOpen={isProfileOpen} fullName={fullName} phone={driver?.phone || '—'} initials={initials} onClose={() => setIsProfileOpen(false)} onLogout={handleLogout} />
    </main>
  );
}

function TruckIcon() { return <Navigation size={18} />; }

function TrackingCard({ active, error }: { active: boolean; error: string | null }) {
  return <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"><CircleDotDashed size={19} /></div><div><p className="text-sm font-bold">ردیابی و ارتباط زنده</p><p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">موقعیت دقیق خودرو به سرور مرکزی ارسال می‌شود.</p></div></div>
    <div className={`mt-4 rounded-2xl p-3 text-xs font-semibold ${error ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-neutral-50 text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400'}`}>
      <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${error ? 'bg-rose-500' : active ? 'animate-pulse bg-emerald-500' : 'bg-neutral-400'}`} />
      {error || (active ? 'ارسال لحظه‌ای GPS فعال است؛ حرکت در مسیر پایش می‌شود.' : 'GPS هنوز فعال نشده است.')}
    </div>
  </section>;
}

function BottomNavigation({ activeTab, onChangeTab }: { activeTab: DriverPageTab; onChangeTab: (tab: DriverPageTab) => void }) {
  const items = [{id:'dispatch' as const,label:'مأموریت',icon:<Navigation size={20}/>},{id:'route' as const,label:'نقشه و مسیر',icon:<Map size={20}/>},{id:'profile' as const,label:'پروفایل',icon:<UserRound size={20}/>}];
  return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-900/95"><div className="mx-auto grid w-full max-w-md grid-cols-3 gap-2">{items.map(item => <button key={item.id} type="button" onClick={() => onChangeTab(item.id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition ${activeTab===item.id?'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400':'text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'}`}>{item.icon}{item.label}</button>)}</div></nav>;
}

function ProfileSheet({isOpen,fullName,phone,initials,onClose,onLogout}:{isOpen:boolean;fullName:string;phone:string;initials:string;onClose:()=>void;onLogout:()=>void}) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50"><button type="button" aria-label="بستن پروفایل" onClick={onClose} className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"/><aside className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-[32px] border border-neutral-200 bg-white p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"><div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700"/><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-base font-bold text-white">{initials}</div><div><p className="text-base font-bold">{fullName}</p><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{phone}</p></div></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={20}/></button></div><div className="mt-6 space-y-2"><button type="button" onClick={()=>toast.info('اطلاعات راننده از سرور دریافت شده است.')} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right text-sm font-bold text-neutral-700 dark:text-neutral-200"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"><UserRound size={19}/></span>اطلاعات پرونده راننده</button><button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right text-sm font-bold text-rose-600 dark:text-rose-400"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30"><LogOut size={19}/></span>خروج از حساب کاربری</button></div></aside></div>;
}

function SmallStat({icon,label,value}:{icon:ReactNode;label:string;value:string}) { return <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-950"><div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">{icon}<span className="text-xs">{label}</span></div><p className="mt-2 text-sm font-bold text-neutral-800 dark:text-neutral-100">{value}</p></div>; }
function InfoRow({icon,label,value,compact=false,iconClassName}:{icon:ReactNode;label:string;value:string;compact?:boolean;iconClassName?:string}) { return <div className={`flex gap-3 ${compact?'items-start':'items-center'}`}><div className={`flex shrink-0 items-center justify-center rounded-xl ${compact?'h-9 w-9':'h-10 w-10'} ${iconClassName || 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'}`}>{icon}</div><div className="min-w-0"><p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p><p className={`mt-0.5 break-words font-bold text-neutral-800 dark:text-neutral-100 ${compact?'text-xs':'text-sm'}`}>{value}</p></div></div>; }
