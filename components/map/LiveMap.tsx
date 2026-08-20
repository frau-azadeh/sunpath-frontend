'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Gauge, Navigation, Play, Square, X } from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

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
  const updateVehiclePosition = useVehicleStore(
    (state) => state.updateVehiclePosition,
  );

  const [filter, setFilter] = useState<VehicleFilter>('all');
  const [isLocalSimulating, setIsLocalSimulating] = useState(false);

  const vehiclesRef = useRef(vehicles);

  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  useEffect(() => {
    void loadVehicles();
    void signalRService.startConnection();
  }, [loadVehicles]);

  useEffect(() => {
    if (!isLocalSimulating) return;

    const intervalId = window.setInterval(() => {
      vehiclesRef.current.forEach((vehicle) => {
        const lat = Number(vehicle.latitude);
        const lng = Number(vehicle.longitude);
        const heading = Number(vehicle.heading ?? 0);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const newLat = lat + (Math.random() - 0.5) * 0.0005;
        const newLng = lng + (Math.random() - 0.5) * 0.0005;
        const newSpeed = Math.floor(Math.random() * 60) + 20;
        const newHeading = (heading + 10) % 360;

        updateVehiclePosition(vehicle.id, newLat, newLng, newSpeed, newHeading);
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isLocalSimulating, updateVehiclePosition]);

  const validVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const lat = Number(vehicle.latitude);
      const lng = Number(vehicle.longitude);
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

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null;

  const selectedLat = selectedVehicle ? Number(selectedVehicle.latitude) : null;

  const selectedLng = selectedVehicle
    ? Number(selectedVehicle.longitude)
    : null;

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

          {validVehicles.map((vehicle) => (
            <VehicleMarker key={vehicle.id} vehicle={vehicle} />
          ))}
        </MapContainer>

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

          <button
            type="button"
            onClick={() => setIsLocalSimulating((current) => !current)}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-bold text-white transition-all ${
              isLocalSimulating ? 'animate-pulse bg-rose-500' : 'bg-indigo-600'
            }`}
          >
            {isLocalSimulating ? (
              <Square size={12} fill="currentColor" />
            ) : (
              <Play size={12} fill="currentColor" />
            )}
            {isLocalSimulating ? 'توقف تست' : 'شبیه‌ساز تست'}
          </button>
        </div>
      </div>

      {selectedVehicle && (
        <div className="absolute bottom-4 left-4 z-[1000] w-72 rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95">
          <div className="mb-2 flex items-center justify-between border-b border-neutral-200 pb-2 dark:border-neutral-800">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Navigation className="h-3 w-3 text-orange-500" />
              خودرو {selectedVehicle.id}
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

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
              <Gauge size={12} className="text-orange-500" />
              {Number(selectedVehicle.speed ?? 0)} km/h
            </div>

            <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
              <Compass size={12} className="text-orange-500" />
              {Number(selectedVehicle.heading ?? 0)}°
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
