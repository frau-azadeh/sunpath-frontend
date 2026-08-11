'use client';

import { LayoutDashboard, Truck, Map as MapIcon, Settings } from 'lucide-react';
import LiveMap from '@/components/map/LiveMapLoader';

export default function SunPathDashboard() {
  return (
    <main className="flex h-screen bg-slate-50 dark:bg-slate-950 p-4 gap-4 overflow-hidden font-vazir">
      
      {/* سایدبار کناری زیبا */}
      <aside className="w-20 lg:w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex flex-col p-4 transition-all border border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="bg-orange-500 p-2 rounded-lg">
            <Truck className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold hidden lg:block text-slate-800 dark:text-white">SunPath</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="داشبورد" active />
          <SidebarItem icon={<MapIcon size={20} />} label="مانیتورینگ زنده" />
          <SidebarItem icon={<Settings size={20} />} label="تنظیمات" />
        </nav>
        
        <div className="mt-auto p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl hidden lg:block border border-orange-100 dark:border-orange-800">
          <p className="text-xs text-orange-600 dark:text-orange-400">سیستم مدیریت ناوگان خورشید</p>
          <p className="text-[10px] text-slate-500 mt-1">نسخه ۱.۰.۰</p>
        </div>
      </aside>

      {/* محتوای اصلی (نقشه) */}
      <section className="flex-1 flex flex-col gap-4 min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center px-6 justify-between border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
            <h2 className="font-semibold text-lg italic">خوش اومدی آزاده جون 👋</h2>
          </div>
          <div className="flex gap-2">
             <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-orange-400" />
          </div>
        </header>

        <div className="flex-1 min-h-0 relative">
           <LiveMap />
        </div>
      </section>
    </main>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
      ${active 
        ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 dark:shadow-none' 
        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}
    `}>
      {icon}
      <span className="font-medium hidden lg:block">{label}</span>
    </div>
  );
}
