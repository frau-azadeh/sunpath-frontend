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
    const result = await response.json();

    if (typeof result?.message === 'string') {
      return result.message;
    }

    if (typeof result?.title === 'string') {
      return result.title;
    }
  } catch {
    // پاسخ JSON نبود
  }

  return `${fallbackMessage} (${response.status})`;
};

const dispatchService = {
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

export { dispatchService };
