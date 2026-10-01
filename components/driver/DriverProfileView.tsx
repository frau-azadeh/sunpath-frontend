'use client';

import { VehiclePlate } from '@/components/vehicles/VehiclePlate';
import {
  BadgeCheck,
  CalendarDays,
  CarFront,
  CircleUserRound,
  Clock3,
  Gauge,
  MapPin,
  Navigation,
  Phone,
  Route,
  Settings2,
  Star,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';

import { DriverStatCard } from './DriverStatCard';
import type { DriverProfile, DriverRouteHistory } from './driver-types';

type Props = {
  profile: DriverProfile;
  history: DriverRouteHistory[];
  historyLoading?: boolean;
};


const toPersianDigits = (value: string | number): string => {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
};

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDuration = (durationSeconds: number): string => {
  if (!durationSeconds || durationSeconds <= 0) {
    return '—';
  }

  const totalMinutes = Math.floor(durationSeconds / 60);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${toPersianDigits(minutes)} دقیقه`;
  }

  if (minutes === 0) {
    return `${toPersianDigits(hours)} ساعت`;
  }

  return `${toPersianDigits(hours)} ساعت و ${toPersianDigits(minutes)} دقیقه`;
};



export function DriverProfileView({
  profile,
  history,
  historyLoading = false,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-5 border-b border-neutral-100 pb-6 sm:flex-row sm:items-center dark:border-neutral-800">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-orange-600 text-xl font-black text-white">
              {profile.avatarInitials}
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-black">{profile.fullName}</h2>

              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                کد راننده: <span dir="ltr">{profile.driverCode}</span>
              </p>

              <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-amber-600 dark:text-amber-400">
                <Star size={17} fill="currentColor" />
                {profile.rating.toLocaleString('fa-IR')} امتیاز راننده
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-bold">اطلاعات تماس</p>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-950">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-neutral-500 shadow-sm dark:bg-neutral-800 dark:text-neutral-300">
                <Phone size={18} />
              </span>

              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  شماره همراه
                </p>

                <p dir="ltr" className="mt-1 text-right text-sm font-bold">
                  {toPersianDigits(profile.phoneNumber)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-bold">خودروی فعلی</p>

            {profile.currentVehicle ? (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
                      <Truck size={20} />
                    </span>

                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        خودرو
                      </p>

                      <p className="mt-1 text-sm font-black">
                        {profile.currentVehicle.name ||
                          `خودرو شماره ${toPersianDigits(
                            profile.currentVehicle.id,
                          )}`}
                      </p>
                    </div>
                  </div>

                  <VehiclePlate value={profile.currentVehicle.plateNumber} vehicleType={profile.currentVehicle.vehicleType} />
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                <CarFront size={19} />
                در حال حاضر خودروی فعالی به این راننده تخصیص داده نشده است.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => toast.info('ویرایش حساب راننده هنوز فعال نشده است.')}
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
                <p className="text-sm font-bold">آمار راننده</p>

                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  خلاصه عملکرد ثبت‌شده
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <DriverStatCard
                icon={<Truck size={17} />}
                label="خودروی فعال"
                value={profile.currentVehicle ? '۱' : '۰'}
              />

              <DriverStatCard
                icon={<BadgeCheck size={17} />}
                label="مأموریت انجام‌شده"
                value={profile.completedDispatches.toLocaleString('fa-IR')}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm font-bold">درباره حساب کاربری</p>

            <p className="mt-3 text-xs leading-7 text-neutral-500 dark:text-neutral-400">
              اطلاعات خودرو و مأموریت‌های این صفحه از اطلاعات راننده و
              مأموریت‌های ثبت‌شده در سامانه دریافت می‌شوند.
            </p>
          </section>
        </aside>
      </div>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <Route size={20} />
          </span>

          <div>
            <h3 className="font-black">تاریخچه مسیرها</h3>

            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              مأموریت‌های تکمیل‌شده و اطلاعات واقعی GPS
            </p>
          </div>
        </div>

        {historyLoading ? (
          <div className="mt-6 rounded-2xl bg-neutral-50 p-8 text-center text-sm text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
            در حال دریافت تاریخچه مسیر...
          </div>
        ) : history.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
            <Route size={30} className="mx-auto text-neutral-400" />

            <p className="mt-3 text-sm font-bold">
              هنوز تاریخچه مسیری وجود ندارد.
            </p>

            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              پس از تکمیل مأموریت و ثبت GPS، مسیر در این قسمت نمایش داده می‌شود.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {history.map((item) => (
              <article
                key={item.dispatchId}
                className="rounded-2xl border border-neutral-200 p-4 sm:p-5 dark:border-neutral-800"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-black">
                      {item.title ||
                        `مأموریت ${toPersianDigits(item.dispatchId)}`}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={15} />

                        {formatDateTime(item.completedAtUtc)}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Gauge size={15} />
                        {item.distanceKm.toLocaleString('fa-IR', {
                          maximumFractionDigits: 1,
                        })}{' '}
                        کیلومتر
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Clock3 size={15} />

                        {formatDuration(item.durationSeconds)}
                      </span>
                    </div>
                  </div>

                  <VehiclePlate value={item.vehiclePlate} vehicleType={item.vehicleType} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="flex gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950">
                    <MapPin
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />

                    <div>
                      <p className="text-[11px] text-neutral-500">مبدأ</p>

                      <p className="mt-1 text-sm font-bold">
                        {item.originTitle || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-950">
                    <Navigation
                      size={18}
                      className="mt-0.5 shrink-0 text-red-500"
                    />

                    <div>
                      <p className="text-[11px] text-neutral-500">مقصد</p>

                      <p className="mt-1 text-sm font-bold">
                        {item.destinationTitle || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    نقاط GPS ثبت‌شده
                  </span>

                  <span className="font-black text-neutral-800 dark:text-neutral-100">
                    {item.points.length.toLocaleString('fa-IR')} نقطه
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
