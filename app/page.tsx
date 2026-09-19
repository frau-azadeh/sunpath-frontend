'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Bell,
  Car,
  Map as MapIcon,
  MapPin,
  Menu,
  Moon,
  Navigation,
  Sun,
  Truck,
  UserRound,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import Sidebar from '@/components/dashboard/Sidebar';
import LiveMapLoader from '@/components/map/LiveMapLoader';
import { faNumber } from '@/lib/format';
import { dispatchService } from '@/services/dispatchService';
import { useVehicleStore } from '@/store/useVehicleStore';
import type { Dispatch } from '@/types/dispatch';

type DashboardStats = {
  total: number;
  active: number;
  inactive: number;
  cars: number;
  trucks: number;
  bikes: number;
};

function getDispatchStatusLabel(
  status: string | number | null | undefined,
): string {
  const value = String(status ?? '')
    .trim()
    .toLowerCase();

  switch (value) {
    case '0':
    case 'pending':
      return 'در انتظار';

    case '1':
    case 'assigned':
      return 'اختصاص داده شده';

    case '2':
    case 'started':
    case 'inprogress':
    case 'in_progress':
      return 'در حال انجام';

    case '3':
    case 'completed':
      return 'تکمیل شده';

    case '4':
    case 'cancelled':
    case 'canceled':
      return 'لغو شده';

    default:
      return 'نامشخص';
  }
}

function isActiveDispatch(dispatch: Dispatch): boolean {
  const value = String(dispatch.status ?? '')
    .trim()
    .toLowerCase();

  return (
    value === '0' ||
    value === '1' ||
    value === '2' ||
    value === 'pending' ||
    value === 'assigned' ||
    value === 'started' ||
    value === 'inprogress' ||
    value === 'in_progress'
  );
}

