'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Car, CarFront, LayoutDashboard, Map, X } from 'lucide-react';

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    href: '/',
    label: 'داشبورد',
    icon: <LayoutDashboard size={21} strokeWidth={1.8} />,
  },
  {
    href: '/map',
    label: 'مانیتورینگ زنده',
    icon: <Map size={21} strokeWidth={1.8} />,
  },
  {
    href: '/vehicles',
    label: 'مدیریت ناوگان',
    icon: <CarFront size={21} strokeWidth={1.8} />,
  },
];

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      dir="rtl"
      className="
        flex h-full min-h-0 w-full flex-col
        bg-white font-vazir
        dark:bg-neutral-950
        z-[9999]
      "
    >
      {/* ==================== Header / Logo ==================== */}

      <div className="mb-6 flex shrink-0 items-center justify-between gap-3 px-1 sm:mb-8">
        <div className="flex min-w-0 items-center gap-3">
          {/* Logo */}
          <div
            className="
              flex h-11 w-11 shrink-0 items-center justify-center
              rounded-2xl
              border border-neutral-200
              bg-white
              shadow-sm
              dark:border-neutral-800
              dark:bg-neutral-900
            "
          >
            <Car className="text-orange-500" size={24} strokeWidth={2} />
          </div>

          {/* Brand */}
          <div className="min-w-0">
            <h1
              className="
                truncate text-lg  tracking-tight
                text-neutral-900
                dark:text-white
              "
            >
              SunPath
            </h1>

            <p
              className="
                truncate text-[9px] font-medium uppercase
                tracking-[0.12em]
                text-neutral-400
                dark:text-neutral-500
              "
            >
              Fleet Tracking System
            </p>
          </div>
        </div>

        {/* Close button - Mobile */}
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="بستن منو"
            title="بستن منو"
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl
              border border-neutral-200
              bg-white
              text-neutral-600
              transition-all
              hover:bg-neutral-50
              hover:text-neutral-900
              active:scale-95
              dark:border-neutral-800
              dark:bg-neutral-900
              dark:text-neutral-300
              dark:hover:bg-neutral-800
              lg:hidden
            "
          >
            <X size={19} />
          </button>
        )}
      </div>

      {/* ==================== Navigation ==================== */}

      <nav aria-label="منوی اصلی" className="flex flex-col gap-2">
        {navigationItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive}
              onClick={onNavigate}
            />
          );
        })}
      </nav>

      {/* ==================== Footer ==================== */}

      <div className="mt-auto pt-6">
        <div
          className="
            overflow-hidden rounded-[22px]
            border border-neutral-200
            bg-neutral-50
            p-4
            dark:border-neutral-800
            dark:bg-neutral-900/50
          "
        >
          <div className="flex items-center justify-between gap-3">
            <p
              className="
                truncate text-xs font-bold
                text-neutral-900
                dark:text-white
              "
            >
              سیستم مدیریت ناوگان
            </p>

            <span
              aria-label="وضعیت فعال"
              title="سیستم فعال"
              className="
                h-2 w-2 shrink-0
                animate-pulse rounded-full
                bg-emerald-500
              "
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p
              className="
                text-[10px]
                text-neutral-500
                dark:text-neutral-400
              "
            >
              نسخه ۱.۰.۰
            </p>

            <span
              className="
                rounded-full
                bg-emerald-50
                px-2 py-0.5
                text-[9px] font-bold
                text-emerald-600
                dark:bg-emerald-950/30
                dark:text-emerald-400
              "
            >
              فعال
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* =========================================================
   Sidebar Item
========================================================= */

interface SidebarItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({
  href,
  icon,
  label,
  active = false,
  onClick,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`
        group
        flex w-full
        items-center
        gap-3
        rounded-[18px]
        border
        px-4 py-3.5
        transition-all duration-200

        ${
          active
            ? `
              border-orange-100
              bg-orange-50
              text-orange-600
              shadow-sm
              shadow-orange-200/30

              dark:border-orange-900/40
              dark:bg-orange-950/30
              dark:text-orange-400
              dark:shadow-none
            `
            : `
              border-transparent
              text-neutral-600

              hover:border-neutral-200
              hover:bg-neutral-50
              hover:text-neutral-900

              dark:text-neutral-400
              dark:hover:border-neutral-800
              dark:hover:bg-neutral-900
              dark:hover:text-white
            `
        }
      `}
    >
      {/* Icon */}

      <span
        className={`
          flex h-9 w-9
          shrink-0
          items-center justify-center
          rounded-xl
          transition-all duration-200

          ${
            active
              ? `
                bg-white
                text-orange-600
                shadow-sm

                dark:bg-neutral-900
                dark:text-orange-400
              `
              : `
                bg-transparent
                text-neutral-500

                group-hover:bg-white
                group-hover:text-orange-500

                dark:text-neutral-400
                dark:group-hover:bg-neutral-800
                dark:group-hover:text-orange-400
              `
          }
        `}
      >
        {icon}
      </span>

      {/* Label */}

      <span
        className={`
          min-w-0
          flex-1
          whitespace-nowrap
          text-right
          text-sm
          font-bold
          leading-6
          ${
            active
              ? 'text-orange-700 dark:text-orange-400'
              : 'text-neutral-600 dark:text-neutral-300'
          }
        `}
      >
        {label}
      </span>

      {/* Active indicator */}

      {active && (
        <span
          className="
            h-2 w-2
            shrink-0
            rounded-full
            bg-orange-500
            shadow-sm
            shadow-orange-500/50
          "
        />
      )}
    </Link>
  );
}
