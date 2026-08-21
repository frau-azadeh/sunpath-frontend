import {
  BadgeCheck,
  Clock3,
  Flag,
  Loader2,
  MapPin,
  Navigation,
  Play,
  Route,
  Truck,
} from 'lucide-react';

import { DriverInfoRow } from './DriverInfoRow';
import { DriverStatCard } from './DriverStatCard';
import { DriverTrackingCard } from './DriverTrackingCard';
import { dispatchStatusConfig } from './driver-data';
import type { DriverActiveDispatch } from './driver-types';

type Props = {
  dispatch: DriverActiveDispatch;
  isSubmitting: boolean;
  onStartDispatch: () => Promise<void>;
  onCompleteDispatch: () => Promise<void>;
};

export function DriverDispatchView({
  dispatch,
  isSubmitting,
  onStartDispatch,
  onCompleteDispatch,
}: Props) {
  const currentStatus = dispatchStatusConfig[dispatch.status];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex min-w-0 flex-col gap-5">
        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-100 p-5 sm:p-6 dark:border-neutral-800">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    مأموریت #{dispatch.id.toLocaleString('fa-IR')}
                  </span>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${currentStatus.className}`}
                  >
                    {currentStatus.label}
                  </span>
                </div>

                <h2 className="mt-3 text-xl  sm:text-2xl">{dispatch.title}</h2>

                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  زمان برنامه‌ریزی‌شده: {dispatch.scheduledAt}
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
                <Navigation size={22} />
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <DriverInfoRow
              icon={<Truck size={18} />}
              label="خودرو اختصاص‌یافته"
              value={`${dispatch.vehicleName} — ${dispatch.vehiclePlate}`}
            />

            <div className="relative">
              <div className="absolute right-5 top-10 h-10 border-r border-dashed border-neutral-300 dark:border-neutral-700" />

              <DriverInfoRow
                icon={<MapPin size={18} />}
                label="مبدأ"
                value={dispatch.originTitle}
                iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
              />

              <div className="mt-5">
                <DriverInfoRow
                  icon={<Flag size={18} />}
                  label="مقصد"
                  value={dispatch.destinationTitle}
                  iconClassName="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-neutral-100 pt-5 sm:grid-cols-2 dark:border-neutral-800">
              <DriverStatCard
                icon={<Route size={17} />}
                label="مسافت مسیر"
                value={`${dispatch.distanceKm.toLocaleString('fa-IR')} کیلومتر`}
              />

              <DriverStatCard
                icon={<Clock3 size={17} />}
                label="زمان تقریبی"
                value={`${dispatch.estimatedDurationMinutes.toLocaleString(
                  'fa-IR',
                )} دقیقه`}
              />
            </div>
          </div>
        </section>

        <DriverTrackingCard status={dispatch.status} />
      </div>

      <aside className="flex flex-col gap-4">
        <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm ">عملیات مأموریت</p>

          <p className="mt-2 text-xs leading-6 text-neutral-500 dark:text-neutral-400">
            وضعیت مأموریت را از همین بخش تغییر دهید.
          </p>

          <div className="mt-5">
            {dispatch.status === 'Assigned' && (
              <button
                type="button"
                onClick={() => void onStartDispatch()}
                disabled={isSubmitting}
                className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm  text-white transition hover:bg-orange-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    در حال شروع...
                  </>
                ) : (
                  <>
                    <Play size={18} fill="currentColor" />
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
                className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm  text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    در حال ثبت پایان...
                  </>
                ) : (
                  <>
                    <BadgeCheck size={19} />
                    پایان مأموریت
                  </>
                )}
              </button>
            )}

            {dispatch.status === 'Completed' && (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                <BadgeCheck size={18} />
                مأموریت تکمیل شده است
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm ">راهنمای راننده</p>

          <ul className="mt-4 space-y-3 text-xs leading-6 text-neutral-500 dark:text-neutral-400">
            <li>• قبل از شروع، از روشن‌بودن اینترنت مطمئن شوید.</li>
            <li>• در مرحله‌ی بعد GPS برای ثبت مسیر فعال می‌شود.</li>
            <li>• پس از رسیدن به مقصد، مأموریت را تکمیل کنید.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
