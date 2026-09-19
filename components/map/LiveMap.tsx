'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Gauge, MapPin, Navigation, X } from 'lucide-react';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';

import { signalRService } from '@/services/signalrService';
import { useDispatchStore } from '@/store/dispatch-store';
import { useVehicleStore } from '@/store/useVehicleStore';
import type { Dispatch } from '@/types/dispatch';
import type { Vehicle } from '@/types/fleet';

import VehicleMarker from './VehicleMarker';

const TEHRAN_CENTER: [number, number] = [35.6892, 51.389];

type VehicleFilter = 'all' | 'moving' | 'stopped';

interface MissionMapItem {
  mission: Dispatch;

  vehicle: Vehicle | null;

  vehiclePosition: [number, number] | null;

  origin: [number, number] | null;

  destination: [number, number] | null;
}

/* =========================================================
   Leaflet
========================================================= */

if (typeof window !== 'undefined') {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

/* =========================================================
   Helpers
========================================================= */

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getPosition(
  latitude: unknown,
  longitude: unknown,
): [number, number] | null {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat === 0 ||
    lng === 0
  ) {
    return null;
  }

  return [lat, lng];
}

function getVehiclePosition(vehicle: Vehicle): [number, number] | null {
  return getPosition(
    vehicle.latitude ?? vehicle.lastLatitude,
    vehicle.longitude ?? vehicle.lastLongitude,
  );
}

function isActiveDispatch(dispatch: Dispatch): boolean {
  const status = String(dispatch.status ?? '')
    .trim()
    .replace(/[\s_-]/g, '')
    .toLowerCase();

  // Backend:
  // Assigned = 1
  // Started = 2
  // Completed = 3
  // Cancelled = 4

  return (
    status === '1' ||
    status === '2' ||
    status === 'assigned' ||
    status === 'started' ||
    status === 'inprogress'
  );
}

function getVehicleLabel(vehicle: Vehicle | null, mission: Dispatch): string {
  if (vehicle?.plateNumber) {
    return vehicle.plateNumber;
  }

  return `خودرو ${mission.vehicleId}`;
}

/* =========================================================
   Mission Icon
========================================================= */

function createMissionIcon(
  type: 'origin' | 'destination',
  plateNumber: string,
  missionId: number | string,
) {
  const isOrigin = type === 'origin';

  const color = isOrigin ? '#059669' : '#e11d48';

  const title = isOrigin ? '● مبدأ' : '⚑ مقصد';

  return L.divIcon({
    className: 'sunpath-mission-marker',

    html: `
      <div
        style="
          display:flex;
          flex-direction:column;
          align-items:center;
          transform:translate(-50%,-100%);
          white-space:nowrap;
          pointer-events:auto;
        "
      >
        <div
          style="
            min-width:100px;
            padding:7px 10px;
            border-radius:10px;
            background:${color};
            color:white;
            border:2px solid white;
            box-shadow:0 4px 14px rgba(0,0,0,.30);
            text-align:center;
            direction:rtl;
            font-family:Vazirmatn,Tahoma,sans-serif;
          "
        >
          <div
            style="
              font-size:11px;
              font-weight:800;
            "
          >
            ${title}
          </div>

          <div
            style="
              margin-top:3px;
              font-size:9px;
              font-weight:700;
            "
          >
            ${escapeHtml(plateNumber)}
          </div>

          <div
            style="
              margin-top:1px;
              font-size:8px;
              opacity:.85;
            "
          >
            مأموریت #${escapeHtml(missionId)}
          </div>
        </div>

        <div
          style="
            width:0;
            height:0;
            border-left:7px solid transparent;
            border-right:7px solid transparent;
            border-top:9px solid ${color};
          "
        ></div>

        <div
          style="
            width:11px;
            height:11px;
            margin-top:-1px;
            border-radius:50%;
            background:${color};
            border:2px solid white;
            box-shadow:0 2px 5px rgba(0,0,0,.3);
          "
        ></div>
      </div>
    `,

    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/* =========================================================
   Map helpers
========================================================= */

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [map]);

  return null;
}

function MapViewController({
  position,
}: {
  position: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!position) {
      return;
    }

    map.setView(position, 15, {
      animate: true,
    });
  }, [map, position?.[0], position?.[1]]);

  return null;
}

