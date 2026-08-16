'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Bell,
  Car,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Moon,
  Settings,
  Sun,
  Truck,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import Sidebar from '@/components/dashboard/Sidebar';
import LiveMapLoader from '@/components/map/LiveMapLoader';
import { faNumber } from '@/lib/format';
import { signalRService } from '@/services/signalrService';
import { vehicleService } from '@/services/vehicleService';
import type { Vehicle } from '@/types/vehicle';

type DashboardStats = {
  total: number;
  active: number;
  inactive: number;
  cars: number;
  trucks: number;
  bikes: number;
};

const EMPTY_STATS: DashboardStats = {
  total: 0,
  active: 0,
  inactive: 0,
  cars: 0,
  trucks: 0,
  bikes: 0,
};

const calculateDashboardStats = (vehicles: Vehicle[]): DashboardStats => {
  return vehicles.reduce<DashboardStats>(
    (stats, vehicle) => {
      const status = Number(vehicle.status);
      const vehicleType = Number(vehicle.vehicleType);

      stats.total += 1;

      if (status === 1) {
        stats.active += 1;
      } else {
        stats.inactive += 1;
      }

      if (vehicleType === 0) {
        stats.cars += 1;
      }

      if (vehicleType === 1 || vehicleType === 2) {
        stats.trucks += 1;
      }

      if (vehicleType === 3) {
        stats.bikes += 1;
      }

      return stats;
    },
    { ...EMPTY_STATS },
  );
};

export default function SunPathDashboard() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // بارگذاری اولیه فقط یک‌بار در mount؛
  // هیچ setState سنکرونی در بدنه effect انجام نمی‌شود.
  useEffect(() => {
    void signalRService.startConnection();

    let isMounted = true;

    const fetchInitialStats = async (): Promise<void> => {
      try {
        const data = await vehicleService.getAll();

        if (isMounted) {
          setVehicles(Array.isArray(data) ? data : []);
          setStatsError(null);
        }
      } catch (error) {
        console.error('Dashboard vehicles stats error:', error);

        if (isMounted) {
          setVehicles([]);
          setStatsError('خطا در دریافت آمار خودروها');
        }
      } finally {
        if (isMounted) {
          setIsLoadingStats(false);
        }
      }
    };

    void fetchInitialStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => calculateDashboardStats(vehicles), [vehicles]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const formatStatValue = (value: number): string => {
    if (isLoadingStats) {
      return '...';
    }

    return faNumber(value);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 font-vazir text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1800px] gap-4">
        <DesktopSidebar />

        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.aside
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="fixed right-4 top-4 z-50 h-[calc(100vh-2rem)] w-72 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden"
            >
              <SidebarContent onClose={() => setMobileSidebarOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <Header
            onMenuClick={() => setMobileSidebarOpen(true)}
            theme={theme}
            onThemeToggle={toggleTheme}
          />

          {statsError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {statsError}
            </div>
          )}

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

          <section className="grid min-w-0 flex-1 gap-4 xl:grid-cols-[1fr_320px]">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-slate-200 p-2 dark:border-slate-800">
                    <MapIcon size={18} />
                  </div>

                  <div>
                    <h3 className="font-semibold">نقشه زنده</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      نمایش موقعیت خودروها و حرکت لحظه‌ای
                    </p>
                  </div>
                </div>

                <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 md:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  اتصال فعال
                </div>
              </div>

              <div className="h-[calc(100vh-14rem)] min-h-[520px]">
                <LiveMapLoader />
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="flex min-h-0 flex-col gap-4"
            >
              <PanelCard
                title="وضعیت سیستم"
                icon={<LayoutDashboard size={18} />}
              >
                <PanelRow label="SignalR" value="Connected" />
                <PanelRow
                  label="API"
                  value={statsError ? 'Error' : 'Healthy'}
                />
                <PanelRow
                  label="Vehicles"
                  value={formatStatValue(stats.total)}
                />
              </PanelCard>

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
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex">
      <Sidebar />
    </aside>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 p-2 dark:border-slate-800">
            <Truck className="text-orange-500" size={22} />
          </div>

          <div>
            <h1 className="text-xl font-bold">SunPath</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fleet Tracking System
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-800 dark:text-slate-300"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-2">
        <SidebarItem
          icon={<LayoutDashboard size={20} />}
          label="داشبورد"
          active
        />
        <SidebarItem icon={<MapIcon size={20} />} label="مانیتورینگ زنده" />
        <SidebarItem icon={<Settings size={20} />} label="تنظیمات" />
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <p className="text-sm font-medium">سیستم مدیریت ناوگان</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          نسخه ۱.۰.۰
        </p>
      </div>
    </>
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
    <header className="flex h-16 items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 p-2 text-slate-700 dark:border-slate-800 dark:text-slate-200 lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 md:text-xl">
            مدیریت لحظه‌ای ناوگان و شبیه‌سازی
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onThemeToggle}
          className="rounded-xl border border-slate-200 p-2 text-slate-700 dark:border-slate-800 dark:text-slate-200"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="hidden items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 md:flex">
          <div className="h-8 w-8 rounded-full border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800" />
          <div className="text-right">
            <p className="text-sm font-medium leading-4">Azadeh</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}

/* --------------------------- Small helpers --------------------------- */

function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
        active
          ? 'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-400'
          : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-slate-800 dark:hover:bg-slate-800/60',
      ].join(' ')}
    >
      {icon}
      <span className="hidden font-medium lg:block">{label}</span>
    </div>
  );
}

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
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-3 text-orange-500 dark:border-slate-800">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

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
    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-xl border border-slate-200 p-2 dark:border-slate-800">
          {icon}
        </span>
        <h4 className="font-semibold">{title}</h4>
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-800">
      <span className="text-sm text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
