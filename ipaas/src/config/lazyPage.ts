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

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** A lazy component whose chunk can be fetched before it is rendered. */
// `any` mirrors React's own `lazy` constraint — narrowing it rejects every
// component whose props are not exactly `never`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PreloadableComponent<T extends ComponentType<any>> = LazyExoticComponent<T> & {
  preload: () => Promise<unknown>;
};

/**
 * `React.lazy` plus a `preload()` that fetches the chunk ahead of render, so a
 * navigation can wait for the destination's code and commit the URL and the page
 * together instead of blanking to a Suspense fallback.
 *
 * No memoisation needed: `preload` bypasses React's internal cache, but dynamic
 * `import()` is memoised by the module registry, so repeat calls cost nothing.
 * That holds only while factories stay plain imports — add work inside one and
 * it will run per call.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>): PreloadableComponent<T> {
  const Component = lazy(factory) as PreloadableComponent<T>;
  Component.preload = factory;
  return Component;
}
