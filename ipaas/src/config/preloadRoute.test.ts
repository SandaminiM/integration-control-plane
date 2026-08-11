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

import { describe, expect, it, vi } from 'vitest';

// The real route tree pulls in `features`, which needs the build-time
// `__PRODUCT__` define; a stub keeps this a unit test of the matching logic.
const Page = () => null;
const preload = vi.fn(async () => ({ default: Page }));
vi.mock('./routes', () => ({
  default: [
    { path: '/plain', element: { type: Page } },
    { path: '/lazy', element: { type: Object.assign(() => null, { preload }) } },
  ],
}));

const { collectPreloads, preloadRoute } = await import('./preloadRoute');

describe('collectPreloads', () => {
  it('finds the preload of a lazy route', () => {
    expect(collectPreloads('/lazy')).toHaveLength(1);
  });

  it('returns nothing for a route with no preload — the caller navigates straight away', () => {
    expect(collectPreloads('/plain')).toEqual([]);
  });

  it('returns nothing for an unmatched path', () => {
    expect(collectPreloads('/nope')).toEqual([]);
  });
});

describe('preloadRoute', () => {
  it('resolves once every preloader has', async () => {
    const a = vi.fn(async () => undefined);
    const b = vi.fn(async () => undefined);
    await preloadRoute([a, b]);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('is a no-op with nothing to preload', async () => {
    await expect(preloadRoute([])).resolves.toBeUndefined();
  });

  it('resolves rather than rejecting when a chunk fails, so navigation still happens', async () => {
    await expect(preloadRoute([() => Promise.reject(new Error('chunk 404'))])).resolves.toBeUndefined();
  });

  it('gives up on the timeout so a stalled chunk cannot strand the user', async () => {
    const stalled = () => new Promise(() => undefined);
    await expect(preloadRoute([stalled], 10)).resolves.toBeUndefined();
  });
});
