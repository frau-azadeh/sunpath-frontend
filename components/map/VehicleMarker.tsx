'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';

import L from 'leaflet';
import { Marker } from 'react-leaflet';

import { useVehicleStore } from '@/store/useVehicleStore';
import { Vehicle } from '@/types/fleet';

interface VehicleMarkerProps {
  vehicle: Vehicle;
}

export default function VehicleMarker({ vehicle }: VehicleMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  const setSelectedVehicleId = useVehicleStore(
    (state) => state.setSelectedVehicleId,
  );
  const selectedVehicleId = useVehicleStore((state) => state.selectedVehicleId);

  const isSelected = selectedVehicleId === vehicle.id;
  const isMoving = Number(vehicle.speed) > 0;

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'bg-transparent',
        html: `
          <div class="relative flex items-center justify-center transition-all duration-700" style="transform: rotate(${vehicle.heading}deg)">
            ${
              isMoving
                ? `<span class="absolute inline-flex h-9 w-9 animate-ping rounded-full bg-emerald-500/30"></span>`
                : ''
            }
            <div class="relative flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-lg transition-all ${
              isSelected
                ? 'z-[1002] scale-125 border-white bg-orange-500 text-white'
                : isMoving
                  ? 'border-white bg-emerald-500 text-white'
                  : 'border-white bg-slate-500 text-white'
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="transform -rotate-45">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    [vehicle.heading, isMoving, isSelected],
  );

  useLayoutEffect(() => {
    if (markerRef.current) {
      const lat = Number(vehicle.latitude);
      const lng = Number(vehicle.longitude);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setIcon(icon);
      }
    }
  }, [vehicle.latitude, vehicle.longitude, icon]);

  return (
    <Marker
      ref={markerRef}
      position={[Number(vehicle.latitude), Number(vehicle.longitude)]}
      icon={icon}
      eventHandlers={{
        click: () => {
          setSelectedVehicleId(isSelected ? null : vehicle.id);
        },
      }}
    />
  );
}
