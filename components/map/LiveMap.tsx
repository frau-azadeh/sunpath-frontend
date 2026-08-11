'use client';

import { useEffect } from 'react';

import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

import { useVehicleStore } from '@/store/useVehicleStore';

import VehicleMarker from './VehicleMarker';

// رفع مشکل بارگذاری آیکون پیش‌فرض در Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const TEHRAN_CENTER: [number, number] = [35.6892, 51.389];

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const resizeMap = () => {
      map.invalidateSize();
    };

    const timer = window.setTimeout(resizeMap, 250);

    window.addEventListener('resize', resizeMap);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', resizeMap);
    };
  }, [map]);

  return null;
}

export default function LiveMap() {
  const vehicles = useVehicleStore((state) => state.vehicles);

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <MapContainer
        center={TEHRAN_CENTER}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
      >
        <MapResizeHandler />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {vehicles
          .filter(
            (vehicle) => vehicle.latitude != null && vehicle.longitude != null,
          )
          .map((vehicle) => (
            <VehicleMarker key={vehicle.id} vehicle={vehicle} />
          ))}
      </MapContainer>

      <div className="pointer-events-none absolute right-4 top-4 z-[1000] rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>

          <span>{vehicles.length} خودرو متصل</span>
        </div>
      </div>
    </div>
  );
}
