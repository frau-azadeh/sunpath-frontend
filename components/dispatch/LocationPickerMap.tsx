'use client';

import dynamic from 'next/dynamic';

const LocationPickerMapClient = dynamic(
  () => import('./LocationPickerMapClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
        در حال بارگذاری نقشه...
      </div>
    ),
  },
);

export type MapCoords = {
  lat: number;
  lng: number;
};

export interface LocationPickerMapProps {
  origin: MapCoords | null;
  destination: MapCoords | null;
  activeMode: 'origin' | 'destination';
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function LocationPickerMap(props: LocationPickerMapProps) {
  return <LocationPickerMapClient {...props} />;
}
