// src/store/useVehicleStore.ts
import { create } from 'zustand';
import { Vehicle } from '@/types/fleet';

type VehicleApiItem = {
  id?: number | string;
  plateNumber?: string | null;
  status?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  speed?: number | string | null;
  heading?: number | string | null;
  lastUpdate?: string | null;
};

interface VehicleState {
  vehicles: Vehicle[];
  selectedVehicleId: number | null;
  isLoading: boolean;
  error: string | null;

  setVehicles: (vehicles: Vehicle[]) => void;
  loadVehicles: () => Promise<void>;
  updateVehiclePosition: (
    vehicleId: number,
    lat: number,
    lng: number,
    speed: number,
    heading: number,
  ) => void;
  setSelectedVehicleId: (id: number | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';
  return window.CONFIG?.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') ?? '';
};

const normalizeVehicle = (item: VehicleApiItem): Vehicle | null => {
  const id = Number(item.id);
  const latitude = Number(item.latitude);
  const longitude = Number(item.longitude);

  if (
    !Number.isFinite(id) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude === 0 ||
    longitude === 0
  ) {
    console.warn('[VehicleStore] Invalid vehicle ignored:', item);
    return null;
  }

  return {
    id,
    plateNumber: String(item.plateNumber ?? `خودرو ${id}`),
    status: String(item.status ?? '0'),
    latitude,
    longitude,
    speed: Number.isFinite(Number(item.speed)) ? Number(item.speed) : 0,
    heading: Number.isFinite(Number(item.heading)) ? Number(item.heading) : 0,
    lastUpdate: item.lastUpdate ?? new Date().toISOString(),
  };
};

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],
  selectedVehicleId: null,
  isLoading: false,
  error: null,

  setVehicles: (vehicles) => {
    set({
      vehicles,
      error: null,
    });
  },

  loadVehicles: async () => {
    const baseUrl = getApiBaseUrl();

    if (!baseUrl) {
      const errorMessage = 'API base URL is not configured.';
      console.error('[VehicleStore]', errorMessage);
      set({
        isLoading: false,
        error: errorMessage,
      });
      return;
    }

    const apiUrl = `${baseUrl}/api/vehicles`;

    set({
      isLoading: true,
      error: null,
    });

    console.log('[VehicleStore] Loading vehicles from:', apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Vehicle API request failed: ${response.status}`);
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Vehicle API response is not an array.');
      }

      const vehicles = data
        .map((item) => normalizeVehicle(item as VehicleApiItem))
        .filter((vehicle): vehicle is Vehicle => vehicle !== null);

      console.log('[VehicleStore] Vehicles loaded:', vehicles);

      set({
        vehicles,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load vehicles.';

      console.error('[VehicleStore] Failed to load vehicles:', error);

      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  updateVehiclePosition: (vehicleId, lat, lng, speed, heading) =>
    set((state) => {
      const normalizedVehicleId = Number(vehicleId);
      const normalizedLat = Number(lat);
      const normalizedLng = Number(lng);
      const normalizedSpeed = Number(speed);
      const normalizedHeading = Number(heading);

      console.log('[VehicleStore] Position update requested:', {
        vehicleId: normalizedVehicleId,
        lat: normalizedLat,
        lng: normalizedLng,
        speed: normalizedSpeed,
        heading: normalizedHeading,
      });

      if (
        !Number.isFinite(normalizedVehicleId) ||
        !Number.isFinite(normalizedLat) ||
        !Number.isFinite(normalizedLng)
      ) {
        console.warn('[VehicleStore] Invalid position update ignored.');
        return state;
      }

      const exists = state.vehicles.some(
        (vehicle) => vehicle.id === normalizedVehicleId,
      );

      if (!exists) {
        console.log(
          '[VehicleStore] Vehicle not found. Adding:',
          normalizedVehicleId,
        );

        const newVehicle: Vehicle = {
          id: normalizedVehicleId,
          plateNumber: `خودرو ${normalizedVehicleId}`,
          status: '1', // آنلاین
          latitude: normalizedLat,
          longitude: normalizedLng,
          speed: Number.isFinite(normalizedSpeed) ? normalizedSpeed : 0,
          heading: Number.isFinite(normalizedHeading) ? normalizedHeading : 0,
          lastUpdate: new Date().toISOString(),
        };

        return {
          vehicles: [...state.vehicles, newVehicle],
        };
      }

      return {
        vehicles: state.vehicles.map((vehicle) =>
          vehicle.id === normalizedVehicleId
            ? {
                ...vehicle,
                latitude: normalizedLat,
                longitude: normalizedLng,
                speed: Number.isFinite(normalizedSpeed)
                  ? normalizedSpeed
                  : vehicle.speed,
                heading: Number.isFinite(normalizedHeading)
                  ? normalizedHeading
                  : vehicle.heading,
                // اگر خودرو در حال حرکت باشه (سرعت بیشتر از صفر)، وضعیت رو به فعال تغییر بده
                status: normalizedSpeed > 0 ? '1' : '0',
                lastUpdate: new Date().toISOString(),
              }
            : vehicle,
        ),
      };
    }),

  setSelectedVehicleId: (id) => {
    set({
      selectedVehicleId: id,
    });
  },

  setLoading: (loading) => {
    set({
      isLoading: loading,
    });
  },

  clearError: () => {
    set({
      error: null,
    });
  },
}));
