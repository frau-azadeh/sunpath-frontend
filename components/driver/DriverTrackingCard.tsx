import { CircleDotDashed } from 'lucide-react';

import type { DriverDispatchStatus } from './driver-types';

type Props = {
  status: DriverDispatchStatus;
};

export function DriverTrackingCard({ status }: Props) {
  const isInProgress = status === 'InProgress';

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          <CircleDotDashed size={19} />
        </div>

        <div>
          <p className="text-sm font-black">ردیابی موقعیت</p>

          <p className="mt-1 text-xs leading-6 text-neutral-500 dark:text-neutral-400">
            موقعیت گوشی راننده در زمان اجرای مأموریت برای مرکز کنترل ارسال
            می‌شود.
          </p>
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-2 rounded-2xl p-3 text-xs font-medium ${
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
          ? 'مأموریت در حال انجام است؛ اتصال GPS در مرحله‌ی بعد فعال می‌شود.'
          : 'ردیابی موقعیت پس از شروع مأموریت فعال می‌شود.'}
      </div>
    </section>
  );
}
