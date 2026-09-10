'use client';

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Coords {
  lat: number;
  lng: number;
  name: string;
}

interface AdminMapPickerProps {
  origin: Coords;
  destination: Coords | null;
  onSelectOrigin: (coords: Coords) => void;
  onSelectDestination: (coords: Coords) => void;
  activeDrivers?: Array<{ id: number; name: string; lat: number; lng: number; speed: number }>;
}

// کامپوننت دریافت رویداد کلیک برای انتخاب مبدأ و مقصد
function ClickHandler({
  selectionMode,
  onSelect,
}: {
  selectionMode: 'origin' | 'destination';
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function AdminMissionMapPicker({
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  activeDrivers = [],
}: AdminMapPickerProps) {
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination'>('destination');
  const [showTraffic, setShowTraffic] = useState(true);

  // آیکون مبدأ (سبز)
  const originIcon = L.divIcon({
    className: 'admin-origin-marker',
    html: `
      <div class="w-8 h-8 bg-emerald-500 text-slate-950 border-2 border-white rounded-full flex items-center justify-center font-bold text-xs shadow-lg">
        A
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  // آیکون مقصد (قرمز)
  const destinationIcon = L.divIcon({
    className: 'admin-dest-marker',
    html: `
      <div class="w-8 h-8 bg-rose-600 text-white border-2 border-white rounded-full flex items-center justify-center font-bold text-xs shadow-lg animate-bounce">
        B
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  // آیکون رانندگان زنده
  const driverIcon = L.divIcon({
    className: 'admin-driver-marker',
    html: `
      <div class="w-7 h-7 bg-amber-400 text-slate-950 border border-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
        🚖
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const handleMapClick = (lat: number, lng: number) => {
    if (selectionMode === 'origin') {
      onSelectOrigin({ lat, lng, name: `مختصات: ${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      setSelectionMode('destination');
    } else {
      onSelectDestination({ lat, lng, name: `مختصات مقصد: ${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      
      {/* دکمه‌های کنترل و انتخاب مود روی نقشه */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-wrap gap-2 bg-slate-900/90 backdrop-blur border border-slate-700/80 p-1.5 rounded-xl shadow-lg">
        <button
          type="button"
          onClick={() => setSelectionMode('origin')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            selectionMode === 'origin'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          انتخاب مبدأ (A)
        </button>

        <button
          type="button"
          onClick={() => setSelectionMode('destination')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            selectionMode === 'destination'
              ? 'bg-rose-500 text-white font-bold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          انتخاب مقصد (B)
        </button>

        <button
          type="button"
          onClick={() => setShowTraffic(!showTraffic)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
            showTraffic
              ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
              : 'border-slate-700 bg-slate-800 text-slate-400'
          }`}
        >
          ترافیک: {showTraffic ? 'روشن' : 'خاموش'}
        </button>
      </div>

      <MapContainer
        center={[origin.lat, origin.lng]}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {showTraffic && (
          <TileLayer
            opacity={0.65}
            url="https://{s}.google.com/vt/lyrs=m,traffic&hl=fa&x={x}&y={y}&z={z}&s=Ga"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          />
        )}

        <ClickHandler selectionMode={selectionMode} onSelect={handleMapClick} />

        {/* مارکر مبدأ */}
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>
            <div className="text-xs text-slate-800 font-sans p-1 text-right">
              <strong>مبدأ:</strong> {origin.name}
            </div>
          </Popup>
        </Marker>

        {/* مارکر مقصد در صورت انتخاب */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-xs text-slate-800 font-sans p-1 text-right">
                <strong>مقصد انتخابی:</strong> {destination.name}
              </div>
            </Popup>
          </Marker>
        )}

        {/* خط اتصال بین مبدأ و مقصد */}
        {destination && (
          <Polyline
            positions={[
              [origin.lat, origin.lng],
              [destination.lat, destination.lng],
            ]}
            pathOptions={{ color: '#f59e0b', weight: 4, dashArray: '6, 8', opacity: 0.8 }}
          />
        )}

        {/* نمایش خودروهای فعال ناوگان */}
        {activeDrivers.map((d) => (
          <Marker key={d.id} position={[d.lat, d.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-xs text-slate-800 font-sans p-1 text-right">
                <p className="font-bold">{d.name}</p>
                <p className="text-[11px] text-slate-600">سرعت: {d.speed} km/h</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
