'use client';

import { useEffect } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import type { LocationPickerMapProps } from './LocationPickerMap';

const defaultCenter: [number, number] = [35.6892, 51.389]; // Tehran

function createPinIcon(color: string, arrow: string, shadowColor: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        position: relative;
        width: 42px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translateY(-2px);
      ">
        <div style="
          position: absolute;
          inset: 0;
          width: 42px;
          height: 42px;
          margin: 0 auto;
          border-radius: 9999px 9999px 9999px 4px;
          background: ${color};
          transform: rotate(45deg);
          box-shadow: 0 10px 24px ${shadowColor};
          border: 2px solid rgba(255,255,255,0.95);
        "></div>

        <div style="
          position: relative;
          z-index: 2;
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: rgba(0,0,0,0.08);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          font-weight: 900;
          line-height: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.35);
        ">${arrow}</div>

        <div style="
          position: absolute;
          bottom: 1px;
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 14px solid ${color};
          filter: drop-shadow(0 4px 6px ${shadowColor});
        "></div>
      </div>
    `,
    iconSize: [42, 56],
    iconAnchor: [21, 56],
    popupAnchor: [0, -52],
  });
}

const originIcon = createPinIcon('#10b981', '●', 'rgba(16,185,129,0.45)');
const destinationIcon = createPinIcon('#f43f5e', '✓', 'rgba(244,63,94,0.45)');

function MapClickHandler({
  onLocationSelect,
}: Pick<LocationPickerMapProps, 'onLocationSelect'>) {
  useMapEvents({
    click(event) {
      onLocationSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapUpdater({
  origin,
  destination,
}: Pick<LocationPickerMapProps, 'origin' | 'destination'>) {
  const map = useMap();

  useEffect(() => {
    const point = origin ?? destination;
    if (point) {
      map.setView([point.lat, point.lng], 14, { animate: true });
    }
  }, [map, origin, destination]);

  return null;
}

export default function LocationPickerMapClient({
  origin,
  destination,
  activeMode,
  onLocationSelect,
}: LocationPickerMapProps) {
  useEffect(() => {
    delete (
      L.Icon.Default.prototype as unknown as {
        _getIconUrl?: unknown;
      }
    )._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }, []);

  const center: [number, number] =
    origin?.lat != null && origin?.lng != null
      ? [origin.lat, origin.lng]
      : destination?.lat != null && destination?.lng != null
        ? [destination.lat, destination.lng]
        : defaultCenter;

  const hasBoth = Boolean(origin && destination);

  const linePositions: [number, number][] =
    origin && destination
      ? [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ]
      : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-[11px] font-bold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
        <span>حالت انتخاب: {activeMode === 'origin' ? 'مبدأ' : 'مقصد'}</span>
        <span>
          {hasBoth ? 'مبدأ و مقصد مشخص شده‌اند' : 'روی نقشه کلیک کنید'}
        </span>
      </div>

      <MapContainer
        center={center}
        zoom={12}
        className="h-[320px] w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onLocationSelect={onLocationSelect} />
        <MapUpdater origin={origin} destination={destination} />

        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon} />
        )}

        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
          />
        )}

        {hasBoth && (
          <Polyline
            positions={linePositions}
            pathOptions={{
              color: '#fb923c',
              weight: 4,
              opacity: 0.95,
              dashArray: '10 8',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
