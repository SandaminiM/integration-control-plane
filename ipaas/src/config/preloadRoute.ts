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

import { matchRoutes, type RouteObject } from 'react-router';
// Read inside the functions, never at module scope: `routes` statically imports
// the layouts, which reach this module back.
import routes from './routes';

/**
 * Last-resort ceiling, deliberately far above any real load: chunks have been
 * measured at ~15s on 3G and those should still get the clean
 * URL-and-page-together transition rather than being cut off.
 */
const PRELOAD_TIMEOUT_MS = 30000;

type Preloader = () => Promise<unknown>;

interface ElementLike {
  type?: { preload?: Preloader };
  props?: { children?: unknown };
}

/**
 * A route's `preload`, looking through single-child wrappers. Admin and
 * compliance routes render `createElement(RouteErrorBoundary, null, page)`, so
 * the lazy component sits a level below the element's own type. Bounded depth,
 * and multi-child wrappers are skipped since there is no single page to preload.
 */
function preloadOf(element: unknown): Preloader | undefined {
  let node = element as ElementLike | undefined;
  for (let depth = 0; node && depth < 3; depth += 1) {
    if (typeof node.type?.preload === 'function') return node.type.preload;
    const child = node.props?.children;
    node = child && !Array.isArray(child) ? (child as ElementLike) : undefined;
  }
  return undefined;
}

/**
 * The `preload` of every lazy component behind a path, via `lazyPage`. Empty
 * when the destination is already loaded or has no lazy component.
 */
export function collectPreloads(to: string): Preloader[] {
  // matchRoutes only reads path/index/children, so AppRoute satisfies it in
  // practice even though its `element` type differs from RouteObject's.
  const matched = matchRoutes(routes as unknown as RouteObject[], to) ?? [];
  return matched.map((m) => preloadOf(m.route.element)).filter((fn): fn is Preloader => typeof fn === 'function');
}

/**
 * Fetch a path's code so the caller can change the URL and render the page in
 * one step. Resolves on the timeout rather than rejecting: a stalled or broken
 * chunk must still let the navigation through, where Suspense takes over.
 */
export async function preloadRoute(preloaders: Preloader[], timeoutMs: number = PRELOAD_TIMEOUT_MS): Promise<void> {
  if (preloaders.length === 0) return;
  let timer = 0;
  try {
    await Promise.race([Promise.all(preloaders.map((fn) => Promise.resolve().then(fn))), new Promise((resolve) => (timer = window.setTimeout(resolve, timeoutMs)))]).catch(() => undefined);
  } finally {
    // The race leaves the loser running; at 30s a burst of navigations would
    // otherwise hold a timer each.
    window.clearTimeout(timer);
  }
}
