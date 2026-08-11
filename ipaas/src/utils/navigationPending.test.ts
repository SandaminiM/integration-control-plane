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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { beginNavigation, getNavigationPending, resetNavigationPending, subscribeNavigationPending } from './navigationPending';

// Real timers: `vi.useFakeTimers()` hangs this project's vitest setup on
// teardown (see the pre-existing failures in time.test.ts), so the delays are
// shrunk via arguments instead.
const DELAY = 10;
const MIN = 20;
const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => resetNavigationPending());

describe('beginNavigation', () => {
  it('stays silent for a navigation that finishes before the delay', async () => {
    beginNavigation(DELAY, MIN)();
    await settle(DELAY + MIN + 10);
    expect(getNavigationPending()).toBe(false);
  });

  it('shows once a navigation outlives the delay', async () => {
    beginNavigation(DELAY, MIN);
    expect(getNavigationPending()).toBe(false);
    await settle(DELAY + 5);
    expect(getNavigationPending()).toBe(true);
  });

  it('holds for the minimum so it cannot flash', async () => {
    const end = beginNavigation(DELAY, MIN);
    await settle(DELAY + 5);
    end();
    expect(getNavigationPending()).toBe(true);
    await settle(MIN + 10);
    expect(getNavigationPending()).toBe(false);
  });

  it('keeps showing while another navigation is still in flight', async () => {
    const first = beginNavigation(DELAY, MIN);
    const second = beginNavigation(DELAY, MIN);
    await settle(DELAY + 5);
    first();
    await settle(MIN + 10);
    expect(getNavigationPending()).toBe(true);
    second();
    await settle(MIN + 10);
    expect(getNavigationPending()).toBe(false);
  });

  it('ignores a repeated end — the count must not go negative', async () => {
    const end = beginNavigation(DELAY, MIN);
    await settle(DELAY + 5);
    end();
    end();
    await settle(MIN + 10);
    expect(getNavigationPending()).toBe(false);

    beginNavigation(DELAY, MIN);
    await settle(DELAY + 5);
    expect(getNavigationPending()).toBe(true);
  });
});

describe('resetNavigationPending', () => {
  it('cancels a pending show timer so it cannot fire after the reset', async () => {
    beginNavigation(DELAY, MIN);
    resetNavigationPending();
    await settle(DELAY + 10);
    expect(getNavigationPending()).toBe(false);
  });
});

describe('subscribeNavigationPending', () => {
  it('notifies on change and stops after unsubscribe', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeNavigationPending(listener);

    beginNavigation(DELAY, MIN);
    await settle(DELAY + 5);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    resetNavigationPending();
    beginNavigation(DELAY, MIN);
    await settle(DELAY + 5);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
