'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Bell,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Moon,
  Settings,
  Sun,
  Truck,
  Wifi,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import Sidebar from '@/components/dashboard/Sidebar';
import LiveMapLoader from '@/components/map/LiveMapLoader';
import { faNumber } from '@/lib/format';
import { signalRService } from '@/services/signalrService';

// آمار ثابت (در حال حاضر از SignalR نمی‌آید)
const DASHBOARD_STATS = {
  online: 12,
  active: 8,
  alerts: 2,
} as const;

export default function SunPathDashboard() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    void signalRService.startConnection();
  }, []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

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

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="خودروهای آنلاین"
              value={faNumber(DASHBOARD_STATS.online)}
              desc="در لحظه متصل"
              icon={<Wifi size={18} />}
            />
            <StatCard
              title="حرکت فعال"
              value={faNumber(DASHBOARD_STATS.active)}
              desc="در حال شبیه‌سازی"
              icon={<Activity size={18} />}
            />
            <StatCard
              title="هشدارها"
              value={faNumber(DASHBOARD_STATS.alerts)}
              desc="نیازمند بررسی"
              icon={<Bell size={18} />}
            />
            <StatCard
              title="سیستم"
              value="Stable"
              desc="SignalR active"
              icon={<Truck size={18} />}
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
                <PanelRow label="API" value="Healthy" />
                <PanelRow label="Map" value="Loaded" />
              </PanelCard>

              <PanelCard title="آخرین رویدادها" icon={<Activity size={18} />}>
                <EventItem title="Simulation started" time="همین الان" />
                <EventItem title="Vehicle 1 moved" time="۲ ثانیه پیش" />
                <EventItem title="DB sync completed" time="۸ ثانیه پیش" />
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
  desc,
  icon,
}: {
  title: string;
  value: string;
  desc: string;
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
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {desc}
          </p>
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

function EventItem({ title, time }: { title: string; time: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-800">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {time}
      </div>
    </div>
  );
}
