'use client';

import { useEffect, useMemo, useState } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  Gauge,
  Layers,
  Navigation,
  Play,
  Satellite,
  Square,
  X,
} from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

import { signalRService } from '@/services/signalrService';
import { useVehicleStore } from '@/store/useVehicleStore';

import VehicleMarker from '../map/VehicleMarker';

// فیکس آیکونهای پیشفرض Leaflet
if (typeof window !== 'undefined') {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const TEHRAN_CENTER: [number, number] = [35.6892, 51.389];

type MapMode = 'road' | 'traffic' | 'satellite' | 'dark';

const MAP_LAYERS: Record<
  MapMode,
  { name: string; url: string; attribution: string }
> = {
  road: {
    name: 'جادهای',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  traffic: {
    name: 'ترافیکی',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
  },
  satellite: {
    name: 'ماهوارهای',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar',
  },
  dark: {
    name: 'تیره',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
  },
};

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
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
    if (selectedLat !== null && selectedLng !== null) {
      map.setView([selectedLat, selectedLng], 15, { animate: true });
    }
  }, [selectedLat, selectedLng, map]);
  return null;
}

export default function LiveMapEnhanced() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const selectedVehicleId = useVehicleStore((state) => state.selectedVehicleId);
  const setSelectedVehicleId = useVehicleStore(
    (state) => state.setSelectedVehicleId,
  );
  const loadVehicles = useVehicleStore((state) => state.loadVehicles);
  const updateVehiclePosition = useVehicleStore(
    (state) => state.updateVehiclePosition,
  );

  const [filter, setFilter] = useState<'all' | 'moving' | 'stopped'>('all');
  const [mapMode, setMapMode] = useState<MapMode>('road');
  const [isLocalSimulating, setIsLocalSimulating] = useState(false);

  useEffect(() => {
    void loadVehicles();
    signalRService.startConnection();
  }, [loadVehicles]);

  useEffect(() => {
    if (!isLocalSimulating) return;
    const interval = setInterval(() => {
      vehicles.forEach((vehicle) => {
        const lat = Number(vehicle.latitude);
        const lng = Number(vehicle.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const newLat = lat + (Math.random() - 0.5) * 0.0005;
        const newLng = lng + (Math.random() - 0.5) * 0.0005;
        updateVehiclePosition(
          vehicle.id,
          newLat,
          newLng,
          Math.floor(Math.random() * 60) + 20,
          (Number(vehicle.heading) + 10) % 360,
        );
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocalSimulating, vehicles, updateVehiclePosition]);

  const validVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const lat = Number(v.latitude);
      const lng = Number(v.longitude);
      if (isNaN(lat) || isNaN(lng) || lat === 0) return false;
      if (filter === 'moving') return v.speed > 0;
      if (filter === 'stopped') return v.speed === 0;
      return true;
    });
  }, [vehicles, filter]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
      <div className="relative h-full w-full">
        <MapContainer
          center={TEHRAN_CENTER}
          zoom={12}
          className="z-0 h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <MapResizeHandler />
          <MapViewController
            selectedLat={selectedVehicle ? Number(selectedVehicle.latitude) : null}
            selectedLng={selectedVehicle ? Number(selectedVehicle.longitude) : null}
          />
          <TileLayer
            key={mapMode}
            url={MAP_LAYERS[mapMode].url}
            attribution={MAP_LAYERS[mapMode].attribution}
          />
          {validVehicles.map((v) => (
            <VehicleMarker key={v.id} vehicle={v} />
          ))}
        </MapContainer>

        {/* لایههای نقشه */}
        <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <Layers size={14} className="mr-1 text-orange-500" />
            {(['road', 'traffic', 'satellite', 'dark'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMapMode(mode)}
                className={`rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition-all ${
                  mapMode === mode
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {MAP_LAYERS[mode].name}
              </button>
            ))}
          </div>

          {/* فیلتر وسایل نقلیه */}
          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            {(['all', 'moving', 'stopped'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all ${
                  filter === f
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {f === 'all' ? 'همه' : f === 'moving' ? 'متحرک' : 'متوقف'}
              </button>
            ))}
          </div>

          {/* شبیهساز */}
          <button
            onClick={() => setIsLocalSimulating(!isLocalSimulating)}
            className={`flex items-center justify-center gap-2 rounded-2xl border py-2 text-[10px] font-bold shadow-sm transition-all backdrop-blur ${
              isLocalSimulating
                ? 'animate-pulse border-rose-200 bg-rose-500 text-white dark:border-rose-900'
                : 'border-orange-200 bg-orange-500 text-white hover:bg-orange-600 dark:border-orange-900'
            }`}
          >
            {isLocalSimulating ? (
              <Square size={12} fill="currentColor" />
            ) : (
              <Play size={12} fill="currentColor" />
            )}
            {isLocalSimulating ? 'توقف تست' : 'شبیهساز تست'}
          </button>
        </div>
      </div>

      {/* پنل خودرو انتخابشده */}
      {selectedVehicle && (
        <div className="absolute bottom-4 left-4 z-[1000] w-72 rounded-[20px] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mb-2 flex items-center justify-between border-b pb-2 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Navigation className="h-3 w-3 text-orange-500" />
              خودرو {selectedVehicle.id}
            </h3>
            <button
              onClick={() => setSelectedVehicleId(null)}
              className="text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <Gauge size={12} className="text-orange-500" />
              {selectedVehicle.speed} km/h
            </div>
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <Compass size={12} className="text-orange-500" />
              {selectedVehicle.heading}°
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
