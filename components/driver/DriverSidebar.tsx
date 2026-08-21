'use client';

import { CircleUserRound, Map, Navigation, Truck } from 'lucide-react';

import type { DriverPageTab, DriverProfile } from './driver-types';

type Props = {
  profile: DriverProfile;
  activeTab: DriverPageTab;
  onTabChange: (tab: DriverPageTab) => void;
};

const navigationItems: Array<{
  id: DriverPageTab;
  label: string;
  description: string;
  icon: typeof Navigation;
}> = [
  {
    id: 'dispatch',
    label: 'مأموریت من',
    description: 'وضعیت مأموریت فعال',
    icon: Navigation,
  },
  {
    id: 'route',
    label: 'مسیر',
    description: 'مسیر و نقشه مأموریت',
    icon: Map,
  },
  {
    id: 'profile',
    label: 'پروفایل',
    description: 'اطلاعات و تنظیمات حساب',
    icon: CircleUserRound,
  },
];

export function DriverSidebar({ profile, activeTab, onTabChange }: Props) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[280px] shrink-0 border-l border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 border-b border-neutral-100 pb-5 dark:border-neutral-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white">
          <Truck size={24} />
        </div>

        <div>
          <p className="text-lg font-black tracking-tight">SunPath Driver</p>

          <p className="mt-0.5 text-[11px] tracking-[0.14em] text-neutral-400">
            FLEET TRACKING SYSTEM
          </p>
        </div>
      </div>

      <nav className="mt-7 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl p-3 text-right transition ${
                isActive
                  ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                  : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isActive
                    ? 'bg-orange-600 text-white'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                <Icon size={19} />
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-black">{item.label}</span>

                <span className="mt-1 block truncate text-[11px] font-normal text-neutral-400">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => onTabChange('profile')}
        className="mt-auto flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-right transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-sm font-black text-white">
          {profile.avatarInitials}
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-black">
            {profile.fullName}
          </span>

          <span className="mt-1 block text-[11px] text-neutral-500 dark:text-neutral-400">
            راننده SunPath
          </span>
        </span>
      </button>
    </aside>
  );
}
