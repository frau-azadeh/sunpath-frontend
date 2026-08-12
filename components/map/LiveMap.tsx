'use client';

import { useEffect, useState, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { signalRService } from '@/services/signalrService';
import { useVehicleStore } from '@/store/useVehicleStore';
import VehicleMarker from './VehicleMarker';
import { Compass, Gauge, Clock, Navigation, X, Play, Square } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

// فیکس کردن آیکون‌های پیش‌فرض
if (typeof window !== 'undefined') {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const TEHRAN_CENTER: [number, number] = [35.6892, 51.389];

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function MapViewController({ selectedLat, selectedLng }: { selectedLat: number | null; selectedLng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLat !== null && selectedLng !== null) {
      map.setView([selectedLat, selectedLng], 15, { animate: true });
    }
  }, [selectedLat, selectedLng, map]);
  return null;
}

export default function LiveMap() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const selectedVehicleId = useVehicleStore((state) => state.selectedVehicleId);
  const setSelectedVehicleId = useVehicleStore((state) => state.setSelectedVehicleId);
  const loadVehicles = useVehicleStore((state) => state.loadVehicles);
  const updateVehiclePosition = useVehicleStore((state) => state.updateVehiclePosition);
  
  const [filter, setFilter] = useState<'all' | 'moving' | 'stopped'>('all');
  const [isLocalSimulating, setIsLocalSimulating] = useState(false);

  useEffect(() => {
    void loadVehicles();
    // اتصال SignalR توسط لایه بالاتر مدیریت می‌شود، اما اینجا هم برای اطمینان چک می‌کنیم
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
        updateVehiclePosition(vehicle.id, newLat, newLng, Math.floor(Math.random() * 60) + 20, (Number(vehicle.heading) + 10) % 360);
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
    <div className="relative flex h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
      <div className="relative h-full w-full">
        <MapContainer 
          center={TEHRAN_CENTER} 
          zoom={12} 
          className="h-full w-full z-0"
          style={{ height: '100%', width: '100%' }}
        >
          <MapResizeHandler />
          <MapViewController 
            selectedLat={selectedVehicle ? Number(selectedVehicle.latitude) : null} 
            selectedLng={selectedVehicle ? Number(selectedVehicle.longitude) : null} 
          />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {validVehicles.map((v) => (
            <VehicleMarker key={v.id} vehicle={v} />
          ))}
        </MapContainer>

        {/* Controls Overlay */}
        <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2 rounded-xl bg-white/90 p-3 shadow-sm backdrop-blur dark:bg-slate-900/90">
          <div className="flex gap-1">
            {['all', 'moving', 'stopped'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                  filter === f ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {f === 'all' ? 'همه' : f === 'moving' ? 'متحرک' : 'متوقف'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsLocalSimulating(!isLocalSimulating)}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-bold text-white transition-all ${
              isLocalSimulating ? 'bg-rose-500 animate-pulse' : 'bg-indigo-600'
            }`}
          >
            {isLocalSimulating ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            {isLocalSimulating ? 'توقف تست' : 'شبیه‌ساز تست'}
          </button>
        </div>
      </div>

      {/* Selected Vehicle Panel */}
      {selectedVehicle && (
        <div className="absolute bottom-4 left-4 z-[1000] w-72 rounded-2xl bg-white/95 p-4 shadow-xl border border-slate-200 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b pb-2 mb-2 dark:border-slate-800">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Navigation className="h-3 w-3 text-orange-500" />
              خودرو {selectedVehicle.id}
            </h3>
            <button onClick={() => setSelectedVehicleId(null)}><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
             <div className="flex items-center gap-1"><Gauge size={12}/> {selectedVehicle.speed} km/h</div>
             <div className="flex items-center gap-1"><Compass size={12}/> {selectedVehicle.heading}°</div>
          </div>
        </div>
      )}
    </div>
  );
}
