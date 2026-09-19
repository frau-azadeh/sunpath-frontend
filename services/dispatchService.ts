import type { DriverRouteHistory } from '@/components/driver/driver-types';
import type {
  CreateDispatchRequest,
  Dispatch,
  UpdateDispatchStatusRequest,
  UpdateVehicleLocationRequest,
} from '@/types/dispatch';

type ApiResponse<T> = {
  data?: T;
  items?: T;
  message?: string;
};

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

const buildUrl = (path: string): string => {
  return `${getApiBaseUrl()}${path}`;
};

const getErrorMessage = async (
  response: Response,
  fallbackMessage: string,
): Promise<string> => {
  try {
    const clonedResponse = response.clone();

    const result = await clonedResponse.json();

    if (typeof result?.message === 'string') {
      return result.message;
    }

    if (typeof result?.title === 'string') {
      return result.title;
    }

    if (typeof result === 'string') {
      return result;
    }
  } catch {
    // JSON نبود؛ پایین‌تر متن را می‌خوانیم.
  }

  try {
    const text = await response.text();

    if (text) {
      return text;
    }
  } catch {
    // ignore
  }

  return `${fallbackMessage} (${response.status})`;
};

export const dispatchService = {
  async getAll(signal?: AbortSignal): Promise<Dispatch[]> {
    const response = await fetch(buildUrl('/api/dispatches'), {
      method: 'GET',

      headers: {
        Accept: 'application/json',
      },

      cache: 'no-store',

      signal,
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, 'دریافت لیست مأموریت‌ها انجام نشد.'),
      );
    }

    const result: Dispatch[] | ApiResponse<Dispatch[]> = await response.json();

    if (Array.isArray(result)) {
      return result;
    }

    if (Array.isArray(result?.data)) {
      return result.data;
    }

    if (Array.isArray(result?.items)) {
      return result.items;
    }

    return [];
  },

  async getById(id: number, signal?: AbortSignal): Promise<Dispatch> {
    const response = await fetch(buildUrl(`/api/dispatches/${id}`), {
      method: 'GET',

      headers: {
        Accept: 'application/json',
      },

      cache: 'no-store',

      signal,
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, 'دریافت مأموریت انجام نشد.'),
      );
    }

    return response.json();
  },

  async getActiveForDriver(
    driverId: number,
    signal?: AbortSignal,
  ): Promise<Dispatch | null> {
    const response = await fetch(
      buildUrl(`/api/dispatches/driver/${driverId}/active`),
      {
        method: 'GET',

        headers: {
          Accept: 'application/json',
        },

        cache: 'no-store',

        signal,
      },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, 'دریافت مأموریت فعال انجام نشد.'),
      );
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();

    if (!text || text === 'null') {
      return null;
    }

    return JSON.parse(text) as Dispatch;
  },

  async getDriverHistory(
    driverId: number,
    signal?: AbortSignal,
  ): Promise<DriverRouteHistory[]> {
    const response = await fetch(
      buildUrl(`/api/dispatches/driver/${driverId}/history`),
      {
        method: 'GET',

        headers: {
          Accept: 'application/json',
        },

        cache: 'no-store',

        signal,
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          'دریافت سوابق مأموریت‌های راننده انجام نشد.',
        ),
      );
    }

    if (response.status === 204) {
      return [];
    }

    const text = await response.text();

    if (!text) {
      return [];
    }

    const result = JSON.parse(text);

    if (Array.isArray(result)) {
      return result as DriverRouteHistory[];
    }

    if (Array.isArray(result?.data)) {
      return result.data as DriverRouteHistory[];
    }

    if (Array.isArray(result?.items)) {
      return result.items as DriverRouteHistory[];
    }

    return [];
  },

  async create(data: CreateDispatchRequest): Promise<{ id: number }> {
    const response = await fetch(buildUrl('/api/dispatches'), {
      method: 'POST',

      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, 'ایجاد مأموریت انجام نشد.'),
      );
    }

    return response.json();
  },

  async update(id: number, data: CreateDispatchRequest): Promise<Dispatch> {
    const response = await fetch(buildUrl(`/api/dispatches/${id}`), {
      method: 'PUT',

      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, 'ویرایش مأموریت انجام نشد.'),
      );
    }

    return response.json();
  },

  async updateStatus(
    id: number,
    data: UpdateDispatchStatusRequest,
  ): Promise<void> {
    const response = await fetch(buildUrl(`/api/dispatches/${id}/status`), {
      method: 'PATCH',

      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, 'به‌روزرسانی وضعیت مأموریت انجام نشد.'),
      );
    }
  },

  async remove(id: number): Promise<void> {
    const response = await fetch(buildUrl(`/api/dispatches/${id}`), {
      method: 'DELETE',

      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, 'حذف مأموریت انجام نشد.'),
      );
    }
  },

  async updateVehicleLocation(
    data: UpdateVehicleLocationRequest,
  ): Promise<void> {
    const response = await fetch(buildUrl('/api/dispatches/location'), {
      method: 'POST',

      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, 'ثبت موقعیت خودرو انجام نشد.'),
      );
    }
  },
};
