'use client';

import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      در حال بارگذاری نقشه...
    </div>
  ),
});

export default function LiveMapLoader() {
  return <LiveMap />;
}
