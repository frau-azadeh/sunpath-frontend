'use client';

import { useEffect, useMemo, useState } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Gauge, MapPin, Navigation, X } from 'lucide-react';
import { MapContainer, Polyline, TileLayer, useMap, Marker, Popup } from 'react-leaflet';

import { signalRService } from '@/services/signalrService';
import { useVehicleStore } from '@/store/useVehicleStore';

import VehicleMarker from './VehicleMarker';

if (typeof window !== 'undefined') {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// آیکون قرمز مخصوص مقصد Dispatch
const destinationIcon = typeof window !== 'undefined' ? new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : undefined;

const TEHRAN_CENTER: [number, number] = [35.6892, 51.389];

type VehicleFilter = 'all' | 'moving' | 'stopped';

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

function MapViewController({
  selectedLat,
  selectedLng,
}: {
  selectedLat: number | null;
  selectedLng: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedLat === null || selectedLng === null) return;

    map.setView([selectedLat, selectedLng], 15, { animate: true });
  }, [selectedLat, selectedLng, map]);

  return null;
}

export default function LiveMap() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const selectedVehicleId = useVehicleStore((state) => state.selectedVehicleId);
  const setSelectedVehicleId = useVehicleStore(
    (state) => state.setSelectedVehicleId,
  );
  const loadVehicles = useVehicleStore((state) => state.loadVehicles);

  const [filter, setFilter] = useState<VehicleFilter>('all');

  useEffect(() => {
    void loadVehicles();
    void signalRService.startConnection();
  }, [loadVehicles]);

  const validVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const lat = Number(vehicle.latitude ?? vehicle.lastLatitude);
      const lng = Number(vehicle.longitude ?? vehicle.lastLongitude);
      const speed = Number(vehicle.speed ?? 0);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat === 0 ||
        lng === 0
      ) {
        return false;
      }

      if (filter === 'moving') return speed > 0;
      if (filter === 'stopped') return speed === 0;
      return true;
    });
  }, [vehicles, filter]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => String(vehicle.id) === String(selectedVehicleId)) ?? null,
    [vehicles, selectedVehicleId],
  );

  const selectedLat = selectedVehicle
    ? Number(selectedVehicle.latitude ?? selectedVehicle.lastLatitude)
    : null;

  const selectedLng = selectedVehicle
    ? Number(selectedVehicle.longitude ?? selectedVehicle.lastLongitude)
    : null;

  // محاسبه مسیر حرکت به مقصد (وقتی ماشین انتخاب شده یا مقصد مشخص داره)
  const activeRoutes = useMemo(() => {
    return vehicles
      .map((v) => {
        const currentLat = Number(v.latitude ?? v.lastLatitude);
        const currentLng = Number(v.longitude ?? v.lastLongitude);
        const destLat = Number(v.destinationLat);
        const destLng = Number(v.destinationLng);

        if (
          Number.isFinite(currentLat) &&
          Number.isFinite(currentLng) &&
          Number.isFinite(destLat) &&
          Number.isFinite(destLng) &&
          destLat !== 0 &&
          destLng !== 0
        ) {
          return {
            id: v.id,
            positions: [
              [currentLat, currentLng] as [number, number],
              [destLat, destLng] as [number, number],
            ],
            destination: [destLat, destLng] as [number, number],
            destinationAddress: v.destinationAddress || 'مقصد Dispatch',
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [vehicles]);

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="relative h-full w-full">
        <MapContainer
          center={TEHRAN_CENTER}
          zoom={12}
          className="z-0 h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <MapResizeHandler />

          <MapViewController
            selectedLat={
              selectedLat !== null && Number.isFinite(selectedLat)
                ? selectedLat
                : null
            }
            selectedLng={
              selectedLng !== null && Number.isFinite(selectedLng)
                ? selectedLng
                : null
            }
          />

          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* ۱. نمایش خطوط مسیر Dispatch به مقصد */}
          {activeRoutes.map(
            (route) =>
              route && (
                <div key={`route-${route.id}`}>
                  <Polyline
                    positions={route.positions}
                    pathOptions={{
                      color: '#6366f1',
                      weight: 4,
                      dashArray: '8, 8',
                      opacity: 0.8,
                    }}
                  />
                  <Marker position={route.destination} icon={destinationIcon}>
                    <Popup>{route.destinationAddress}</Popup>
                  </Marker>
                </div>
              ),
          )}

          {/* ۲. نمایش مارکر واقعی خودروها */}
          {validVehicles.map((vehicle) => (
            <VehicleMarker key={vehicle.id} vehicle={vehicle} />
          ))}
        </MapContainer>

        {/* فیلتر خودروها */}
        <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2 rounded-xl bg-white/90 p-3 shadow-sm backdrop-blur dark:bg-neutral-900/90">
          <div className="flex gap-1">
            {(['all', 'moving', 'stopped'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                  filter === item
                    ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }`}
              >
                {item === 'all' ? 'همه' : item === 'moving' ? 'متحرک' : 'متوقف'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* پنل جزئیات خودروی انتخاب‌شده */}
      {selectedVehicle && (
        <div className="absolute bottom-4 left-4 z-[1000] w-80 rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95">
          <div className="mb-2 flex items-center justify-between border-b border-neutral-200 pb-2 dark:border-neutral-800">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Navigation className="h-4 w-4 text-indigo-600" />
              خودرو {selectedVehicle.plateNumber || selectedVehicle.id}
            </h3>

            <button
              type="button"
              onClick={() => setSelectedVehicleId(null)}
              className="text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-200"
              aria-label="بستن"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
              <Gauge size={14} className="text-indigo-500" />
              {Number(selectedVehicle.speed ?? 0)} km/h
            </div>

            <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
              <Compass size={14} className="text-indigo-500" />
              {Math.round(Number(selectedVehicle.heading ?? 0))}°
            </div>
          </div>

          {selectedVehicle.destinationAddress && (
            <div className="flex items-start gap-2 rounded-lg bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
              <MapPin size={14} className="mt-0.5 text-rose-500 shrink-0" />
              <div>
                <span className="font-semibold block text-[10px] text-neutral-500">مقصد:</span>
                <span className="text-neutral-700 dark:text-neutral-200">{selectedVehicle.destinationAddress}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
