import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
} from '@/types/vehicle';

const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.CONFIG?.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, '') ?? '';
};

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = await response.json();

    if (typeof data === 'string') {
      return data;
    }

    if (data?.message) {
      return data.message;
    }

    if (data?.title) {
      return data.title;
    }

    if (data?.errors) {
      const errors = Object.values(data.errors).flat();

      if (errors.length > 0 && typeof errors[0] === 'string') {
        return errors[0];
      }
    }
  } catch {
    return `خطا در ارتباط با سرور: ${response.status}`;
  }

  return `خطا در ارتباط با سرور: ${response.status}`;
};

const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const vehicleService = {
  getAll: (): Promise<Vehicle[]> => request<Vehicle[]>('/api/vehicles'),

  getById: (id: number): Promise<Vehicle> =>
    request<Vehicle>(`/api/vehicles/${id}`),

  create: (data: CreateVehicleRequest): Promise<Vehicle> =>
    request<Vehicle>('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateVehicleRequest): Promise<void> =>
    request<void>(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (id: number): Promise<void> =>
    request<void>(`/api/vehicles/${id}`, {
      method: 'DELETE',
    }),
};
