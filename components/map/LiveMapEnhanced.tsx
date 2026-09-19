'use client';

import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from 'react';

import L from 'leaflet';
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

import { signalRService } from '@/services/signalrService';
import { useDispatchStore } from '@/store/dispatch-store';
import { useVehicleStore } from '@/store/useVehicleStore';

import type { Dispatch } from '@/types/dispatch';
import type { Vehicle } from '@/types/fleet';

import VehicleMarker from './VehicleMarker';

/* =========================================================
   Types
========================================================= */

type MapMode = 'road' | 'satellite' | 'dark';

type VehicleFilter = 'all' | 'moving' | 'stopped';

interface MissionItem {
  mission: Dispatch;

  vehicle: Vehicle | null;

  currentPosition: [number, number] | null;

  origin: [number, number] | null;

  destination: [number, number] | null;
}

/* =========================================================
   Constants
========================================================= */

const TEHRAN_CENTER: [number, number] = [
  35.6892,
  51.389,
];

const MAP_LAYERS = {
  road: {
    name: 'جاده‌ای',

    url:
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

    attribution:
      '&copy; OpenStreetMap contributors',
  },

  satellite: {
    name: 'ماهواره‌ای',

    url:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',

    attribution:
      '&copy; Esri',
  },

  dark: {
    name: 'تیره',

    url:
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',

    attribution:
      '&copy; CARTO &copy; OpenStreetMap contributors',
  },
} satisfies Record<
  MapMode,
  {
    name: string;
    url: string;
    attribution: string;
  }
>;

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
  latValue: unknown,
  lngValue: unknown,
): [number, number] | null {
  const lat = Number(latValue);
  const lng = Number(lngValue);

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

function getVehiclePosition(
  vehicle: Vehicle,
): [number, number] | null {
  return getPosition(
    vehicle.latitude ?? vehicle.lastLatitude,
    vehicle.longitude ?? vehicle.lastLongitude,
  );
}

function isActiveDispatch(
  mission: Dispatch,
): boolean {
  const status = String(mission.status ?? '')
    .trim()
    .replace(/[\s_-]/g, '')
    .toLowerCase();

  return (
    status === '1' ||
    status === '2' ||
    status === 'assigned' ||
    status === 'started' ||
    status === 'inprogress'
  );
}

function getVehicleLabel(
  vehicle: Vehicle | null,
  mission: Dispatch,
): string {
  return (
    vehicle?.plateNumber ||
    `خودرو ${mission.vehicleId}`
  );
}

/* =========================================================
   Icons
========================================================= */

function createMissionIcon(
  type: 'origin' | 'destination',
  plateNumber: string,
  missionId: number | string,
) {
  const isOrigin =
    type === 'origin';

  const background =
    isOrigin
      ? '#059669'
      : '#e11d48';

  const title =
    isOrigin
      ? '● مبدأ'
      : '⚑ مقصد';

  return L.divIcon({
    className:
      `mission-${type}-marker`,

    html: `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        transform:translate(-50%,-100%);
        white-space:nowrap;
      ">

        <div style="
          min-width:100px;
          padding:7px 10px;
          background:${background};
          color:white;
          border:2px solid white;
          border-radius:10px;
          box-shadow:0 4px 14px rgba(0,0,0,.30);
          text-align:center;
          direction:rtl;
          font-family:Vazirmatn,Tahoma,sans-serif;
        ">

          <div style="
            font-size:11px;
            font-weight:800;
          ">
            ${title}
          </div>

          <div style="
            margin-top:3px;
            font-size:9px;
            font-weight:700;
          ">
            ${escapeHtml(plateNumber)}
          </div>

          <div style="
            font-size:8px;
            opacity:.85;
          ">
            مأموریت #${escapeHtml(missionId)}
          </div>

        </div>

        <div style="
          width:0;
          height:0;
          border-left:7px solid transparent;
          border-right:7px solid transparent;
          border-top:9px solid ${background};
        "></div>

        <div style="
          width:11px;
          height:11px;
          margin-top:-1px;
          border-radius:50%;
          background:${background};
          border:2px solid white;
        "></div>

      </div>
    `,

    iconSize: [0, 0],

    iconAnchor: [0, 0],
  });
}

/* =========================================================
   Map Helpers
========================================================= */

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
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
  position:
    [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!position) {
      return;
    }

    map.setView(
      position,
      15,
      {
        animate: true,
      },
    );
  }, [
    map,
    position?.[0],
    position?.[1],
  ]);

  return null;
}

