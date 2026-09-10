// src/store/useVehicleStore.ts
import { create } from 'zustand';
import type { Vehicle } from '@/types/fleet';

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
    heading?: number
  ) => void;
  setSelectedVehicleId: (id: number | string | null) => void;
  upsertVehicleRealtime: (payload: Partial<Vehicle> & { id: number | string }) => void;
  removeVehicle: (id: number | string) => void;
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  selectedVehicleId: null,
  isLoading: false,

  loadVehicles: async () => {
    try {
      set({ isLoading: true });
      const apiBaseUrl = (typeof window !== 'undefined' && (window as any).CONFIG?.NEXT_PUBLIC_API_BASE)
        ? (window as any).CONFIG.NEXT_PUBLIC_API_BASE.replace(/\/+$/, '')
        : '';
        
      const res = await fetch(`${apiBaseUrl}/api/Vehicles`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.items || data.data || []);

        const normalized: Vehicle[] = list.map((v: any) => {
          const lat = Number(v.latitude ?? v.lastLatitude ?? v.lat ?? 0);
          const lng = Number(v.longitude ?? v.lastLongitude ?? v.lng ?? 0);

          return {
            ...v,
            id: v.id ?? v.vehicleId,
            latitude: lat,
            longitude: lng,
            lastLatitude: lat,
            lastLongitude: lng,
            speed: Number(v.speed ?? 0),
            heading: Number(v.heading ?? 0),
            plateNumber: v.plateNumber ?? `خودرو ${v.id ?? ''}`,
          };
        });

        set({ vehicles: normalized, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.warn('loadVehicles: fallback or network error', err);
      set({ isLoading: false });
    }
  },

  updateVehiclePosition: (id, lat, lng, speed = 0, heading = 0) => {
    set((state) => ({
      vehicles: state.vehicles.map((v) => {
        if (String(v.id) === String(id)) {
          return {
            ...v,
            latitude: Number(lat),
            longitude: Number(lng),
            lastLatitude: Number(lat),
            lastLongitude: Number(lng),
            speed: Number(speed),
            heading: Number(heading),
          };
        }
        return v;
      }),
    }));
  },

  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),

  upsertVehicleRealtime: (payload) => {
    set((state) => {
      const pId = String(payload.id);
      const index = state.vehicles.findIndex((v) => String(v.id) === pId);

      const lat = Number(payload.latitude ?? (payload as any).lastLatitude ?? (payload as any).lat ?? 0);
      const lng = Number(payload.longitude ?? (payload as any).lastLongitude ?? (payload as any).lng ?? 0);

      const updatedPayload = {
        ...payload,
        latitude: lat,
        longitude: lng,
        lastLatitude: lat,
        lastLongitude: lng,
        speed: Number(payload.speed ?? 0),
        heading: Number(payload.heading ?? 0),
      };

      if (index !== -1) {
        // بروزرسانی وسیله نقلیه موجود
        const updatedVehicles = [...state.vehicles];
        updatedVehicles[index] = {
          ...updatedVehicles[index],
          ...updatedPayload,
        };
        return { vehicles: updatedVehicles };
      }

      // افزودن وسیله نقلیه جدید
      return {
        vehicles: [...state.vehicles, updatedPayload as Vehicle],
      };
    });
  },

  removeVehicle: (id) => {
    set((state) => ({
      vehicles: state.vehicles.filter((v) => String(v.id) !== String(id)),
      selectedVehicleId:
        String(state.selectedVehicleId) === String(id) ? null : state.selectedVehicleId,
    }));
  },
}));
