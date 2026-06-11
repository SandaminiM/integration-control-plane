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

import { useMemo } from 'react';
import { identifyIntegration } from '../utils/identifyIntegration';
import type { Component } from '../types/component';
import type { IntegrationIdentity } from '../types/integration';

/**
 * Resolves a component into its `IntegrationIdentity` and memoises the result
 * across renders. Returns `null` when no component is available yet
 * (loading / not-found cases), so consumers can early-return before rendering.
 *
 * This is a pure derivation — no network, no React Query.
 */
export function useIntegrationIdentity(component: Component | undefined): IntegrationIdentity | null {
  return useMemo(() => {
    if (!component) return null;
    return identifyIntegration(component.displayType ?? '', component.componentSubType ?? null);
  }, [component]);
}
