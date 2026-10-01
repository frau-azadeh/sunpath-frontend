import { getApiBaseUrl } from '@/lib/api/base';
import type { CreateVehicleRequest, Vehicle } from '@/types/vehicle';



async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();

    throw new Error(text || `خطا در ارتباط با سرور (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const vehicleService = {
  async getAll(signal?: AbortSignal): Promise<Vehicle[]> {
    const response = await fetch(`${getApiBaseUrl()}/api/vehicles`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
      cache: 'no-store',
    });

    return handleResponse<Vehicle[]>(response);
  },

  async getById(id: number, signal?: AbortSignal): Promise<Vehicle> {
    const response = await fetch(`${getApiBaseUrl()}/api/vehicles/${id}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
      cache: 'no-store',
    });

    return handleResponse<Vehicle>(response);
  },

  async create(data: CreateVehicleRequest): Promise<Vehicle> {
    const response = await fetch(`${getApiBaseUrl()}/api/vehicles`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await handleResponse<{ data: Vehicle }>(response);
    return result.data;
  },

  async update(id: number, data: CreateVehicleRequest): Promise<Vehicle> {
    const response = await fetch(`${getApiBaseUrl()}/api/vehicles/${id}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await handleResponse<{ data: Vehicle }>(response);
    return result.data;
  },

  async remove(id: number): Promise<void> {
    const response = await fetch(`${getApiBaseUrl()}/api/vehicles/${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    });

    await handleResponse<void>(response);
  },
};
