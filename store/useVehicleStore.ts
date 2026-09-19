import { create } from 'zustand';

import type { Vehicle } from '@/types/vehicle';

declare global {
  interface Window {
    CONFIG?: {
      NEXT_PUBLIC_API_BASE?: string;
    };
  }
}

interface VehicleState {
  vehicles: Vehicle[];

  selectedVehicleId: number | string | null;

  isLoading: boolean;

  loadVehicles: () => Promise<void>;

  updateVehiclePosition: (
    id: number | string,
    lat: number,
    lng: number,
    speed?: number,
    heading?: number,
  ) => void;

  setSelectedVehicleId: (id: number | string | null) => void;

  upsertVehicleRealtime: (
    payload: Partial<Vehicle> & {
      id: number | string;
    },
  ) => void;

  removeVehicle: (id: number | string) => void;
}

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.CONFIG?.NEXT_PUBLIC_API_BASE) {
    return String(window.CONFIG.NEXT_PUBLIC_API_BASE).replace(/\/+$/, '');
  }

  return '';
}

function normalizeList(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    const objectData = data as {
      items?: unknown;
      data?: unknown;
    };

    if (Array.isArray(objectData.items)) {
      return objectData.items;
    }

    if (Array.isArray(objectData.data)) {
      return objectData.data;
    }
  }

  return [];
}

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],

  selectedVehicleId: null,

  isLoading: false,

  loadVehicles: async () => {
    set({
      isLoading: true,
    });

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/Vehicles`, {
        method: 'GET',

        headers: {
          Accept: 'application/json',
        },

        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`GET /api/Vehicles failed: ${response.status}`);
      }

      const data: unknown = await response.json();

      const list = normalizeList(data);

      const normalized: Vehicle[] = list.map((item) => {
        const vehicle = item as Partial<Vehicle> & {
          vehicleId?: number;
          lat?: number;
          lng?: number;
        };

        const id = vehicle.id ?? vehicle.vehicleId ?? 0;

        const latitudeValue =
          vehicle.latitude ?? vehicle.lastLatitude ?? vehicle.lat ?? null;

        const longitudeValue =
          vehicle.longitude ?? vehicle.lastLongitude ?? vehicle.lng ?? null;

        const latitude = latitudeValue == null ? null : Number(latitudeValue);

        const longitude =
          longitudeValue == null ? null : Number(longitudeValue);

        return {
          id: Number(id),

          plateNumber: vehicle.plateNumber ?? `خودرو ${id}`,

          model: vehicle.model ?? null,

          status: Number(vehicle.status ?? 0) === 1 ? 1 : 0,

          lastLatitude:
            vehicle.lastLatitude == null
              ? latitude
              : Number(vehicle.lastLatitude),

          lastLongitude:
            vehicle.lastLongitude == null
              ? longitude
              : Number(vehicle.lastLongitude),

          lastUpdateAt: vehicle.lastUpdateAt ?? null,

          speed: Number(vehicle.speed ?? 0),

          heading: Number(vehicle.heading ?? 0),

          latitude,

          longitude,

          lastUpdate: vehicle.lastUpdate ?? null,

          vehicleType: Number(
            vehicle.vehicleType ?? 0,
          ) as Vehicle['vehicleType'],

          insuranceNumber: vehicle.insuranceNumber ?? null,

          insuranceExpiryDate: vehicle.insuranceExpiryDate ?? null,

          currentDriverId: vehicle.currentDriverId ?? null,

          currentDriverName: vehicle.currentDriverName ?? null,
        };
      });

      set({
        vehicles: normalized,
        isLoading: false,
      });
    } catch (error) {
      console.error('[VehicleStore] loadVehicles error:', error);

      set({
        isLoading: false,
      });
    }
  },

  updateVehiclePosition: (id, lat, lng, speed = 0, heading = 0) => {
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) => {
        if (String(vehicle.id) !== String(id)) {
          return vehicle;
        }

        return {
          ...vehicle,

          latitude: Number(lat),

          longitude: Number(lng),

          lastLatitude: Number(lat),

          lastLongitude: Number(lng),

          speed: Number(speed),

          heading: Number(heading),
        };
      }),
    }));
  },

  setSelectedVehicleId: (id) => {
    set({
      selectedVehicleId: id,
    });
  },

  upsertVehicleRealtime: (payload) => {
    set((state) => {
      const index = state.vehicles.findIndex(
        (vehicle) => String(vehicle.id) === String(payload.id),
      );

      if (index === -1) {
        /*
         * برای اضافه شدن یک خودرو به Store
         * باید payload کامل Vehicle باشد.
         */
        const newVehicle = payload as Vehicle;

        return {
          vehicles: [...state.vehicles, newVehicle],
        };
      }

      const vehicles = [...state.vehicles];

      vehicles[index] = {
        ...vehicles[index],
        ...payload,
        id: Number(payload.id),
      };

      return {
        vehicles,
      };
    });
  },

  removeVehicle: (id) => {
    set((state) => ({
      vehicles: state.vehicles.filter(
        (vehicle) => String(vehicle.id) !== String(id),
      ),

      selectedVehicleId:
        String(state.selectedVehicleId) === String(id)
          ? null
          : state.selectedVehicleId,
    }));
  },
}));
