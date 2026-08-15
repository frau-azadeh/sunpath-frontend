'use client';

import dynamic from 'next/dynamic';

const LiveMapEnhanced = dynamic(
  () => import('@/components/map/LiveMapEnhanced'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-[28px] bg-slate-100 dark:bg-slate-800" />
    ),
  },
);

export default function MapClient() {
  return <LiveMapEnhanced />;
}
