import { apiRequest } from '@/lib/api/request';
import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
} from '@/types/vehicle';

interface VehicleMutationResponse {
  message: string;
  data: Vehicle;
}

interface VehicleDeleteResponse {
  message: string;
}

export const vehicleService = {
  getAll(signal?: AbortSignal): Promise<Vehicle[]> {
    return apiRequest<Vehicle[]>('/api/vehicles', {
      method: 'GET',
      signal,
    });
  },

  getById(id: number, signal?: AbortSignal): Promise<Vehicle> {
    return apiRequest<Vehicle>(`/api/vehicles/${id}`, {
      method: 'GET',
      signal,
    });
  },

  create(data: CreateVehicleRequest): Promise<VehicleMutationResponse> {
    return apiRequest<VehicleMutationResponse>('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(
    id: number,
    data: UpdateVehicleRequest,
  ): Promise<VehicleMutationResponse> {
    return apiRequest<VehicleMutationResponse>(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove(id: number): Promise<VehicleDeleteResponse> {
    return apiRequest<VehicleDeleteResponse>(`/api/vehicles/${id}`, {
      method: 'DELETE',
    });
  },
};
