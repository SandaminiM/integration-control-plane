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
 * Whether a navigation has been waiting on its code long enough to be worth
 * telling the user about. A module store rather than a context: there is exactly
 * one navigation indicator in the app, so no subtree ever needs a different
 * value, and `beginNavigation` stays a plain function that the ~95 components
 * calling `useAppNavigate` can invoke without subscribing to anything.
 */

/** Below this a navigation reads as instant, so an indicator would be noise (Doherty ~400ms). */
const INDICATOR_DELAY_MS = 100;
/** Once shown, hold it this long — an indicator that flashes and vanishes reads as a glitch. */
const INDICATOR_MIN_MS = 400;

let pending = false;
let inFlight = 0;
let shownAt = 0;
const listeners = new Set<() => void>();

function set(next: boolean): void {
  if (pending === next) return;
  pending = next;
  listeners.forEach((fn) => fn());
}

/**
 * Marks a navigation in flight; the returned callback ends it. Concurrent
 * navigations are counted, so one finishing cannot hide an indicator another
 * still needs. The timings are parameters only so tests can shrink them — this
 * project's vitest setup hangs on `vi.useRealTimers()`.
 */
export function beginNavigation(delayMs: number = INDICATOR_DELAY_MS, minMs: number = INDICATOR_MIN_MS): () => void {
  inFlight += 1;
  const showTimer = window.setTimeout(() => {
    shownAt = Date.now();
    set(true);
  }, delayMs);

  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    window.clearTimeout(showTimer);
    inFlight -= 1;
    if (inFlight > 0 || shownAt === 0) return;
    window.setTimeout(
      () => {
        if (inFlight > 0) return;
        shownAt = 0;
        set(false);
      },
      Math.max(0, minMs - (Date.now() - shownAt)),
    );
  };
}

export function subscribeNavigationPending(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNavigationPending(): boolean {
  return pending;
}

/** Test seam — resets the module state between cases. */
export function resetNavigationPending(): void {
  pending = false;
  inFlight = 0;
  shownAt = 0;
  listeners.clear();
}