/* =========================================================
   Mission Visualization
========================================================= */

function MissionVisualization({
  item,
}: {
  item: MissionItem;
}) {
  const {
    mission,
    vehicle,
    origin,
    destination,
  } = item;

  const plate =
    getVehicleLabel(
      vehicle,
      mission,
    );

  return (
    <Fragment>
      {/* Route */}

      {origin &&
        destination && (
          <Polyline
            positions={[
              origin,
              destination,
            ]}
            pathOptions={{
              weight: 5,
              opacity: 0.75,
              dashArray: '10 8',
            }}
          />
        )}

      {/* Origin */}

      {origin && (
        <Marker
          position={origin}
          icon={createMissionIcon(
            'origin',
            plate,
            mission.id,
          )}
          zIndexOffset={800}
        >
          <Popup>
            <div
              dir="rtl"
              className="min-w-[180px] text-right text-xs"
            >
              <strong className="block text-emerald-600">
                مبدأ مأموریت
              </strong>

              <div className="mt-1">
                {mission.originTitle ||
                  'مبدأ مأموریت'}
              </div>

              <div className="mt-2 text-neutral-500">
                خودرو: {plate}
              </div>

              <div className="text-neutral-400">
                مأموریت #{mission.id}
              </div>

              {!vehicle && (
                <div className="mt-2 text-amber-600">
                  اطلاعات خودرو هنوز بارگذاری نشده است.
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Destination */}

      {destination && (
        <Marker
          position={destination}
          icon={createMissionIcon(
            'destination',
            plate,
            mission.id,
          )}
          zIndexOffset={800}
        >
          <Popup>
            <div
              dir="rtl"
              className="min-w-[180px] text-right text-xs"
            >
              <strong className="block text-rose-600">
                مقصد مأموریت
              </strong>

              <div className="mt-1">
                {mission.destinationTitle ||
                  'مقصد مأموریت'}
              </div>

              <div className="mt-2 text-neutral-500">
                خودرو: {plate}
              </div>

              <div className="text-neutral-400">
                مأموریت #{mission.id}
              </div>
            </div>
          </Popup>
        </Marker>
      )}
    </Fragment>
  );
}

/* =========================================================
   Main
========================================================= */

export default function LiveMapEnhanced() {
  /* =======================================================
     Vehicle Store
  ======================================================= */

  const vehicles =
    useVehicleStore(
      (state) =>
        state.vehicles,
    );

  const loadVehicles =
    useVehicleStore(
      (state) =>
        state.loadVehicles,
    );

  const selectedVehicleId =
    useVehicleStore(
      (state) =>
        state.selectedVehicleId,
    );

  const setSelectedVehicleId =
    useVehicleStore(
      (state) =>
        state.setSelectedVehicleId,
    );

  /* =======================================================
     Dispatch Store

     این دقیقاً همان Store صفحه تخصیص است.
  ======================================================= */

  const dispatches =
    useDispatchStore(
      (state) =>
        state.dispatches,
    );

  const fetchDispatches =
    useDispatchStore(
      (state) =>
        state.fetchDispatches,
    );

  /* =======================================================
     UI
  ======================================================= */

  const [
    filter,
    setFilter,
  ] =
    useState<VehicleFilter>(
      'all',
    );

  const [
    mapMode,
    setMapMode,
  ] =
    useState<MapMode>(
      'road',
    );

  const [
    showMissionEndpoints,
    setShowMissionEndpoints,
  ] =
    useState(true);

  /* =======================================================
     Initial Load
  ======================================================= */

  useEffect(() => {
    void Promise.allSettled([
      loadVehicles(),
      fetchDispatches(),
    ]);

    void signalRService
      .startConnection()
      .catch((error) => {
        console.error(
          '[LiveMapEnhanced] SignalR:',
          error,
        );
      });
  }, [
    loadVehicles,
    fetchDispatches,
  ]);

  /* =======================================================
     Join Dispatches + Vehicles
  ======================================================= */

  const missionItems =
    useMemo<MissionItem[]>(
      () => {
        const result:
          MissionItem[] = [];

        for (
          const mission of
          dispatches
        ) {
          /*
           * فقط مأموریت‌های Assigned / Started
           */

          if (
            !isActiveDispatch(
              mission,
            )
          ) {
            continue;
          }

          /*
           * Vehicle ممکن است هنوز لود نشده باشد.
           * این نباید باعث حذف Mission شود.
           */

          const vehicle =
            mission.vehicleId !=
            null
              ? vehicles.find(
                  (item) =>
                    String(
                      item.id,
                    ) ===
                    String(
                      mission.vehicleId,
                    ),
                ) ?? null
              : null;

          const currentPosition =
            vehicle
              ? getVehiclePosition(
                  vehicle,
                )
              : null;

          const origin =
            getPosition(
              mission.originLatitude,
              mission.originLongitude,
            );

          const destination =
            getPosition(
              mission.destinationLatitude,
              mission.destinationLongitude,
            );

          result.push({
            mission,
            vehicle,
            currentPosition,
            origin,
            destination,
          });
        }

        return result;
      },
      [
        dispatches,
        vehicles,
      ],
    );

  /* =======================================================
     Vehicle Filter

     این فیلتر Mission را حذف نمی‌کند.
  ======================================================= */

  const visibleVehicleItems =
    useMemo(
      () => {
        return missionItems.filter(
          (item) => {
            if (
              !item.vehicle ||
              !item.currentPosition
            ) {
              return false;
            }

            const speed =
              Number(
                item.vehicle
                  .speed ?? 0,
              );

            if (
              filter ===
              'moving'
            ) {
              return speed > 0;
            }

            if (
              filter ===
              'stopped'
            ) {
              return speed <= 0;
            }

            return true;
          },
        );
      },
      [
        missionItems,
        filter,
      ],
    );

  /* =======================================================
     Selected
  ======================================================= */

  const selectedItem =
    useMemo(() => {
      if (
        selectedVehicleId ==
        null
      ) {
        return null;
      }

      return (
        missionItems.find(
          (item) =>
            item.vehicle &&
            String(
              item.vehicle.id,
            ) ===
              String(
                selectedVehicleId,
              ),
        ) ?? null
      );
    }, [
      missionItems,
      selectedVehicleId,
    ]);

  const selectedMapPosition =
    selectedItem
      ?.currentPosition ??
    selectedItem
      ?.origin ??
    selectedItem
      ?.destination ??
    null;

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-100">

      <MapContainer
        center={
          TEHRAN_CENTER
        }
        zoom={12}
        className="z-0 h-full w-full"
        style={{
          height: '100%',
          width: '100%',
        }}
      >
        <MapResizeHandler />

        <MapViewController
          position={
            selectedMapPosition
          }
        />

        <TileLayer
          key={mapMode}
          url={
            MAP_LAYERS[
              mapMode
            ].url
          }
          attribution={
            MAP_LAYERS[
              mapMode
            ].attribution
          }
        />

        {/* ================================================
            MISSIONS

            مستقل از GPS خودرو
        ================================================= */}

        {showMissionEndpoints &&
          missionItems.map(
            (item) => (
              <MissionVisualization
                key={`mission-${item.mission.id}`}
                item={item}
              />
            ),
          )}

        {/* ================================================
            VEHICLES

            فقط خودروهایی که GPS دارند
        ================================================= */}

        {visibleVehicleItems.map(
          (item) => {
            if (!item.vehicle) {
              return null;
            }

            return (
              <VehicleMarker
                key={`vehicle-${item.vehicle.id}`}
                vehicle={
                  item.vehicle
                }
              />
            );
          },
        )}

      </MapContainer>

      {/* =================================================
          Active Mission Count
      ================================================= */}

      <div className="absolute bottom-4 right-4 z-[1000] rounded-xl border border-neutral-200 bg-white/95 px-3 py-2 text-xs shadow">
        مأموریت فعال:{' '}
        <strong>
          {missionItems.length}
        </strong>
      </div>

      {/* =================================================
          Controls
      ================================================= */}

      <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">

        {/* Layers */}

        <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white/95 p-1 shadow">

          <Layers
            size={14}
            className="mx-1 text-orange-500"
          />

          {(
            Object.keys(
              MAP_LAYERS,
            ) as MapMode[]
          ).map(
            (mode) => (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  setMapMode(
                    mode,
                  )
                }
                className={`rounded-lg px-2 py-1.5 text-[10px] font-bold ${
                  mapMode ===
                  mode
                    ? 'bg-orange-500 text-white'
                    : 'text-neutral-500'
                }`}
              >
                {
                  MAP_LAYERS[
                    mode
                  ].name
                }
              </button>
            ),
          )}

        </div>

        {/* Endpoints */}

        <div className="rounded-xl border border-neutral-200 bg-white/95 p-1 shadow">

          <button
            type="button"
            onClick={() =>
              setShowMissionEndpoints(
                (value) =>
                  !value,
              )
            }
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-bold ${
              showMissionEndpoints
                ? 'bg-blue-600 text-white'
                : 'text-neutral-500'
            }`}
          >
            <MapPin
              size={12}
            />

            مبدأ و مقصد
          </button>

        </div>

        {/* Vehicle Filters */}

        <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white/95 p-1 shadow">

          <TrafficCone
            size={13}
            className="mx-1 text-orange-500"
          />

          {(
            [
              'all',
              'moving',
              'stopped',
            ] as const
          ).map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setFilter(
                    item,
                  )
                }
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${
                  filter ===
                  item
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500'
                }`}
              >
                {item ===
                'all'
                  ? 'همه'
                  : item ===
                      'moving'
                    ? 'متحرک'
                    : 'متوقف'}
              </button>
            ),
          )}

        </div>

      </div>

      {/* =================================================
          Selected Vehicle
      ================================================= */}

      {selectedItem?.vehicle && (
        <div className="absolute bottom-4 left-4 z-[1000] w-80 rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl">

          <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-2">

            <div className="flex items-center gap-2">

              <Navigation
                size={16}
                className="text-orange-500"
              />

              <strong className="text-sm">
                {selectedItem
                  .vehicle
                  .plateNumber ||
                  `خودرو ${selectedItem.vehicle.id}`}
              </strong>

            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedVehicleId(
                  null,
                )
              }
            >
              <X size={16} />
            </button>

          </div>

          <div className="mb-3 rounded-lg bg-blue-50 p-2 text-center text-xs font-bold text-blue-700">
            مأموریت #
            {
              selectedItem
                .mission.id
            }
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">

            <div className="flex items-center gap-2 rounded-lg bg-neutral-100 p-2 text-xs">

              <Gauge
                size={14}
                className="text-orange-500"
              />

              {Number(
                selectedItem
                  .vehicle
                  .speed ?? 0,
              )}{' '}
              km/h

            </div>

            <div className="flex items-center gap-2 rounded-lg bg-neutral-100 p-2 text-xs">

              <Compass
                size={14}
                className="text-orange-500"
              />

              {Math.round(
                Number(
                  selectedItem
                    .vehicle
                    .heading ?? 0,
                ),
              )}
              °

            </div>

          </div>

          <div className="mb-2 rounded-lg bg-emerald-50 p-2">

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">

              <MapPin
                size={14}
              />

              مبدأ

            </div>

            <div className="mt-1 text-xs text-neutral-700">
              {selectedItem
                .mission
                .originTitle ||
                'مبدأ مأموریت'}
            </div>

          </div>

          <div className="rounded-lg bg-rose-50 p-2">

            <div className="flex items-center gap-2 text-xs font-bold text-rose-700">

              <MapPin
                size={14}
              />

              مقصد

            </div>

            <div className="mt-1 text-xs text-neutral-700">
              {selectedItem
                .mission
                .destinationTitle ||
                'مقصد مأموریت'}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}