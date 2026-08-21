'use client';

import { Bell, CircleUserRound, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import type { DriverPageTab, DriverProfile } from './driver-types';

type Props = {
  profile: DriverProfile;
  activeTab: DriverPageTab;
  onProfileClick: () => void;
};

const titles: Record<
  DriverPageTab,
  {
    title: string;
    description: string;
  }
> = {
  dispatch: {
    title: 'مأموریت فعال',
    description: 'مدیریت وضعیت و اطلاعات مأموریت',
  },
  route: {
    title: 'مسیر مأموریت',
    description: 'نمایش مسیر و اطلاعات سفر',
  },
  profile: {
    title: 'پروفایل راننده',
    description: 'اطلاعات حساب و تنظیمات',
  },
};

export function DriverTopbar({ profile, activeTab, onProfileClick }: Props) {
  const { resolvedTheme, setTheme } = useTheme();

  const pageTitle = titles[activeTab];

  const toggleTheme = (): void => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-neutral-50/90 px-4 py-3 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/90 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-base font-black sm:text-lg">
            {pageTitle.title}
          </h1>

          <p className="mt-1 hidden text-xs text-neutral-500 dark:text-neutral-400 sm:block">
            {pageTitle.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.info('اعلان جدیدی برای شما وجود ندارد.')}
            title="اعلان‌ها"
            aria-label="اعلان‌ها"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Bell size={18} />
            <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            title="تغییر حالت روشن و تیره"
            aria-label="تغییر حالت روشن و تیره"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <span suppressHydrationWarning>
              {resolvedTheme === 'dark' ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} />
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={onProfileClick}
            title="پروفایل راننده"
            aria-label="پروفایل راننده"
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-1.5 pl-3 text-right transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            <span className="hidden text-xs font-bold sm:block">
              {profile.fullName}
            </span>

            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-[10px] font-black text-white">
              {profile.avatarInitials}
            </span>

            <CircleUserRound
              size={16}
              className="hidden text-neutral-400 sm:block"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
