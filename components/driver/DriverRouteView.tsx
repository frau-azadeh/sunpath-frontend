import { Clock3, Map, MapPin, Navigation, Route } from 'lucide-react';

import { DriverStatCard } from './DriverStatCard';
import type { DriverActiveDispatch } from './driver-types';

type Props = {
  dispatch: DriverActiveDispatch;
};

export function DriverRouteView({ dispatch }: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-100 p-5 sm:p-6 dark:border-neutral-800">
          <div>
            <h2 className="text-lg ">نقشه و مسیر مأموریت</h2>

            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              مسیر برنامه‌ریزی‌شده از مبدأ تا مقصد
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Map size={21} />
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center dark:border-neutral-700 dark:bg-neutral-950 sm:min-h-[460px]">
            <div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-blue-600 shadow-sm dark:bg-neutral-900">
                <Map size={29} />
              </div>

              <p className="mt-5 text-sm ">
                نقشه‌ی مسیر در این بخش نمایش داده می‌شود
              </p>

              <p className="mx-auto mt-2 max-w-md text-xs leading-7 text-neutral-500 dark:text-neutral-400">
                بعد از اتصال Leaflet و Google Directions، مسیر واقعی بین «
                {dispatch.originTitle}» و «{dispatch.destinationTitle}» در این
                کارت نمایش داده خواهد شد.
              </p>
            </div>
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-5">
        <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm ">خلاصه مسیر</p>

          <div className="mt-4 space-y-3">
            <DriverStatCard
              icon={<Route size={17} />}
              label="مسافت کل"
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
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <MapPin size={18} />
            </div>

            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                مبدأ
              </p>

              <p className="mt-1 text-sm font-bold">{dispatch.originTitle}</p>
            </div>
          </div>

          <div className="my-4 mr-5 h-7 border-r border-dashed border-neutral-300 dark:border-neutral-700" />

          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <Navigation size={18} />
            </div>

            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                مقصد
              </p>

              <p className="mt-1 text-sm font-bold">
                {dispatch.destinationTitle}
              </p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
