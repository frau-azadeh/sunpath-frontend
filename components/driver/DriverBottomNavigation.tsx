'use client';

import { CircleUserRound, Map, Navigation } from 'lucide-react';

import type { DriverPageTab } from './driver-types';

type Props = {
  activeTab: DriverPageTab;
  onTabChange: (tab: DriverPageTab) => void;
};

const navigationItems: Array<{
  id: DriverPageTab;
  label: string;
  icon: typeof Navigation;
}> = [
  {
    id: 'dispatch',
    label: 'مأموریت',
    icon: Navigation,
  },
  {
    id: 'route',
    label: 'مسیر',
    icon: Map,
  },
  {
    id: 'profile',
    label: 'پروفایل',
    icon: CircleUserRound,
  },
];

export function DriverBottomNavigation({ activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-900/95 lg:hidden">
      <div className="mx-auto grid w-full max-w-lg grid-cols-3 gap-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition ${
                isActive
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
