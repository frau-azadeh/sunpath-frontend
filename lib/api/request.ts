'use client';

const CONFIG_TIMEOUT = 5000;
const CONFIG_INTERVAL = 50;

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

async function getApiBaseUrl(): Promise<string> {
  const startedAt = Date.now();

  while (!window.CONFIG?.NEXT_PUBLIC_API_BASE?.trim()) {
    if (Date.now() - startedAt >= CONFIG_TIMEOUT) {
      throw new Error('آدرس API پیدا نشد. فایل /config.js را بررسی کنید.');
    }

    await sleep(CONFIG_INTERVAL);
  }

  return window.CONFIG.NEXT_PUBLIC_API_BASE.trim().replace(/\/+$/, '');
}

async function readError(response: Response): Promise<string> {
  const fallback = `خطا در ارتباط با سرور: ${response.status}`;

  try {
    const text = await response.text();

    if (!text) {
      return fallback;
    }

    try {
      const data: unknown = JSON.parse(text);

      if (typeof data === 'string') {
        return data;
      }

      if (
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof data.message === 'string'
      ) {
        return data.message;
      }

      if (
        typeof data === 'object' &&
        data !== null &&
        'title' in data &&
        typeof data.title === 'string'
      ) {
        return data.title;
      }

      if (
        typeof data === 'object' &&
        data !== null &&
        'errors' in data &&
        typeof data.errors === 'object' &&
        data.errors !== null
      ) {
        const errors = Object.values(data.errors).flat();

        const firstError = errors.find(
          (item): item is string => typeof item === 'string',
        );

        if (firstError) {
          return firstError;
        }
      }
    } catch {
      return text;
    }

    return text;
  } catch {
    return fallback;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = await getApiBaseUrl();

  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const response = await fetch(`${baseUrl}${normalizedEndpoint}`, {
    ...options,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(options.body
        ? {
            'Content-Type': 'application/json',
          }
        : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
