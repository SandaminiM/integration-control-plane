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

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  etag?: string;
}

/**
 * Return type for the fetcher passed to `cache.get()`.
 * Return `{ notModified: true }` when the server responds with HTTP 304
 * so the cache can extend the TTL without replacing the stored data.
 */
export type FetchResult<T> = { notModified: true } | { notModified?: false; data: T; etag?: string };

/**
 * Creates a localStorage-backed, in-memory cache with:
 * - TTL-based staleness
 * - Inflight deduplication (concurrent callers share one fetch)
 * - Optional ETag / HTTP 304 support via the `notModified` result shape
 */
export function createStorageCache<T>(options: {
  storageKey: string;
  ttlMs: number;
  /** Return false to treat a parsed entry as corrupt and discard it. */
  validate?: (data: unknown) => boolean;
}) {
  const { storageKey, ttlMs, validate } = options;

  let memCache: CacheEntry<T> | null = null;
  let inflight: Promise<T> | null = null;

  function isStale(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.cachedAt > ttlMs;
  }

  function loadFromStorage(): CacheEntry<T> | null {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (validate && !validate(entry.data)) return null;
      return entry;
    } catch {
      return null;
    }
  }

  function saveToStorage(entry: CacheEntry<T>): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch {
      // localStorage quota exceeded — silently continue with memory cache only
    }
  }

  /**
   * Returns cached data if fresh, otherwise calls `fetcher`.
   * `fetcher` receives the current stored entry (useful for ETag headers)
   * and must resolve to a `FetchResult<T>`.
   */
  function get(fetcher: (stored: CacheEntry<T> | null) => Promise<FetchResult<T>>): Promise<T> {
    if (memCache && !isStale(memCache)) return Promise.resolve(memCache.data);

    const stored = loadFromStorage();
    if (stored && !isStale(stored)) {
      memCache = stored;
      return Promise.resolve(stored.data);
    }

    if (inflight) return inflight;

    inflight = fetcher(stored)
      .then((result) => {
        if (result.notModified) {
          if (!stored) {
            throw new Error('Fetcher returned notModified without an existing cache entry');
          }
          // HTTP 304 — refresh TTL, keep existing data
          const refreshed: CacheEntry<T> = { ...stored, cachedAt: Date.now() };
          memCache = refreshed;
          saveToStorage(refreshed);
          return stored.data;
        }
        const entry: CacheEntry<T> = {
          data: result.data,
          cachedAt: Date.now(),
          etag: result.etag,
        };
        memCache = entry;
        saveToStorage(entry);
        return entry.data;
      })
      .finally(() => {
        inflight = null;
      });

    return inflight;
  }

  function clear(): void {
    memCache = null;
    localStorage.removeItem(storageKey);
  }

  return { get, clear };
}
