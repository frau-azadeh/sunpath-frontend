'use client';

import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] w-full items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <span>در حال بارگذاری نقشه…</span>
      </div>
    </div>
  ),
});

export default LiveMap;
