'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';

import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';

import { useVehicleStore } from '@/store/useVehicleStore';
import { Vehicle } from '@/types/fleet';

interface VehicleMarkerProps {
  vehicle: Vehicle;
}

function getLatLng(vehicle: Vehicle): [number, number] | null {
  const lat = Number(vehicle.latitude);
  const lng = Number(vehicle.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
    return null;
  }

  return [lat, lng];
}

export default function VehicleMarker({ vehicle }: VehicleMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  const setSelectedVehicleId = useVehicleStore(
    (state) => state.setSelectedVehicleId,
  );
  const selectedVehicleId = useVehicleStore((state) => state.selectedVehicleId);

  const isSelected = selectedVehicleId === vehicle.id;
  const speed = Number(vehicle.speed ?? 0);
  const heading = Number(vehicle.heading ?? 0);
  const isMoving = speed > 0;
  const position = getLatLng(vehicle);

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'bg-transparent',
        html: `
          <div class="group relative flex cursor-pointer items-center justify-center">
            <div class="pointer-events-none absolute -top-7 whitespace-nowrap rounded-md border border-neutral-700]-neutral-900/80 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm backdrop-blur transition-transform group-hover:scale-110">
              ${vehicle.plateNumber || `خودرو ${vehicle.id}`}
            </div>

            <div
              class="relative flex items-center justify-center transition-transform duration-500 ease-out"
              style="transform: rotate(${heading}deg)"
            >
              ${
                isMoving
                  ? '<span class="absolute inline-flex h-9 w-9 animate-ping rounded-full bg-emerald-500/35"></span>'
                  : ''
              }

              <div class="relative flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-xl transition-all ${
                isSelected
                  ? 'z-[1002] scale-125 border-white bg-orange-500 text-white ring-4 ring-orange-500/30'
                  : isMoving
                    ? 'border-white bg-emerald-500 text-white hover:scale-110'
                    : 'border-white bg-neutral-600 text-white hover:scale-105'
              }">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="transform -rotate-45">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </div>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      }),
    [heading, isMoving, isSelected, vehicle.id, vehicle.plateNumber],
  );

  useLayoutEffect(() => {
    if (!markerRef.current || !position) return;

    markerRef.current.setLatLng(position);
    markerRef.current.setIcon(icon);
  }, [position, icon]);

  if (!position) return null;

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => {
          setSelectedVehicleId(isSelected ? null : vehicle.id);
        },
      }}
    >
      <Popup closeButton={false}>
        <div className="min-w-[140px] p-1 text-right">
          <p className="mb-1 text-xs font-bold text-neutral-800 dark:text-neutral-100">
            {vehicle.plateNumber || `شناسه: ${vehicle.id}`}
          </p>

          <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-300">
            <span>وضعیت:</span>
            <span
              className={
                isMoving ? 'font-bold text-emerald-600' : 'text-neutral-500'
              }
            >
              {isMoving ? `در حال حرکت (${speed} km/h)` : 'متوقف'}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-neutral-600 dark:text-neutral-300">
            <span>مصرف سوخت:</span>
            <span className="font-bold text-emerald-600">{Number(vehicle.fuelConsumedLiters ?? 0).toFixed(2)} لیتر</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
