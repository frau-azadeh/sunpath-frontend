import {
  BadgeCheck,
  CircleUserRound,
  Phone,
  Settings2,
  Star,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';

import { DriverStatCard } from './DriverStatCard';
import type { DriverProfile } from './driver-types';

type Props = {
  profile: DriverProfile;
};

export function DriverProfileView({ profile }: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-5 border-b border-neutral-100 pb-6 sm:flex-row sm:items-center dark:border-neutral-800">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-orange-600 text-xl font-black text-white">
            {profile.avatarInitials}
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-black">{profile.fullName}</h2>

            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              کد راننده: {profile.driverCode}
            </p>

            <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-amber-600 dark:text-amber-400">
              <Star size={17} fill="currentColor" />
              {profile.rating.toLocaleString('fa-IR')} امتیاز راننده
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-black">اطلاعات تماس</p>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
              <Phone size={18} />
            </span>

            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                شماره همراه
              </p>

              <p className="mt-1 text-sm font-bold">{profile.phoneNumber}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            toast.info(
              'ویرایش پروفایل پس از پیاده‌سازی ورود و مدیریت حساب فعال می‌شود.',
            )
          }
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <Settings2 size={18} />
          تنظیمات حساب راننده
        </button>
      </section>

      <aside className="flex flex-col gap-5">
        <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
              <CircleUserRound size={19} />
            </span>

            <div>
              <p className="text-sm font-black">آمار راننده</p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                خلاصه عملکرد ثبت‌شده
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <DriverStatCard
              icon={<Truck size={17} />}
              label="خودرو"
              value={profile.vehicleCount.toLocaleString('fa-IR')}
            />

            <DriverStatCard
              icon={<BadgeCheck size={17} />}
              label="مأموریت انجام‌شده"
              value={profile.completedDispatches.toLocaleString('fa-IR')}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm font-black">درباره حساب کاربری</p>

          <p className="mt-3 text-xs leading-7 text-neutral-500 dark:text-neutral-400">
            پس از ساخت سیستم Login، اطلاعات این بخش از حساب راننده‌ی واردشده
            دریافت می‌شود و امکان تغییر رمز، شماره تماس و تنظیمات اعلان فراهم
            خواهد شد.
          </p>
        </section>
      </aside>
    </div>
  );
}
