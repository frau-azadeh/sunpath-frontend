'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Bell,
  Car,
  CarFront,
  LayoutDashboard,
  Map,
  Settings,
  X,
} from 'lucide-react';

const navigationItems = [
  {
    href: '/',
    label: 'داشبورد',
    icon: <LayoutDashboard size={22} strokeWidth={1.5} />,
  },
  {
    href: '/map',
    label: 'مانیتورینگ زنده',
    icon: <Map size={22} strokeWidth={1.5} />,
  },
  {
    href: '/vehicles',
    label: 'مدیریت ناوگان',
    icon: <CarFront size={22} strokeWidth={1.5} />,
  },
  {
    href: '/alerts',
    label: 'هشدارها',
    icon: <Bell size={22} strokeWidth={1.5} />,
  },
  {
    href: '/settings',
    label: 'تنظیمات',
    icon: <Settings size={22} strokeWidth={1.5} />,
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 p-2 dark:border-slate-800">
            <Car className="text-orange-500" size={24} strokeWidth={2} />
          </div>

          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              SunPath
            </h1>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Fleet Tracking System
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            onClick={onNavigate}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label="بستن منو"
            type="button"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1.5">
        {navigationItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            }
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800/50 dark:bg-slate-900/30">
        <p className="text-xs font-bold text-slate-900 dark:text-white">
          سیستم مدیریت ناوگان
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            نسخه ۱.۰.۰
          </p>
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>
    </>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  active = false,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex cursor-pointer items-center gap-3 rounded-[20px] border px-4 py-3.5 transition-all duration-200',
        active
          ? 'border-orange-100 bg-orange-50/80 text-orange-600 shadow-sm shadow-orange-200/20 dark:border-orange-900/30 dark:bg-orange-950/20 dark:text-orange-400 dark:shadow-none'
          : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200',
      ].join(' ')}
    >
      <span className={active ? 'text-orange-600 dark:text-orange-400' : ''}>
        {icon}
      </span>
      <span className="text-sm font-bold">{label}</span>
    </Link>
  );
}
