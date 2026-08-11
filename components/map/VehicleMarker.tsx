'use client';

import { useMemo } from 'react';

import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';

import { Vehicle } from '@/types/fleet';

interface VehicleMarkerProps {
  vehicle: Vehicle;
}

export default function VehicleMarker({ vehicle }: VehicleMarkerProps) {
  const latitude = Number(vehicle.latitude);
  const longitude = Number(vehicle.longitude);
  const heading = Number(vehicle.heading ?? 0);

  const vehicleIcon = useMemo(() => {
    const safeHeading = Number.isFinite(heading) ? heading : 0;

    return L.divIcon({
      className: 'vehicle-marker-container',
      html: `
        <div
          style="
            width: 46px;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(${safeHeading}deg);
            transform-origin: center;
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));
          "
        >
          <div
            style="
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 9999px;
              border: 3px solid white;
              background: #2563eb;
              color: white;
              font-size: 21px;
              line-height: 1;
            "
          >
            🚚
          </div>
        </div>
      `,
      iconSize: [46, 46],
      iconAnchor: [23, 23],
      popupAnchor: [0, -23],
    });
  }, [heading]);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude === 0 ||
    longitude === 0
  ) {
    return null;
  }

  return (
    <Marker position={[latitude, longitude]} icon={vehicleIcon}>
      <Popup>
        <div dir="rtl" className="min-w-[150px] text-sm">
          <div className="mb-2 font-bold">
            {vehicle.plateNumber || `خودرو ${vehicle.id}`}
          </div>

          <div>سرعت: {Number(vehicle.speed ?? 0)} کیلومتر بر ساعت</div>

          <div>جهت حرکت: {Number(vehicle.heading ?? 0)}°</div>

          <div className="mt-1 text-xs text-slate-500">
            موقعیت:
            <br />
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
