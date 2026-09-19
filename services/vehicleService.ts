import type { CreateVehicleRequest, Vehicle } from '@/types/vehicle';

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const runtimeConfig = (
      window as typeof window & {
        __RUNTIME_CONFIG__?: {
          API_BASE_URL?: string;
        };
      }
    ).__RUNTIME_CONFIG__;

    if (runtimeConfig?.API_BASE_URL) {
      return runtimeConfig.API_BASE_URL.replace(/\/$/, '');
    }
  }

  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:44341'
  ).replace(/\/$/, '');
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      text || `خطا در ارتباط با سرور (${response.status})`,
    );
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
    const response = await fetch(
      `${getApiBaseUrl()}/api/vehicles/${id}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal,
        cache: 'no-store',
      },
    );

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

  async update(
    id: number,
    data: CreateVehicleRequest,
  ): Promise<Vehicle> {
    const response = await fetch(
      `${getApiBaseUrl()}/api/vehicles/${id}`,
      {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    );

    return handleResponse<Vehicle>(response);
  },

  async remove(id: number): Promise<void> {
    const response = await fetch(
      `${getApiBaseUrl()}/api/vehicles/${id}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    await handleResponse<void>(response);
  },
};