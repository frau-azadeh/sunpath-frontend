import { create } from 'zustand';

import type { Vehicle } from '@/types/fleet';

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

function normalizeList(data: any): any[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
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

      const data = await response.json();

      const list = normalizeList(data);

      const normalized: Vehicle[] = list.map((vehicle: any) => {
        const id = vehicle.id ?? vehicle.vehicleId;

        const latitude = Number(
          vehicle.latitude ?? vehicle.lastLatitude ?? vehicle.lat ?? 0,
        );

        const longitude = Number(
          vehicle.longitude ?? vehicle.lastLongitude ?? vehicle.lng ?? 0,
        );

        return {
          ...vehicle,

          id,

          latitude,

          longitude,

          lastLatitude: Number(vehicle.lastLatitude ?? latitude),

          lastLongitude: Number(vehicle.lastLongitude ?? longitude),

          speed: Number(vehicle.speed ?? 0),

          heading: Number(vehicle.heading ?? 0),

          plateNumber: vehicle.plateNumber ?? `خودرو ${id}`,
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
        return {
          vehicles: [...state.vehicles, payload as Vehicle],
        };
      }

      const vehicles = [...state.vehicles];

      vehicles[index] = {
        ...vehicles[index],
        ...payload,
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
