import { API_URL } from '@/config/config';
import { logger } from '@/core/Logger';
import { storage } from '@/libs/localStorage';

type FetcherOptions<Body> = {
  body?: Body;
  method?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  credentials?: 'include' | 'omit';
  mode?: 'cors' | 'no-cors' | 'same-origin';
  cache?: 'default' | 'no-store' | 'reload' | 'force-cache' | 'only-if-cached';
  redirect?: 'follow' | 'error' | 'manual';
  referrer?: string;
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'same-origin'
    | 'origin'
    | 'strict-origin'
    | 'origin-when-cross-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  integrity?: string;
};

/**
 * fetch() ラッパー関数
 * @param url
 * @param options
 * @returns
 */
export const fetcher = async <Response = unknown, Body = Record<string, unknown>>(
  url: string,
  options?: FetcherOptions<Body>
): Promise<{ data: Response; ok: boolean; status: number }> => {
  const token = storage.getUserToken();
  const isFormData = options?.body instanceof FormData;

  try {
    const { body, ...fetchOptions } = options ?? {};
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...fetchOptions.headers,
      },
      body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
      ...fetchOptions,
    });
    const isOk = response.ok;
    if (!isOk) throw new Error(response.statusText);

    const data = await response.json();

    return { data, ok: response.ok, status: response.status };
  } catch (error) {
    logger.error(error?.toString() ?? 'Unknown error');
    throw error;
  }
};

/**
 * ゲストユーザー用の fetcher
 * @param url
 * @param options
 * @returns
 */
export const fetcherGuest = async <Response = unknown, Body = Record<string, unknown>>(
  url: string,
  options?: FetcherOptions<Body>
): Promise<{ data: Response; ok: boolean; status: number }> => {
  try {
    const { body, ...fetchOptions } = options ?? {};

    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      body: JSON.stringify(body),
      ...fetchOptions,
    });
    const data = await response.json();

    return { data, ok: response.ok, status: response.status };
  } catch (error) {
    logger.error(error?.toString() ?? 'Unknown error');
    throw error;
  }
};
