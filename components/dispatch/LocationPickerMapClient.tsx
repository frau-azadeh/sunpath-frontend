'use client';

import { useEffect, useState } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, Layers } from 'lucide-react';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

// تنظیم آیکون‌های استاندارد Leaflet در Next.js
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// آیکون‌های کاستوم مبدأ و مقصد
const createPin = (color: string, text: string) =>
  L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">${text}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const originPin = createPin('#10b981', 'مبدأ');
const destinationPin = createPin('#ef4444', 'مقصد');

interface Coords {
  lat: number;
  lng: number;
}

interface LocationPickerMapClientProps {
  origin: Coords | null;
  destination: Coords | null;
  activeMode: 'origin' | 'destination';
  onLocationSelect: (lat: number, lng: number) => void;
  // آزاده جون اگه کلید Neshan داری می‌تونی پاس بدی، در غیر این صورت از سرور ترافیک اوپن استفاده می‌کنه
  neshanApiKey?: string;
}

function MapEvents({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapBoundsSync({
  origin,
  destination,
}: {
  origin: Coords | null;
  destination: Coords | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (origin && destination) {
      map.fitBounds(
        [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ],
        { padding: [40, 40], maxZoom: 16 },
      );
    } else if (origin) {
      map.setView([origin.lat, origin.lng], 14);
    } else if (destination) {
      map.setView([destination.lat, destination.lng], 14);
    }
  }, [origin, destination, map]);
  return null;
}

export default function LocationPickerMapClient({
  origin,
  destination,
  activeMode,
  onLocationSelect,
  neshanApiKey,
}: LocationPickerMapClientProps) {
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const defaultCenter: [number, number] = [35.6997, 51.338]; // تهران - میدان آزادی

  // URL لایه ترافیک:
  // اگر neshanApiKey باشد مستقیماً از وب‌سرویس نشان لود می‌شود، در غیر این صورت لایه ترافیک استاندارد و بدون محدودیت
  const trafficTileUrl = neshanApiKey
    ? `https://api.neshan.org/v1/traffic?x={x}&y={y}&z={z}`
    : `https://mt1.google.com/vt?lyrs=h,traffic&x={x}&y={y}&z={z}`;

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-inner dark:border-neutral-800 dark:bg-neutral-950">
      {/* دکمه کنترل لایه ترافیک */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white/95 p-1 shadow-md backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
        <button
          type="button"
          onClick={() => setShowTraffic((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            showTraffic
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
          }`}
        >
          <Layers size={13} />
          <span>{showTraffic ? 'ترافیک زنده روشن' : 'نمایش ترافیک'}</span>
        </button>
      </div>

      {/* راهنمای حالت جاری */}
      <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-2 rounded-xl bg-neutral-900/90 px-3 py-1.5 text-xs text-white backdrop-blur shadow-sm">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            activeMode === 'origin' ? 'bg-emerald-400' : 'bg-rose-400'
          }`}
        />
        <span>
          کلیک روی نقشه برای ثبت:{' '}
          <b>{activeMode === 'origin' ? 'مبدأ' : 'مقصد'}</b>
        </span>
      </div>

      <MapContainer
        center={
          origin
            ? [origin.lat, origin.lng]
            : destination
              ? [destination.lat, destination.lng]
              : defaultCenter
        }
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
      >
        {/* نقشه پایه روان و سبک CartoDB (سازگار با تم دارک و لایت بدون قطعی) */}
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* لایه ترافیک زنده (Traffic Flow) */}
        {showTraffic && (
          <TileLayer
            attribution="Traffic Data"
            url={trafficTileUrl}
            opacity={0.75}
            zIndex={300}
            {...(neshanApiKey
              ? {
                  headers: {
                    'Api-Key': neshanApiKey,
                  },
                }
              : {})}
          />
        )}

        <MapEvents onSelect={onLocationSelect} />
        <MapBoundsSync origin={origin} destination={destination} />

        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={originPin} />
        )}
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationPin}
          />
        )}

        {origin && destination && (
          <Polyline
            positions={[
              [origin.lat, origin.lng],
              [destination.lat, destination.lng],
            ]}
            color="#f97316"
            weight={4}
            opacity={0.8}
            dashArray="6, 8"
          />
        )}
      </MapContainer>
    </div>
  );
}
