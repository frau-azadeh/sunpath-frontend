'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Bell,
  LayoutDashboard,
  Map as MapIcon,
  Settings,
  Truck,
  X,
} from 'lucide-react';

const navigationItems = [
  {
    href: '/',
    label: 'داشبورد',
    icon: <LayoutDashboard size={20} />,
  },
  {
    href: '/map',
    label: 'مانیتورینگ زنده',
    icon: <MapIcon size={20} />,
  },
  {
    href: '/drivers',
    label: 'رانندگان',
    icon: <Truck size={20} />,
  },
  {
    href: '/alerts',
    label: 'هشدارها',
    icon: <Bell size={20} />,
  },
  {
    href: '/settings',
    label: 'تنظیمات',
    icon: <Settings size={20} />,
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
            <Truck className="text-orange-500" size={22} />
          </div>

          <div>
            <h1 className="text-xl font-bold">SunPath</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fleet Tracking System
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            onClick={onNavigate}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-800 dark:text-slate-300 lg:hidden"
            aria-label="بستن منو"
            type="button"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-2">
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

      <div className="mt-auto rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <p className="text-sm font-medium">سیستم مدیریت ناوگان</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          نسخه ۱.۰.۰
        </p>
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
        'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
        active
          ? 'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-400'
          : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-slate-800 dark:hover:bg-slate-800/60',
      ].join(' ')}
    >
      {icon}
      <span className="hidden font-medium lg:block">{label}</span>
    </Link>
  );
}
