import { create } from 'zustand';
import { Vehicle } from '@/types/fleet';

interface VehicleState {
  vehicles: Vehicle[];
  selectedVehicleId: number | null;
  isLoading: boolean;
  
  // اکشن‌ها
  setVehicles: (vehicles: Vehicle[]) => void;
  updateVehiclePosition: (vehicleId: number, lat: number, lng: number, speed: number, heading: number) => void;
  setSelectedVehicleId: (id: number | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],
  selectedVehicleId: null,
  isLoading: false,

  setVehicles: (vehicles) => set({ vehicles }),
  
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  
  setLoading: (loading) => set({ isLoading: loading }),

  updateVehiclePosition: (vehicleId, lat, lng, speed, heading) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId
          ? { 
              ...v, 
              latitude: lat, 
              longitude: lng, 
              speed: speed, 
              heading: heading,
              lastUpdate: new Date().toISOString() 
            }
          : v
      ),
    })),
}));
