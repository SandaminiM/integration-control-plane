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
import { lazyPage } from './lazyPage';

const Page = () => null;

describe('lazyPage', () => {
  it('exposes a preload that runs the factory', async () => {
    const factory = vi.fn(async () => ({ default: Page }));
    const C = lazyPage(factory);

    expect(factory).not.toHaveBeenCalled();
    await expect(C.preload()).resolves.toEqual({ default: Page });
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('still renders as a lazy component', () => {
    const C = lazyPage(async () => ({ default: Page }));
    // `$$typeof` marks it as a React lazy element type rather than a plain function.
    expect(typeof C).toBe('object');
    expect(typeof C.preload).toBe('function');
  });

  it('tolerates repeat preloads — dynamic import dedupes, so extra calls are free', async () => {
    const factory = vi.fn(async () => ({ default: Page }));
    const C = lazyPage(factory);

    await Promise.all([C.preload(), C.preload(), C.preload()]);
    // Deliberately not memoised: the guarantee is that repeat calls are harmless,
    // not that the factory runs once.
    expect(factory).toHaveBeenCalledTimes(3);
  });
});