export default function SunPathDashboard() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { theme, setTheme } = useTheme();

  const vehicles = useVehicleStore((state) => state.vehicles);
  const isLoadingStats = useVehicleStore((state) => state.isLoading);
  const loadVehicles = useVehicleStore((state) => state.loadVehicles);

  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [isLoadingDispatches, setIsLoadingDispatches] = useState(true);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    let mounted = true;

    const loadDispatches = async (): Promise<void> => {
      try {
        setIsLoadingDispatches(true);
        setDispatchError(null);

        const data = await dispatchService.getAll();

        if (!mounted) {
          return;
        }

        setDispatches(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('[Dashboard] load dispatches error:', error);

        if (!mounted) {
          return;
        }

        setDispatches([]);
        setDispatchError('خطا در دریافت اطلاعات مأموریت‌ها');
      } finally {
        if (mounted) {
          setIsLoadingDispatches(false);
        }
      }
    };

    void loadDispatches();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * آمار خودروها
   *
   * مستقیم از vehicles موجود در Zustand محاسبه می‌شود.
   * دیگر calculateDashboardStats و ReturnType نداریم.
   */
  const stats = useMemo<DashboardStats>(() => {
    let total = 0;
    let active = 0;
    let inactive = 0;
    let cars = 0;
    let trucks = 0;
    let bikes = 0;

    for (const vehicle of vehicles) {
      total += 1;

      const status = Number(vehicle.status);
      const vehicleType = Number(vehicle.vehicleType);

      if (status === 1) {
        active += 1;
      } else {
        inactive += 1;
      }

      if (vehicleType === 0) {
        cars += 1;
      } else if (vehicleType === 1 || vehicleType === 2) {
        trucks += 1;
      } else if (vehicleType === 3) {
        bikes += 1;
      }
    }

    return {
      total,
      active,
      inactive,
      cars,
      trucks,
      bikes,
    };
  }, [vehicles]);

  /*
   * آخرین مأموریت:
   * اگر مأموریت جاری وجود داشته باشد، جدیدترین مأموریت جاری.
   * در غیر این صورت، جدیدترین مأموریت ثبت‌شده.
   */
  const latestDispatch = useMemo<Dispatch | null>(() => {
    if (dispatches.length === 0) {
      return null;
    }

    const activeDispatches = dispatches.filter(isActiveDispatch);

    const source = activeDispatches.length > 0 ? activeDispatches : dispatches;

    let latest = source[0];

    for (let index = 1; index < source.length; index += 1) {
      const current = source[index];

      if (Number(current.id) > Number(latest.id)) {
        latest = current;
      }
    }

    return latest;
  }, [dispatches]);

  /*
   * پیدا کردن خودروی مربوط به آخرین مأموریت.
   *
   * عمداً هیچ Vehicle type جداگانه‌ای اینجا استفاده نشده
   * تا نوع خودرو مستقیماً از Zustand Store گرفته شود.
   */
  const latestDispatchVehicle = useMemo(() => {
    if (!latestDispatch) {
      return null;
    }

    const vehicle = vehicles.find(
      (item) => String(item.id) === String(latestDispatch.vehicleId),
    );

    return vehicle ?? null;
  }, [vehicles, latestDispatch]);

  /*
   * اطلاعات نمایشی کارت آخرین مأموریت
   */
  const vehiclePlate = useMemo(() => {
    if (latestDispatchVehicle?.plateNumber) {
      return String(latestDispatchVehicle.plateNumber);
    }

    if (latestDispatch?.vehicleId != null) {
      return `خودرو ${faNumber(Number(latestDispatch.vehicleId))}`;
    }

    return '---';
  }, [latestDispatchVehicle, latestDispatch]);

  const driverName = useMemo(() => {
    if (latestDispatchVehicle?.currentDriverName) {
      return String(latestDispatchVehicle.currentDriverName);
    }

    if (latestDispatch?.driverId != null) {
      return `راننده ${faNumber(Number(latestDispatch.driverId))}`;
    }

    return 'تعیین نشده';
  }, [latestDispatchVehicle, latestDispatch]);

  const originTitle = useMemo(() => {
    const value = latestDispatch?.originTitle;

    if (value == null || String(value).trim() === '') {
      return 'تعیین نشده';
    }

    return String(value);
  }, [latestDispatch]);

  const destinationTitle = useMemo(() => {
    const value = latestDispatch?.destinationTitle;

    if (value == null || String(value).trim() === '') {
      return 'تعیین نشده';
    }

    return String(value);
  }, [latestDispatch]);

  const dispatchStatus = useMemo(() => {
    if (!latestDispatch) {
      return '---';
    }

    return getDispatchStatusLabel(latestDispatch.status);
  }, [latestDispatch]);

  const toggleTheme = (): void => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const formatStatValue = (value: number): string => {
    if (isLoadingStats) {
      return '...';
    }

    return faNumber(value);
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-4 font-vazir text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1800px] gap-4">
        <DesktopSidebar />

        {/* Mobile Sidebar Backdrop */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-neutral-950/30 backdrop-blur-[1px] lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.aside
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 28,
              }}
              className="fixed right-4 top-4 z-50 h-[calc(100vh-2rem)] w-[280px] overflow-hidden rounded-3xl border border-neutral-200 bg-white p-4 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 lg:hidden"
            >
              <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <Header
            onMenuClick={() => setMobileSidebarOpen(true)}
            theme={theme}
            onThemeToggle={toggleTheme}
          />

          {dispatchError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {dispatchError}
            </div>
          )}

          {/* Dashboard Stats */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="کل خودروها"
              value={formatStatValue(stats.total)}
              icon={<Car size={18} />}
            />

            <StatCard
              title="خودروهای فعال"
              value={formatStatValue(stats.active)}
              icon={<Activity size={18} />}
            />

            <StatCard
              title="وانت و کامیون"
              value={formatStatValue(stats.trucks)}
              icon={<Truck size={18} />}
            />

            <StatCard
              title="غیرفعال"
              value={formatStatValue(stats.inactive)}
              icon={<Bell size={18} />}
            />
          </section>

          {/* Main Dashboard */}
          <section className="grid min-w-0 flex-1 gap-4 xl:grid-cols-[1fr_320px]">
            {/* Live Map */}
            <motion.div
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.25,
              }}
              className="min-w-0 overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
                    <MapIcon size={18} />
                  </div>

                  <div>
                    <h3 className="font-semibold">نقشه زنده</h3>

                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      نمایش موقعیت خودروها و حرکت لحظه‌ای
                    </p>
                  </div>
                </div>

                <div className="hidden items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 md:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  اتصال فعال
                </div>
              </div>

              <div className="h-[calc(100vh-14rem)] min-h-[520px]">
                <LiveMapLoader />
              </div>
            </motion.div>

            {/* Right Side */}
            <motion.aside
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.25,
                delay: 0.05,
              }}
              className="flex min-h-0 flex-col gap-4"
            >
              {/* Latest Dispatch */}
              <PanelCard title="آخرین مأموریت" icon={<Navigation size={18} />}>
                {isLoadingDispatches ? (
                  <>
                    <PanelRow label="خودرو" value="..." />

                    <PanelRow label="راننده" value="..." />

                    <PanelRow label="مبدأ" value="..." />

                    <PanelRow label="مقصد" value="..." />

                    <PanelRow label="وضعیت" value="..." />
                  </>
                ) : latestDispatch ? (
                  <>
                    <InfoRow
                      icon={<Car size={15} />}
                      label="خودرو"
                      value={vehiclePlate}
                    />

                    <InfoRow
                      icon={<UserRound size={15} />}
                      label="راننده"
                      value={driverName}
                    />

                    <InfoRow
                      icon={<MapPin size={15} />}
                      label="مبدأ"
                      value={originTitle}
                    />

                    <InfoRow
                      icon={<Navigation size={15} />}
                      label="مقصد"
                      value={destinationTitle}
                    />

                    <PanelRow label="وضعیت" value={dispatchStatus} />
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-6 text-center dark:border-neutral-800">
                    <Navigation
                      size={28}
                      className="mx-auto mb-3 text-neutral-400"
                    />

                    <p className="text-sm font-medium">مأموریتی ثبت نشده است</p>

                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      پس از ایجاد مأموریت، خودرو، راننده، مبدأ و مقصد اینجا
                      نمایش داده می‌شود.
                    </p>
                  </div>
                )}
              </PanelCard>

              {/* Fleet Summary */}
              <PanelCard title="خلاصه ناوگان" icon={<Activity size={18} />}>
                <PanelRow label="سواری" value={formatStatValue(stats.cars)} />

                <PanelRow
                  label="وانت / کامیون"
                  value={formatStatValue(stats.trucks)}
                />

                <PanelRow
                  label="موتورسیکلت"
                  value={formatStatValue(stats.bikes)}
                />
              </PanelCard>
            </motion.aside>
          </section>
        </section>
      </div>
    </main>
  );
}