/* =========================================================
   Main
========================================================= */

export default function LiveMap() {
  /* =======================================================
     Vehicles
  ======================================================= */

  const vehicles = useVehicleStore((state) => state.vehicles);

  const loadVehicles = useVehicleStore((state) => state.loadVehicles);

  const selectedVehicleId = useVehicleStore((state) => state.selectedVehicleId);

  const setSelectedVehicleId = useVehicleStore(
    (state) => state.setSelectedVehicleId,
  );

  /* =======================================================
     Dispatches

     مهم:
     همان Store صفحه تخصیص مأموریت
  ======================================================= */

  const dispatches = useDispatchStore((state) => state.dispatches);

  const fetchDispatches = useDispatchStore((state) => state.fetchDispatches);

  /* =======================================================
     UI
  ======================================================= */

  const [filter, setFilter] = useState<VehicleFilter>('all');

  /* =======================================================
     Initial Load
  ======================================================= */

  useEffect(() => {
    void Promise.allSettled([loadVehicles(), fetchDispatches()]);

    void signalRService.startConnection().catch((error) => {
      console.error('[LiveMap] SignalR:', error);
    });
  }, [loadVehicles, fetchDispatches]);

  /* =======================================================
     Dispatch + Vehicle JOIN
  ======================================================= */

  const missionItems = useMemo<MissionMapItem[]>(() => {
    const activeDispatches = dispatches.filter(isActiveDispatch);

    return activeDispatches.map((mission) => {
      const vehicle =
        vehicles.find(
          (item) => String(item.id) === String(mission.vehicleId),
        ) ?? null;

      const vehiclePosition = vehicle ? getVehiclePosition(vehicle) : null;

      const origin = getPosition(
        mission.originLatitude,
        mission.originLongitude,
      );

      const destination = getPosition(
        mission.destinationLatitude,
        mission.destinationLongitude,
      );

      return {
        mission,
        vehicle,
        vehiclePosition,
        origin,
        destination,
      };
    });
  }, [dispatches, vehicles]);

  /* =======================================================
     Filter

     توجه:
     Filter فقط Vehicle Marker را فیلتر می‌کند.
     Mission از نقشه حذف نمی‌شود.
  ======================================================= */

  const visibleVehicleItems = useMemo(() => {
    return missionItems.filter((item) => {
      if (!item.vehicle || !item.vehiclePosition) {
        return false;
      }

      const speed = Number(item.vehicle.speed ?? 0);

      if (filter === 'moving') {
        return speed > 0;
      }

      if (filter === 'stopped') {
        return speed <= 0;
      }

      return true;
    });
  }, [missionItems, filter]);

  /* =======================================================
     Selected Vehicle
  ======================================================= */

  const selectedItem = useMemo(() => {
    if (selectedVehicleId == null) {
      return null;
    }

    return (
      missionItems.find(
        (item) =>
          item.vehicle && String(item.vehicle.id) === String(selectedVehicleId),
      ) ?? null
    );
  }, [missionItems, selectedVehicleId]);

  const selectedPosition =
    selectedItem?.vehiclePosition ??
    selectedItem?.origin ??
    selectedItem?.destination ??
    null;

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
      <MapContainer
        center={TEHRAN_CENTER}
        zoom={12}
        className="z-0 h-full w-full"
        style={{
          height: '100%',
          width: '100%',
        }}
      >
        <MapResizeHandler />

        <MapViewController position={selectedPosition} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* =================================================
            تمام مأموریت‌های فعال
        ================================================= */}

        {missionItems.map((item) => {
          const { mission, vehicle, origin, destination } = item;

          const plate = getVehicleLabel(vehicle, mission);

          return (
            <Fragment key={`mission-${mission.id}`}>
              {/* Route */}

              {origin && destination && (
                <Polyline
                  positions={[origin, destination]}
                  pathOptions={{
                    weight: 4,
                    opacity: 0.7,
                    dashArray: '10 8',
                  }}
                />
              )}

              {/* Origin */}

              {origin && (
                <Marker
                  position={origin}
                  icon={createMissionIcon('origin', plate, mission.id)}
                  zIndexOffset={800}
                >
                  <Popup>
                    <div dir="rtl" className="min-w-[180px] text-right text-xs">
                      <strong className="mb-1 block text-emerald-600">
                        مبدأ مأموریت
                      </strong>

                      <div>{mission.originTitle || 'مبدأ مأموریت'}</div>

                      <div className="mt-2 text-neutral-500">{plate}</div>

                      <div className="text-neutral-400">
                        مأموریت #{mission.id}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Destination */}

              {destination && (
                <Marker
                  position={destination}
                  icon={createMissionIcon('destination', plate, mission.id)}
                  zIndexOffset={800}
                >
                  <Popup>
                    <div dir="rtl" className="min-w-[180px] text-right text-xs">
                      <strong className="mb-1 block text-rose-600">
                        مقصد مأموریت
                      </strong>

                      <div>{mission.destinationTitle || 'مقصد مأموریت'}</div>

                      <div className="mt-2 text-neutral-500">{plate}</div>

                      <div className="text-neutral-400">
                        مأموریت #{mission.id}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </Fragment>
          );
        })}

        {/* =================================================
            Vehicle Markers
        ================================================= */}

        {visibleVehicleItems.map((item) => {
          if (!item.vehicle) {
            return null;
          }

          return (
            <VehicleMarker
              key={`vehicle-${item.vehicle.id}`}
              vehicle={item.vehicle}
            />
          );
        })}
      </MapContainer>

      {/* =================================================
          تعداد واقعی مأموریت‌های فعال
      ================================================= */}

      <div className="absolute bottom-4 right-4 z-[1000] rounded-xl border border-neutral-200 bg-white/95 px-3 py-2 text-xs shadow">
        مأموریت فعال: <strong>{missionItems.length}</strong>
      </div>

      {/* =================================================
          Filter
      ================================================= */}

      <div className="absolute right-4 top-4 z-[1000] flex gap-1 rounded-xl border border-neutral-200 bg-white/95 p-1 shadow">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-xs ${
            filter === 'all' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
          }`}
        >
          همه
        </button>

        <button
          type="button"
          onClick={() => setFilter('moving')}
          className={`rounded-lg px-3 py-1.5 text-xs ${
            filter === 'moving'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600'
          }`}
        >
          متحرک
        </button>

        <button
          type="button"
          onClick={() => setFilter('stopped')}
          className={`rounded-lg px-3 py-1.5 text-xs ${
            filter === 'stopped'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600'
          }`}
        >
          متوقف
        </button>
      </div>

      {/* =================================================
          Selected
      ================================================= */}

      {selectedItem?.vehicle && (
        <div className="absolute bottom-4 left-4 z-[1000] w-80 rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-2">
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-orange-500" />

              <strong className="text-sm">
                {selectedItem.vehicle.plateNumber ||
                  `خودرو ${selectedItem.vehicle.id}`}
              </strong>
            </div>

            <button type="button" onClick={() => setSelectedVehicleId(null)}>
              <X size={16} />
            </button>
          </div>

          <div className="mb-3 rounded-lg bg-blue-50 p-2 text-center text-xs font-bold text-blue-700">
            مأموریت #{selectedItem.mission.id}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-neutral-100 p-2 text-xs">
              <Gauge size={14} className="text-orange-500" />
              {Number(selectedItem.vehicle.speed ?? 0)} km/h
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-neutral-100 p-2 text-xs">
              <Compass size={14} className="text-orange-500" />
              {Math.round(Number(selectedItem.vehicle.heading ?? 0))}°
            </div>
          </div>

          <div className="mb-2 rounded-lg bg-emerald-50 p-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <MapPin size={14} />
              مبدأ
            </div>

            <div className="mt-1 text-xs text-neutral-700">
              {selectedItem.mission.originTitle || 'مبدأ مأموریت'}
            </div>
          </div>

          <div className="rounded-lg bg-rose-50 p-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
              <MapPin size={14} />
              مقصد
            </div>

            <div className="mt-1 text-xs text-neutral-700">
              {selectedItem.mission.destinationTitle || 'مقصد مأموریت'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
