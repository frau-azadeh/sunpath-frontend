import { apiRequest } from '@/lib/api/request';
import type {
  CreateDriverRequest,
  Driver,
  UpdateDriverRequest,
} from '@/types/driver';

export const driverService = {
  getAll(signal?: AbortSignal): Promise<Driver[]> {
    return apiRequest<Driver[]>('/api/drivers', {
      method: 'GET',
      signal,
    });
  },

  getById(id: number, signal?: AbortSignal): Promise<Driver> {
    return apiRequest<Driver>(`/api/drivers/${id}`, {
      method: 'GET',
      signal,
    });
  },

  create(data: CreateDriverRequest): Promise<Driver> {
    return apiRequest<Driver>('/api/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: UpdateDriverRequest): Promise<Driver> {
    return apiRequest<Driver>(`/api/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove(id: number): Promise<{ message: string; id: number }> {
    return apiRequest<{ message: string; id: number }>(`/api/drivers/${id}`, {
      method: 'DELETE',
    });
  },
};