/* ------------------------------ Sidebar ------------------------------ */

function DesktopSidebar() {
  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-3xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 lg:flex">
      <Sidebar />
    </aside>
  );
}

/* ------------------------------ Header ------------------------------ */

function Header({
  onMenuClick,
  theme,
  onThemeToggle,
}: {
  onMenuClick: () => void;
  theme?: string;
  onThemeToggle: () => void;
}) {
  return (
    <header className="flex h-16 items-center justify-between rounded-3xl border border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="باز کردن منو"
          className="rounded-xl border border-neutral-200 p-2 text-neutral-700 dark:border-neutral-800 dark:text-neutral-200 lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 md:text-xl">
            مدیریت لحظه‌ای ناوگان و شبیه‌سازی
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onThemeToggle}
          aria-label="تغییر حالت نمایش"
          className="rounded-xl border border-neutral-200 p-2 text-neutral-700 dark:border-neutral-800 dark:text-neutral-200"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="hidden items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-800 md:flex">
          <div className="h-8 w-8 rounded-full border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />

          <div className="text-right">
            <p className="text-sm font-medium leading-4">Azadeh</p>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Admin
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ Stat Card ------------------------------ */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      transition={{
        duration: 0.15,
      }}
      className="rounded-3xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-3 text-orange-500 dark:border-neutral-800">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------ Panel Card ------------------------------ */

function PanelCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
          {icon}
        </span>

        <h4 className="font-semibold">{title}</h4>
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

/* ------------------------------ Panel Row ------------------------------ */

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
        {label}
      </span>

      <span
        className="min-w-0 truncate text-left text-sm font-medium"
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------ Info Row ------------------------------ */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="mb-1.5 flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
        {icon}

        <span className="text-xs">{label}</span>
      </div>

      <p className="truncate text-sm font-medium" title={value}>
        {value}
      </p>
    </div>
  );
}
