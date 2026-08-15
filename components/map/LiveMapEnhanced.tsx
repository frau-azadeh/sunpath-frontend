'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import 'leaflet/dist/leaflet.css';
import {
  Compass,
  Gauge,
  Layers,
  Navigation,
  Play,
  Square,
  X,
} from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

import { signalRService } from '@/services/signalrService';
import { useVehicleStore } from '@/store/useVehicleStore';

import VehicleMarker from '../map/VehicleMarker';

const TEHRAN_CENTER: [number, number] = [35.6892, 51.389];

type MapMode = 'road' | 'traffic' | 'satellite' | 'dark';
type VehicleFilter = 'all' | 'moving' | 'stopped';

interface MapLayerConfig {
  name: string;
  url: string;
  attribution: string;
}

const MAP_LAYERS: Record<MapMode, MapLayerConfig> = {
  road: {
    name: 'جاده‌ای',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  traffic: {
    name: 'توپوگرافی',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
  },
  satellite: {
    name: 'ماهواره‌ای',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
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
    if (typeof window === 'undefined') return;

    const timerId = window.setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [map]);

  return null;
}

interface MapViewControllerProps {
  selectedLat: number | null;
  selectedLng: number | null;
}

function MapViewController({
  selectedLat,
  selectedLng,
}: MapViewControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedLat === null || selectedLng === null) {
      return;
    }

    map.setView([selectedLat, selectedLng], 15, {
      animate: true,
    });
  }, [map, selectedLat, selectedLng]);

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

  const [filter, setFilter] = useState<VehicleFilter>('all');
  const [mapMode, setMapMode] = useState<MapMode>('road');
  const [isLocalSimulating, setIsLocalSimulating] = useState(false);

  const vehiclesRef = useRef(vehicles);

  // لود داینامیک تنظیمات آیکون‌های لیفلت فقط روی کلاینت
// لود داینامیک تنظیمات آیکون‌های لیفلت فقط روی کلاینت
useEffect(() => {
  if (typeof window === 'undefined') return;

  const setupLeafletIcons = async () => {
    const L = await import('leaflet');

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  };

  void setupLeafletIcons();
}, []);


  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  useEffect(() => {
    void loadVehicles();
    void signalRService.startConnection();
  }, [loadVehicles]);

  useEffect(() => {
    if (!isLocalSimulating || typeof window === 'undefined') {
      return;
    }

    const intervalId = window.setInterval(() => {
      vehiclesRef.current.forEach((vehicle) => {
        const latitude = Number(vehicle.latitude);
        const longitude = Number(vehicle.longitude);
        const heading = Number(vehicle.heading);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return;
        }

        const newLatitude = latitude + (Math.random() - 0.5) * 0.0005;
        const newLongitude = longitude + (Math.random() - 0.5) * 0.0005;
        const newSpeed = Math.floor(Math.random() * 60) + 20;
        const newHeading =
          ((Number.isFinite(heading) ? heading : 0) + 10) % 360;

        updateVehiclePosition(
          vehicle.id,
          newLatitude,
          newLongitude,
          newSpeed,
          newHeading,
        );
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLocalSimulating, updateVehiclePosition]);

  const validVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const latitude = Number(vehicle.latitude);
      const longitude = Number(vehicle.longitude);
      const speed = Number(vehicle.speed);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude === 0 ||
        longitude === 0
      ) {
        return false;
      }

      if (filter === 'moving') {
        return speed > 0;
      }

      if (filter === 'stopped') {
        return speed === 0;
      }

      return true;
    });
  }, [vehicles, filter]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId],
  );

  const selectedLatitude = selectedVehicle
    ? Number(selectedVehicle.latitude)
    : null;

  const selectedLongitude = selectedVehicle
    ? Number(selectedVehicle.longitude)
    : null;

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
            selectedLat={
              Number.isFinite(selectedLatitude ?? NaN) ? selectedLatitude : null
            }
            selectedLng={
              Number.isFinite(selectedLongitude ?? NaN)
                ? selectedLongitude
                : null
            }
          />

          <TileLayer
            key={mapMode}
            url={MAP_LAYERS[mapMode].url}
            attribution={MAP_LAYERS[mapMode].attribution}
          />

          {validVehicles.map((vehicle) => (
            <VehicleMarker key={vehicle.id} vehicle={vehicle} />
          ))}
        </MapContainer>

        <div className="absolute right-4 top-4 z-[1000] flex max-w-[calc(100%-2rem)] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <Layers size={14} className="mr-1 shrink-0 text-orange-500" />

            {(Object.keys(MAP_LAYERS) as MapMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMapMode(mode)}
                className={`rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                  mapMode === mode
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {MAP_LAYERS[mode].name}
              </button>
            ))}
          </div>

          <div className="flex w-fit gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            {(['all', 'moving', 'stopped'] as const).map((filterOption) => (
              <button
                key={filterOption}
                type="button"
                onClick={() => setFilter(filterOption)}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                  filter === filterOption
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {filterOption === 'all'
                  ? 'همه'
                  : filterOption === 'moving'
                    ? 'متحرک'
                    : 'متوقف'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsLocalSimulating((current) => !current)}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-[10px] font-bold shadow-sm transition-colors ${
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

            {isLocalSimulating ? 'توقف تست' : 'شبیه‌ساز تست'}
          </button>
        </div>
      </div>

      {selectedVehicle && (
        <div className="absolute bottom-4 left-4 z-[1000] w-72 max-w-[calc(100%-2rem)] rounded-[20px] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
            <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold">
              <Navigation className="h-3 w-3 shrink-0 text-orange-500" />
              <span className="truncate">خودرو {selectedVehicle.id}</span>
            </h3>

            <button
              type="button"
              onClick={() => setSelectedVehicleId(null)}
              className="shrink-0 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="بستن اطلاعات خودرو"
              title="بستن"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <Gauge size={12} className="text-orange-500" />
              {Number(selectedVehicle.speed) || 0} km/h
            </div>

            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <Compass size={12} className="text-orange-500" />
              {Number(selectedVehicle.heading) || 0}°
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
