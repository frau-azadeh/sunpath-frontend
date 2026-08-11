'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Navigation } from 'lucide-react';

interface Vehicle {
  id: number | string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  plateNumber?: string;
}

const createVehicleIcon = (heading: number, speed: number) => {
  const color = speed > 0 ? '#22c55e' : '#64748b';

  const html = renderToStaticMarkup(
    <div style={{ 
      transform: `rotate(${heading}deg)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
    }}>
      <Navigation size={32} fill={color} />
    </div>
  );

  return L.divIcon({
    html,
    className: 'custom-vehicle-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
 popupAnchor: [0, -16],
  });
};

interface VehicleMarkerProps {
  vehicle: Vehicle;
}

export default function VehicleMarker({ vehicle }: VehicleMarkerProps) {
  return (
    <Marker 
      position={[vehicle.latitude, vehicle.longitude]} 
      icon={createVehicleIcon(vehicle.heading, vehicle.speed)}
    >
      <Popup>
        <div className="p-2 font-vazir">
          <h3 className="font-bold border-b pb-1 mb-1">{vehicle.plateNumber ?? vehicle.id}</h3>
          <p className="text-sm">سرعت: <span className="text-blue-600">{vehicle.speed} km/h</span></p>
          <p className="text-sm">وضعیت: {vehicle.speed > 0 ? 'در حال حرکت' : 'متوقف'}</p>
        </div>
      </Popup>
    </Marker>
  );
}
