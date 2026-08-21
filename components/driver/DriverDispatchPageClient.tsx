'use client';

import { type ReactNode, useState } from 'react';

import {
  BadgeCheck,
  Bell,
  CircleDotDashed,
  Clock3,
  Flag,
  Loader2,
  Map,
  MapPin,
  Menu,
  Moon,
  Navigation,
  Play,
  Route,
  Settings2,
  Sun,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { dispatchService } from '@/services/dispatchService';

type DriverDispatchStatus = 'Assigned' | 'InProgress' | 'Completed';

type DriverPageTab = 'dispatch' | 'route' | 'profile';

type DriverActiveDispatch = {
  id: number;
  status: DriverDispatchStatus;
  title: string;
  vehiclePlate: string;
  vehicleName: string;
  originTitle: string;
  destinationTitle: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  scheduledAt: string;
};

type DriverProfile = {
  fullName: string;
  phoneNumber: string;
  driverCode: string;
  avatarInitials: string;
  vehicleCount: number;
  completedDispatches: number;
};

const mockDriverProfile: DriverProfile = {
  fullName: 'حسین مرادی',
  phoneNumber: '۰۹۱۲ ۱۲۳ ۴۵۶۷',
  driverCode: 'DRV-1042',
  avatarInitials: 'ح م',
  vehicleCount: 1,
  completedDispatches: 24,
};

const mockDispatch: DriverActiveDispatch = {
  id: 12,
  status: 'Assigned',
  title: 'ارسال بار به شعبه یزد',
  vehicleName: 'کامیونت ایسوزو',
  vehiclePlate: 'ل ۳۵۵ - ۱۲ ۱۲',
  originTitle: 'انبار مرکزی تهران',
  destinationTitle: 'شعبه یزد',
  distanceKm: 620,
  estimatedDurationMinutes: 480,
  scheduledAt: '۱۴۰۵/۰۵/۳۰ - ۰۸:۳۰',
};

const statusConfig: Record<
  DriverDispatchStatus,
  {
    label: string;
    className: string;
  }
> = {
  Assigned: {
    label: 'آماده‌ی شروع',
    className:
      'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
  },
  InProgress: {
    label: 'در حال انجام',
    className:
      'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300',
  },
  Completed: {
    label: 'تکمیل‌شده',
    className:
      'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300',
  },
};

export function DriverDispatchPageClient() {
  const [activeTab, setActiveTab] = useState<DriverPageTab>('dispatch');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatch, setDispatch] = useState<DriverActiveDispatch>(mockDispatch);

  const handleThemeToggle = (): void => {
    const rootElement = document.documentElement;
    const isDarkTheme = rootElement.classList.contains('dark');

    if (isDarkTheme) {
      rootElement.classList.remove('dark');
      localStorage.setItem('sunpath-theme', 'light');
    } else {
      rootElement.classList.add('dark');
      localStorage.setItem('sunpath-theme', 'dark');
    }
  };

  const handleStartDispatch = async (): Promise<void> => {
    try {
      setIsSubmitting(true);

      await dispatchService.updateStatus(dispatch.id, {
        status: 'InProgress',
      });

      setDispatch((current) => ({
        ...current,
        status: 'InProgress',
      }));

      toast.success('مأموریت شروع شد.', {
        description: 'در مرحله‌ی بعد، ارسال موقعیت GPS را فعال می‌کنیم.',
      });
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'شروع مأموریت ناموفق بود.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteDispatch = async (): Promise<void> => {
    try {
      setIsSubmitting(true);

      await dispatchService.updateStatus(dispatch.id, {
        status: 'Completed',
      });

      setDispatch((current) => ({
        ...current,
        status: 'Completed',
      }));

      toast.success('مأموریت با موفقیت پایان یافت.');
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'پایان مأموریت ناموفق بود.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStatus = statusConfig[dispatch.status];

  return (
    <main className="min-h-dvh bg-neutral-50 pb-28 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="mx-auto w-full max-w-3xl">
        <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-neutral-50/90 px-4 py-3 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/90 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="flex min-w-0 items-center gap-2.5 rounded-2xl p-1 text-right transition hover:bg-neutral-100 dark:hover:bg-neutral-900"
              aria-label="نمایش پروفایل راننده"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-sm  text-white">
                {mockDriverProfile.avatarInitials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm ">
                  {mockDriverProfile.fullName}
                </p>

                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  راننده SunPath
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toast.info('اعلان جدیدی برای شما وجود ندارد.')}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                aria-label="اعلان‌ها"
              >
                <Bell size={18} />
                <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500" />
              </button>

              <button
                type="button"
                onClick={handleThemeToggle}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                aria-label="تغییر حالت نمایش"
                title="تغییر حالت روشن و تیره"
              >
                <Moon size={18} className="block dark:hidden" />

                <Sun size={18} className="hidden text-amber-400 dark:block" />
              </button>
            </div>
          </div>
        </header>

        <section className="px-4 pt-5 sm:px-6">
          <div className="flex items-center justify-between rounded-3xl border border-orange-100 bg-white p-4 dark:border-orange-950/60 dark:bg-neutral-900">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <Truck size={24} />
              </div>

              <div>
                <p className="text-lg  tracking-tight">SunPath Driver</p>

                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  مدیریت مأموریت و مسیر راننده
                </p>
              </div>
            </div>

            <div className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-orange-50 px-2 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Navigation size={18} />
            </div>
          </div>
        </section>

        <div className="px-4 pb-6 pt-5 sm:px-6">
          {activeTab === 'dispatch' && (
            <DispatchContent
              dispatch={dispatch}
              currentStatus={currentStatus}
              isSubmitting={isSubmitting}
              onStartDispatch={handleStartDispatch}
              onCompleteDispatch={handleCompleteDispatch}
            />
          )}

          {activeTab === 'route' && <RouteContent dispatch={dispatch} />}

          {activeTab === 'profile' && (
            <ProfileContent
              profile={mockDriverProfile}
              onOpenProfile={() => setIsProfileOpen(true)}
            />
          )}
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} onChangeTab={setActiveTab} />

      <ProfileSheet
        isOpen={isProfileOpen}
        profile={mockDriverProfile}
        onClose={() => setIsProfileOpen(false)}
        onOpenSettings={() => {
          setIsProfileOpen(false);
          toast.info('تنظیمات حساب کاربری پس از پیاده‌سازی لاگین فعال می‌شود.');
        }}
      />
    </main>
  );
}

function DispatchContent({
  dispatch,
  currentStatus,
  isSubmitting,
  onStartDispatch,
  onCompleteDispatch,
}: {
  dispatch: DriverActiveDispatch;
  currentStatus: {
    label: string;
    className: string;
  };
  isSubmitting: boolean;
  onStartDispatch: () => Promise<void>;
  onCompleteDispatch: () => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-100 p-5 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  مأموریت #{dispatch.id.toLocaleString('fa-IR')}
                </p>

                <span
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${currentStatus.className}`}
                >
                  {currentStatus.label}
                </span>
              </div>

              <h1 className="mt-2 text-xl ">{dispatch.title}</h1>

              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                زمان برنامه‌ریزی‌شده: {dispatch.scheduledAt}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
              <Navigation size={21} />
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <InfoRow
            icon={<Truck size={18} />}
            label="خودرو اختصاص‌یافته"
            value={`${dispatch.vehicleName} — ${dispatch.vehiclePlate}`}
          />

          <div className="relative">
            <div className="absolute right-5 top-10 h-9 border-r border-dashed border-neutral-300 dark:border-neutral-700" />

            <InfoRow
              icon={<MapPin size={18} />}
              iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
              label="مبدأ"
              value={dispatch.originTitle}
            />

            <div className="mt-4">
              <InfoRow
                icon={<Flag size={18} />}
                iconClassName="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                label="مقصد"
                value={dispatch.destinationTitle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
            <InfoRow
              compact
              icon={<Route size={17} />}
              label="مسافت"
              value={`${dispatch.distanceKm.toLocaleString('fa-IR')} کیلومتر`}
            />

            <InfoRow
              compact
              icon={<Clock3 size={17} />}
              label="زمان تقریبی"
              value={`${dispatch.estimatedDurationMinutes.toLocaleString(
                'fa-IR',
              )} دقیقه`}
            />
          </div>
        </div>
      </section>

      <TrackingCard status={dispatch.status} />

      {dispatch.status === 'Assigned' && (
        <button
          type="button"
          onClick={() => void onStartDispatch()}
          disabled={isSubmitting}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 text-base  text-white transition hover:bg-orange-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              در حال شروع مأموریت...
            </>
          ) : (
            <>
              <Play size={19} fill="currentColor" />
              شروع مأموریت
            </>
          )}
        </button>
      )}

      {dispatch.status === 'InProgress' && (
        <button
          type="button"
          onClick={() => void onCompleteDispatch()}
          disabled={isSubmitting}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-base  text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              در حال ثبت پایان مأموریت...
            </>
          ) : (
            <>
              <BadgeCheck size={20} />
              پایان مأموریت
            </>
          )}
        </button>
      )}

      {dispatch.status === 'Completed' && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <BadgeCheck size={19} />
          این مأموریت تکمیل شده است.
        </div>
      )}
    </div>
  );
}

function TrackingCard({ status }: { status: DriverDispatchStatus }) {
  const isInProgress = status === 'InProgress';

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          <CircleDotDashed size={19} />
        </div>

        <div>
          <p className="text-sm font-bold">ردیابی موقعیت</p>

          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            موقعیت گوشی شما در زمان انجام مأموریت ارسال می‌شود.
          </p>
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-2 rounded-2xl p-3 text-xs ${
          isInProgress
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
            : 'bg-neutral-50 text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400'
        }`}
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isInProgress ? 'animate-pulse bg-emerald-500' : 'bg-neutral-400'
          }`}
        />

        {isInProgress
          ? 'مأموریت در حال انجام است؛ اتصال GPS در مرحله‌ی بعدی فعال می‌شود.'
          : 'GPS هنوز فعال نشده است.'}
      </div>
    </section>
  );
}

function RouteContent({ dispatch }: { dispatch: DriverActiveDispatch }) {
  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-100 p-5 dark:border-neutral-800">
          <div>
            <p className="text-lg ">مسیر مأموریت</p>

            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              اطلاعات مسیر برنامه‌ریزی‌شده
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Map size={21} />
          </div>
        </div>

        <div className="p-5">
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center dark:border-neutral-700 dark:bg-neutral-950">
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-neutral-500 shadow-sm dark:bg-neutral-900 dark:text-neutral-400">
                <Map size={26} />
              </div>

              <p className="mt-4 text-sm font-bold">
                نقشه‌ی مسیر در مرحله‌ی بعد اضافه می‌شود
              </p>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-neutral-500 dark:text-neutral-400">
                مسیر {dispatch.originTitle} تا {dispatch.destinationTitle} پس از
                اتصال Leaflet و سرویس مسیریابی اینجا نمایش داده می‌شود.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm ">خلاصه‌ی مسیر</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <SmallStat
            icon={<Route size={17} />}
            label="مسافت"
            value={`${dispatch.distanceKm.toLocaleString('fa-IR')} کیلومتر`}
          />

          <SmallStat
            icon={<Clock3 size={17} />}
            label="زمان تقریبی"
            value={`${dispatch.estimatedDurationMinutes.toLocaleString(
              'fa-IR',
            )} دقیقه`}
          />
        </div>
      </section>
    </div>
  );
}

function ProfileContent({
  profile,
  onOpenProfile,
}: {
  profile: DriverProfile;
  onOpenProfile: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-600 text-lg  text-white">
            {profile.avatarInitials}
          </div>

          <div>
            <h1 className="text-lg ">{profile.fullName}</h1>

            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              کد راننده: {profile.driverCode}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-5 dark:border-neutral-800">
          <SmallStat
            icon={<Truck size={17} />}
            label="خودروهای تخصیص‌یافته"
            value={profile.vehicleCount.toLocaleString('fa-IR')}
          />

          <SmallStat
            icon={<BadgeCheck size={17} />}
            label="مأموریت تکمیل‌شده"
            value={profile.completedDispatches.toLocaleString('fa-IR')}
          />
        </div>

        <button
          type="button"
          onClick={onOpenProfile}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <UserRound size={17} />
          مشاهده پروفایل
        </button>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Settings2 size={19} />
          </div>

          <div>
            <p className="text-sm font-bold">تنظیمات راننده</p>

            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              تنظیمات حساب و اعلان‌ها پس از پیاده‌سازی ورود فعال می‌شود.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function BottomNavigation({
  activeTab,
  onChangeTab,
}: {
  activeTab: DriverPageTab;
  onChangeTab: (tab: DriverPageTab) => void;
}) {
  const navigationItems: Array<{
    id: DriverPageTab;
    label: string;
    icon: ReactNode;
  }> = [
    {
      id: 'dispatch',
      label: 'مأموریت',
      icon: <Navigation size={20} />,
    },
    {
      id: 'route',
      label: 'مسیر',
      icon: <Map size={20} />,
    },
    {
      id: 'profile',
      label: 'پروفایل',
      icon: <UserRound size={20} />,
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-900/95">
      <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-2">
        {navigationItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition ${
                isActive
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                  : 'text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ProfileSheet({
  isOpen,
  profile,
  onClose,
  onOpenSettings,
}: {
  isOpen: boolean;
  profile: DriverProfile;
  onClose: () => void;
  onOpenSettings: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="بستن پروفایل"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
      />

      <aside className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-[32px] border border-neutral-200 bg-white p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-base  text-white">
              {profile.avatarInitials}
            </div>

            <div>
              <p className="text-base ">{profile.fullName}</p>

              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {profile.phoneNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label="بستن"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 space-y-2">
          <ProfileAction
            icon={<UserRound size={19} />}
            label="اطلاعات حساب راننده"
            onClick={() =>
              toast.info(
                'اطلاعات حساب پس از اتصال به API کاربر نمایش داده می‌شود.',
              )
            }
          />

          <ProfileAction
            icon={<Settings2 size={19} />}
            label="تنظیمات و اعلان‌ها"
            onClick={onOpenSettings}
          />

          <ProfileAction
            icon={<Menu size={19} />}
            label="راهنمای استفاده از سامانه"
            onClick={() =>
              toast.info('بخش راهنما در نسخه‌ی بعدی اضافه می‌شود.')
            }
          />
        </div>

        <p className="mt-6 text-center text-[11px] text-neutral-400">
          SunPath Fleet Tracking System
        </p>
      </aside>
    </div>
  );
}

function ProfileAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
        {icon}
      </span>

      {label}
    </button>
  );
}

function SmallStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-950">
      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>

      <p className="mt-2 text-sm  text-neutral-800 dark:text-neutral-100">
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  compact = false,
  iconClassName,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  compact?: boolean;
  iconClassName?: string;
}) {
  return (
    <div className={`flex gap-3 ${compact ? 'items-start' : 'items-center'}`}>
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl ${
          compact ? 'h-9 w-9' : 'h-10 w-10'
        } ${
          iconClassName ??
          'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {label}
        </p>

        <p
          className={`mt-0.5 break-words font-bold text-neutral-800 dark:text-neutral-100 ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
