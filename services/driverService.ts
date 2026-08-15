import type {
  CreateDriverRequest,
  Driver,
  UpdateDriverRequest,
} from '@/types/driver';

const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    throw new Error(
      'Runtime API configuration is only available in the browser.',
    );
  }

  const apiBaseUrl = window.CONFIG?.NEXT_PUBLIC_API_BASE?.trim();

  if (!apiBaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE is not defined in /public/config.js.',
    );
  }

  return apiBaseUrl.replace(/\/+$/, '');
};

const request = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');

    throw new Error(
      message || `API request failed with status ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const driverService = {
  getAll(signal?: AbortSignal): Promise<Driver[]> {
    return request<Driver[]>('/api/drivers', {
      signal,
    });
  },

  getById(id: number, signal?: AbortSignal): Promise<Driver> {
    return request<Driver>(`/api/drivers/${id}`, {
      signal,
    });
  },

  create(data: CreateDriverRequest): Promise<Driver> {
    return request<Driver>('/api/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: UpdateDriverRequest): Promise<void> {
    return request<void>(`/api/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove(id: number): Promise<void> {
    return request<void>(`/api/drivers/${id}`, {
      method: 'DELETE',
    });
  },
};
