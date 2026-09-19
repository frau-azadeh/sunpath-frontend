import type { CreateVehicleRequest, Vehicle } from '@/types/vehicle';

declare global {
  interface Window {
    CONFIG?: {
      NEXT_PUBLIC_API_BASE?: string;
    };
  }
}

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const runtimeApiBase = window.CONFIG?.NEXT_PUBLIC_API_BASE;

    if (runtimeApiBase) {
      return runtimeApiBase.replace(/\/$/, '');
    }
  }

  const envApiBase = process.env.NEXT_PUBLIC_API_BASE;

  if (envApiBase) {
    return envApiBase.replace(/\/$/, '');
  }

  return 'https://localhost:44341';
};

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

    return handleResponse<Vehicle>(response);
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

    return handleResponse<Vehicle>(response);
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
