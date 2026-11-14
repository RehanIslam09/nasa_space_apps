import type { ApiResponse } from '@nasa-experience/contracts';
import { ErrorCodes } from '@nasa-experience/contracts';

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Checks whether the client is currently running in Mock API mode.
 */
export function isMockMode(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NEXT_PUBLIC_API_MOCK === 'true';
  }
  return false;
}

/**
 * Standard Frontend HTTP API Client.
 *
 * Normalizes all outbound requests and handles timeout, error formatting,
 * and contract response parsing.
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Internal fetch executor with timeout and standardized error handling.
   */
  public async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { timeoutMs = 8000, params, ...fetchOptions } = options;

    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = new Headers(fetchOptions.headers);
      if (!headers.has('Content-Type') && fetchOptions.body) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timer);

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = (await response.json()) as ApiResponse<T>;
        return json;
      }

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: `HTTP Error ${response.status}: ${response.statusText}`,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }

      return {
        success: true,
        data: (await response.text()) as unknown as T,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (err: unknown) {
      clearTimeout(timer);

      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: ErrorCodes.TIMEOUT,
            message: `Request timed out after ${timeoutMs}ms`,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }

      return {
        success: false,
        error: {
          code: ErrorCodes.NETWORK_ERROR,
          message: err instanceof Error ? err.message : 'Unknown network error',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  public get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new ApiClient();
