'use client';

import { useEffect } from 'react';
import {
  LayoutDashboard,
  Map as MapIcon,
  Settings,
  Truck,
} from 'lucide-react';

import LiveMap from '@/components/map/LiveMapLoader';
import { signalRService } from '@/services/signalrService';
import LiveMapLoader from '@/components/map/LiveMapLoader';

export default function SunPathDashboard() {
  useEffect(() => {
    signalRService.startConnection();
  }, []);

  return (
    <main className="flex h-screen overflow-hidden bg-slate-50 p-4 font-vazir dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="flex w-20 shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xl transition-all dark:border-slate-800 dark:bg-slate-900 lg:w-64">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="rounded-lg bg-orange-500 p-2">
            <Truck className="text-white" size={24} />
          </div>

          <h1 className="hidden text-xl font-bold text-slate-800 dark:text-white lg:block">
            SunPath
          </h1>
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="داشبورد"
            active
          />

          <SidebarItem
            icon={<MapIcon size={20} />}
            label="مانیتورینگ زنده"
          />

          <SidebarItem
            icon={<Settings size={20} />}
            label="تنظیمات"
          />
        </nav>

        <div className="mt-auto hidden rounded-xl border border-orange-100 bg-orange-50 p-2 dark:border-orange-800 dark:bg-orange-900/20 lg:block">
          <p className="text-xs text-orange-600 dark:text-orange-400">
            سیستم مدیریت ناوگان خورشید
          </p>

          <p className="mt-1 text-[10px] text-slate-500">نسخه ۱.۰.۰</p>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex min-w-0 flex-1 flex-col gap-4">
        <header className="flex h-16 items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
            <h2 className="text-lg font-semibold italic">
              خوش اومدی آزاده جون 👋
            </h2>
          </div>

          <div className="flex gap-2">
            <div className="h-10 w-10 rounded-full border-2 border-orange-400 bg-slate-200" />
          </div>
        </header>


    
      <LiveMapLoader/>


      </section>
    </main>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        'flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all',
        active
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 dark:shadow-none'
          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
      ].join(' ')}
    >
      {icon}
      <span className="hidden font-medium lg:block">{label}</span>
    </div>
  );
}
