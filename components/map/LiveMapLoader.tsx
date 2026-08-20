'use client';

import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
      در حال بارگذاری نقشه...
    </div>
  ),
});

export default function LiveMapLoader() {
  return <LiveMap />;
}
