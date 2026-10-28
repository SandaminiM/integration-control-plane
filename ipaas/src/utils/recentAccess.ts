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

/** What the user opened most recently, newest first, kept per user in this browser. */

export type RecentKind = 'projects' | 'components';

export interface RecentEntry {
  key: string;
  /** Epoch milliseconds of the last visit. */
  at: number;
}

const MAX_RECENT = 20;

const storageKey = (userId: string, kind: RecentKind) => `recent_${kind}:${userId}`;

/** Moves `key` to the front with its new visit time, dropping its older copy and anything past the limit. */
export function pushRecent(list: readonly RecentEntry[], key: string, at: number, max = MAX_RECENT): RecentEntry[] {
  return [{ key, at }, ...list.filter((e) => e.key !== key)].slice(0, max);
}

const isEntry = (value: unknown): value is RecentEntry => typeof value === 'object' && value !== null && typeof (value as RecentEntry).key === 'string' && typeof (value as RecentEntry).at === 'number';

/** Reads a stored list, dropping anything that is not a well-formed entry. */
export function parseRecent(raw: string | null): RecentEntry[] {
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter(isEntry) : [];
  } catch {
    return [];
  }
}

export function readRecent(userId: string, kind: RecentKind): RecentEntry[] {
  try {
    return parseRecent(localStorage.getItem(storageKey(userId, kind)));
  } catch {
    return [];
  }
}

export function recordRecent(userId: string, kind: RecentKind, key: string): void {
  try {
    localStorage.setItem(storageKey(userId, kind), JSON.stringify(pushRecent(readRecent(userId, kind), key, Date.now())));
  } catch {
    // Storage can be full or blocked; recency is a convenience, not state the app depends on.
  }
}

export const recentProjectKey = (org: string, project: string) => `${org}/${project}`;
export const recentComponentKey = (org: string, project: string, component: string) => `${org}/${project}/${component}`;
