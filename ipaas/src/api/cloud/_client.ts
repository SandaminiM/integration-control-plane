/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Cloud BFF client.
 *
 * Wraps authenticatedFetch (Bearer token via tokenManager) against the
 * ipaas-service base URL (window.API_CONFIG.choreoBaseApiUrl). PATCH is
 * supported here because the shared HttpClient lacks it.
 */

import { authenticatedFetch } from '../../auth/tokenManager';

export { withStsRetry, withScopeRetry } from '../httpClients';

/** Standard BFF list envelope: { items: T[] }. */
export interface ListResponse<T> { items: T[] }

/** Standard BFF mutation envelope returning a server message. */
export interface MessageResponse { message?: string }

/** Unwraps a ListResponse to its items array, tolerating null/undefined. */
export const items = <T>(r: ListResponse<T> | null | undefined): T[] => r?.items ?? [];

const bffBaseUrl = (): string => window.API_CONFIG?.choreoBaseApiUrl ?? '';

async function request<T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  const init: RequestInit = {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  const res = await authenticatedFetch(`${bffBaseUrl()}${path}`, init);
  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  return (text ? (JSON.parse(text) as T) : (undefined as unknown as T));
}

export const bff = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) => request<T>('POST', path, body, headers),
  put: <T>(path: string, body?: unknown, headers?: Record<string, string>) => request<T>('PUT', path, body, headers),
  patch: <T>(path: string, body?: unknown, headers?: Record<string, string>) => request<T>('PATCH', path, body, headers),
  delete: <T>(path: string, body?: unknown, headers?: Record<string, string>) => request<T>('DELETE', path, body, headers),
};

/** Build a "?k=v&k=v" string from a record, dropping undefined/null/empty values. */
export function q(params: Record<string, string | number | boolean | undefined | null>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

/** Encode a single URL path segment. */
export const seg = (s: string): string => encodeURIComponent(s);
