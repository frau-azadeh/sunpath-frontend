'use client';

import { useEffect, useMemo, useState } from 'react';

import 'leaflet/dist/leaflet.css';
import {
  Compass,
  Gauge,
  Layers,
  MapPin,
  Navigation,
  TrafficCone,
  X,
} from 'lucide-react';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';

import { signalRService } from '@/services/signalrService';
import { useVehicleStore } from '@/store/useVehicleStore';
import { Vehicle } from '@/types/fleet';

import VehicleMarker from '../map/VehicleMarker';

const TEHRAN_CENTER: [number, number] = [35.6892, 51.389];

type MapMode = 'road' | 'traffic' | 'satellite' | 'dark';
type VehicleFilter = 'all' | 'moving' | 'stopped';

interface MapLayerConfig {
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
}

const MAP_LAYERS: Record<MapMode, MapLayerConfig> = {
  road: {
    name: 'جاده‌ای',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  traffic: {
    name: 'ترافیک زنده',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap & Traffic Overlay',
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

// کاشی‌های لایه ترافیک زنده شهری
const TRAFFIC_OVERLAY_URL =
  'https://traffic.openterrain.org/{z}/{x}/{y}.png';

// آیکون‌های مبدأ و مقصد
const originIcon = L.divIcon({
  className: 'bg-transparent',
  html: `
    <div class="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 border-2 border-white shadow-md">
      <span class="w-2.5 h-2.5 bg-white rounded-full"></span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const destinationIcon = L.divIcon({
  className: 'bg-transparent',
  html: `
    <div class="flex items-center justify-center w-7 h-7 rounded-full bg-rose-600 border-2 border-white shadow-md animate-bounce">
      <span class="w-2.5 h-2.5 bg-white rounded-full"></span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timerId = window.setTimeout(() => {
      map.invalidateSize();
    }, 250);

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

// کامپوننت رسم خط سیر و مبدا/مقصد خودرو بر اساس داده‌های واقعی
function ActiveVehicleRoute({ vehicle }: { vehicle: Vehicle }) {
  const origin = useMemo(() => {
    const lat = Number(vehicle.originLat ?? vehicle.dispatch?.originLat);
    const lng = Number(vehicle.originLng ?? vehicle.dispatch?.originLng);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
      ? ([lat, lng] as [number, number])
      : null;
  }, [vehicle]);

  const destination = useMemo(() => {
    const lat = Number(vehicle.destinationLat ?? vehicle.dispatch?.destinationLat);
    const lng = Number(vehicle.destinationLng ?? vehicle.dispatch?.destinationLng);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
      ? ([lat, lng] as [number, number])
      : null;
  }, [vehicle]);

  const currentPos = useMemo(() => {
    const lat = Number(vehicle.latitude ?? vehicle.lastLatitude);
    const lng = Number(vehicle.longitude ?? vehicle.lastLongitude);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
      ? ([lat, lng] as [number, number])
      : null;
  }, [vehicle.latitude, vehicle.longitude, vehicle.lastLatitude, vehicle.lastLongitude]);

  if (!currentPos) return null;

  // ساخت مسیر پیوسته از مبدا -> موقعیت زنده خودرو -> مقصد
  const pathPoints: [number, number][] = [];
  if (origin) pathPoints.push(origin);
  pathPoints.push(currentPos);
  if (destination) pathPoints.push(destination);

  const originAddress =
    vehicle.originAddress || vehicle.dispatch?.originAddress || 'مبدأ مأموریت';
  const destinationAddress =
    vehicle.destinationAddress ||
    vehicle.dispatch?.destinationAddress ||
    'مقصد مأموریت';

  return (
    <>
      {origin && (
        <Marker position={origin} icon={originIcon}>
          <Popup>
            <div className="text-xs font-vazir text-right">
              <span className="font-bold text-emerald-600 block">مبدأ مأموریت</span>
              <span>{originAddress}</span>
            </div>
          </Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={destination} icon={destinationIcon}>
          <Popup>
            <div className="text-xs font-vazir text-right">
              <span className="font-bold text-rose-600 block">مقصد نهایی</span>
              <span>{destinationAddress}</span>
            </div>
          </Popup>
        </Marker>
      )}

      {pathPoints.length >= 2 && (
        <Polyline
          positions={pathPoints}
          pathOptions={{
            color: '#f97316',
            weight: 4,
            opacity: 0.85,
            dashArray: '8, 8',
          }}
        />
      )}
    </>
  );
}

export default function LiveMapEnhanced() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const selectedVehicleId = useVehicleStore((state) => state.selectedVehicleId);
  const setSelectedVehicleId = useVehicleStore(
    (state) => state.setSelectedVehicleId,
  );
  const loadVehicles = useVehicleStore((state) => state.loadVehicles);

  const [filter, setFilter] = useState<VehicleFilter>('all');
  const [mapMode, setMapMode] = useState<MapMode>('road');
  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);
  const [showRoutesForAllMoving, setShowRoutesForAllMoving] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupLeafletIcons = async () => {
      const leaflet = await import('leaflet');

      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    };

    void setupLeafletIcons();
  }, []);

  useEffect(() => {
    void loadVehicles();
    void signalRService.startConnection();
  }, [loadVehicles]);

  const validVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const latitude = Number(vehicle.latitude ?? vehicle.lastLatitude);
      const longitude = Number(vehicle.longitude ?? vehicle.lastLongitude);
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
    ? Number(selectedVehicle.latitude ?? selectedVehicle.lastLatitude)
    : null;

  const selectedLongitude = selectedVehicle
    ? Number(selectedVehicle.longitude ?? selectedVehicle.lastLongitude)
    : null;

  const originText =
    selectedVehicle?.originAddress || selectedVehicle?.dispatch?.originAddress;
  const destText =
    selectedVehicle?.destinationAddress ||
    selectedVehicle?.dispatch?.destinationAddress;

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
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

          {/* لایه زنده ترافیک خیابان‌ها */}
          {(mapMode === 'traffic' || showTrafficOverlay) && (
            <TileLayer
              url={TRAFFIC_OVERLAY_URL}
              opacity={0.65}
              zIndex={400}
            />
          )}

          {/* نمایش مبدأ، مقصد و مسیر برای خودروی انتخاب‌شده */}
          {selectedVehicle && <ActiveVehicleRoute vehicle={selectedVehicle} />}

          {/* نمایش مسیر برای همه خودروهای متحرک در صورت فعال بودن سوئیچ */}
          {showRoutesForAllMoving &&
            validVehicles
              .filter(
                (v) =>
                  Number(v.speed) > 0 &&
                  (!selectedVehicle || v.id !== selectedVehicle.id),
              )
              .map((v) => <ActiveVehicleRoute key={`route-${v.id}`} vehicle={v} />)}

          {validVehicles.map((vehicle) => (
            <VehicleMarker key={vehicle.id} vehicle={vehicle} />
          ))}
        </MapContainer>

        {/* پنل ابزارهای گوشه نقشه */}
        <div className="absolute right-4 top-4 z-[1000] flex max-w-[calc(100%-2rem)] flex-col gap-2">
          {/* انتخاب لایه نقشه */}
          <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-neutral-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
            <Layers size={14} className="mr-1 shrink-0 text-orange-500" />

            {(Object.keys(MAP_LAYERS) as MapMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMapMode(mode)}
                className={`rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                  mapMode === mode
                    ? 'bg-orange-500 text-white'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }`}
              >
                {MAP_LAYERS[mode].name}
              </button>
            ))}
          </div>

          {/* سوئیچ ترافیک و مسیرها */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
            <button
              type="button"
              onClick={() => setShowTrafficOverlay((prev) => !prev)}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                showTrafficOverlay
                  ? 'bg-amber-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              <TrafficCone size={12} />
              {showTrafficOverlay ? 'ترافیک فعال' : 'ترافیک خاموش'}
            </button>

            <button
              type="button"
              onClick={() => setShowRoutesForAllMoving((prev) => !prev)}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                showRoutesForAllMoving
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              <MapPin size={12} />
              {showRoutesForAllMoving ? 'تمام مقاصد' : 'فقط خودرو انتخابی'}
            </button>
          </div>

          {/* فیلتر خودروها */}
          <div className="flex w-fit gap-1 rounded-2xl border border-neutral-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
            {(['all', 'moving', 'stopped'] as const).map((filterOption) => (
              <button
                key={filterOption}
                type="button"
                onClick={() => setFilter(filterOption)}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                  filter === filterOption
                    ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
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
        </div>
      </div>

      {/* اطلاعات خودروی انتخاب شده بر اساس دیتای واقعی */}
      {selectedVehicle && (
        <div className="absolute bottom-4 left-4 z-[1000] w-80 max-w-[calc(100%-2rem)] rounded-[20px] border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95">
          <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-2 dark:border-neutral-800">
            <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold">
              <Navigation className="h-4 w-4 shrink-0 text-orange-500" />
              <span className="truncate">
                خودرو {selectedVehicle.plateNumber || selectedVehicle.id}
              </span>
            </h3>

            <button
              type="button"
              onClick={() => setSelectedVehicleId(null)}
              className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-200"
              aria-label="بستن اطلاعات خودرو"
              title="بستن"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-neutral-100 p-2 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              <span className="text-emerald-500">⛽</span>
              <span>{Number(selectedVehicle.fuelConsumedLiters ?? 0).toFixed(2)} لیتر</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-neutral-100 p-2 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              <span className="text-sky-500">📏</span>
              <span>{Number(selectedVehicle.tripDistanceKm ?? 0).toFixed(2)} کیلومتر</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-neutral-100 p-2 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              <Gauge size={14} className="text-orange-500" />
              <span>{Number(selectedVehicle.speed) || 0} km/h</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg bg-neutral-100 p-2 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              <Compass size={14} className="text-orange-500" />
              <span>{Math.round(Number(selectedVehicle.heading)) || 0}°</span>
            </div>
          </div>

          {/* مشخصات مبدأ و مقصد مأموریت واقعی در صورت وجود */}
          {(originText || destText) && (
            <div className="space-y-1.5 border-t border-neutral-200 pt-2 text-[11px] dark:border-neutral-800">
              {originText && (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 truncate">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-neutral-400 shrink-0">مبدأ:</span>
                  <span className="truncate">{originText}</span>
                </div>
              )}
              {destText && (
                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 truncate">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-neutral-400 shrink-0">مقصد:</span>
                  <span className="truncate">{destText}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
