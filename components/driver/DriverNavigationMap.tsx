'use client';

import { Fragment, useEffect } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';

import type { RouteCoord } from '@/hooks/useDriverNavigation';

export interface DriverNavigationMapPoint {
  lat: number;
  lng: number;
  name: string;
}

export interface DriverNavigationMapProps {
  currentLocation: RouteCoord | null;

  origin: DriverNavigationMapPoint;

  destination: DriverNavigationMapPoint;

  routeCoordinates: RouteCoord[];

  heading: number;

  showTrafficLayer?: boolean;
}

const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
};

const createVehicleIcon = (heading: number): L.DivIcon => {
  const safeHeading = Number.isFinite(heading)
    ? ((heading % 360) + 360) % 360
    : 0;

  return L.divIcon({
    className: 'sunpath-driver-marker',

    html: `
      <div
        style="
          width:42px;
          height:42px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:50%;
          background:#ea580c;
          border:4px solid #ffffff;
          box-shadow:0 4px 14px rgba(0,0,0,.25);
        "
      >
        <div
          style="
            width:0;
            height:0;
            border-left:8px solid transparent;
            border-right:8px solid transparent;
            border-bottom:18px solid #ffffff;
            transform:rotate(${safeHeading}deg);
            transform-origin:center center;
          "
        ></div>
      </div>
    `,

    iconSize: [42, 42],

    iconAnchor: [21, 21],

    popupAnchor: [0, -24],
  });
};

function MapViewportController({
  currentLocation,
  origin,
  destination,
  routeCoordinates,
}: {
  currentLocation: RouteCoord | null;

  origin: DriverNavigationMapPoint;

  destination: DriverNavigationMapPoint;

  routeCoordinates: RouteCoord[];
}) {
  const map = useMap();

  /*
   * وقتی GPS واقعی تغییر می‌کند،
   * نقشه به‌آرامی راننده را دنبال می‌کند.
   */
  useEffect(() => {
    if (
      !currentLocation ||
      !isValidCoordinate(currentLocation.lat, currentLocation.lng)
    ) {
      return;
    }

    map.panTo([currentLocation.lat, currentLocation.lng], {
      animate: true,
      duration: 0.5,
    });
  }, [map, currentLocation?.lat, currentLocation?.lng]);

  /*
   * در شروع، کل مسیر را داخل viewport قرار می‌دهیم.
   */
  useEffect(() => {
    const points: L.LatLngExpression[] = [];

    if (isValidCoordinate(origin.lat, origin.lng)) {
      points.push([origin.lat, origin.lng]);
    }

    if (Array.isArray(routeCoordinates)) {
      for (const point of routeCoordinates) {
        if (isValidCoordinate(point.lat, point.lng)) {
          points.push([point.lat, point.lng]);
        }
      }
    }

    if (isValidCoordinate(destination.lat, destination.lng)) {
      points.push([destination.lat, destination.lng]);
    }

    if (points.length < 2) {
      return;
    }

    const bounds = L.latLngBounds(points);

    map.fitBounds(bounds, {
      padding: [40, 40],

      maxZoom: 16,

      animate: false,
    });
  }, [
    map,
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng,
    routeCoordinates,
  ]);

  return null;
}

export function DriverNavigationMap({
  currentLocation,
  origin,
  destination,
  routeCoordinates,
  heading,
  showTrafficLayer = false,
}: DriverNavigationMapProps) {
  const center: [number, number] =
    currentLocation &&
    isValidCoordinate(currentLocation.lat, currentLocation.lng)
      ? [currentLocation.lat, currentLocation.lng]
      : [origin.lat, origin.lng];

  const validRoute = Array.isArray(routeCoordinates)
    ? routeCoordinates.filter((point) =>
        isValidCoordinate(point.lat, point.lng),
      )
    : [];

  const vehicleIcon = createVehicleIcon(heading);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom
        zoomControl
        attributionControl
        className="h-full w-full"
        style={{
          height: '100%',
          width: '100%',
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewportController
          currentLocation={currentLocation}
          origin={origin}
          destination={destination}
          routeCoordinates={validRoute}
        />

        <Fragment>
          {validRoute.length > 1 && (
            <Polyline
              positions={validRoute.map((point) => [point.lat, point.lng])}
              pathOptions={{
                color: '#2563eb',
                weight: 5,
                opacity: 0.85,
              }}
            />
          )}

          <CircleMarker
            center={[origin.lat, origin.lng]}
            radius={9}
            pathOptions={{
              color: '#059669',
              fillColor: '#10b981',
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <div dir="rtl" className="min-w-32 text-right">
                <strong>مبدأ مأموریت</strong>

                <div className="mt-1">{origin.name}</div>
              </div>
            </Popup>
          </CircleMarker>

          <CircleMarker
            center={[destination.lat, destination.lng]}
            radius={9}
            pathOptions={{
              color: '#dc2626',
              fillColor: '#ef4444',
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <div dir="rtl" className="min-w-32 text-right">
                <strong>مقصد مأموریت</strong>

                <div className="mt-1">{destination.name}</div>
              </div>
            </Popup>
          </CircleMarker>

          {currentLocation &&
            isValidCoordinate(currentLocation.lat, currentLocation.lng) && (
              <Marker
                position={[currentLocation.lat, currentLocation.lng]}
                icon={vehicleIcon}
              >
                <Popup>
                  <div dir="rtl" className="text-right">
                    <strong>موقعیت خودرو</strong>

                    <div className="mt-1 text-xs">
                      جهت حرکت: {Math.round(heading).toLocaleString('fa-IR')}°
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
        </Fragment>
      </MapContainer>

      {showTrafficLayer && (
        <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-[10px] font-bold text-neutral-600 shadow-sm backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-300">
          مسیر زنده
        </div>
      )}
    </div>
  );
}

export default DriverNavigationMap;
