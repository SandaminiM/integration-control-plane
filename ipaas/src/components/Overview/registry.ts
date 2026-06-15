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

import type { IntegrationModule, IntegrationType } from '../../types/integration';

type ModuleLoader = () => Promise<{ default: IntegrationModule }>;

/**
 * Maps each `IntegrationType` to the dynamic import that produces its module.
 * Each entry becomes its own bundle chunk — a user viewing an Automation
 * never downloads the AI Agent / MCP / Tailscale code.
 *
 * Phase 0: every entry points to `UnsupportedFallback` so the dispatcher is
 * safe to wire in without breaking any existing render. Each subsequent
 * phase replaces a single entry with the real module:
 *
 *   - Phase 1 ✅ 'automation'         → './automation'
 *   - Phase 2 ✅ 'integration-as-api' → './integration-as-api'
 *   - Phase 3 ✅ 'file-integration'   → './file-integration'
 *   - ...     etc.
 *
 * Using a `Record<IntegrationType, ModuleLoader>` (not `Partial<>`) means
 * the compiler enforces an entry for every type — adding a new type to the
 * union and forgetting to register it here is a build error.
 */
export const integrationModuleLoaders: Record<IntegrationType, ModuleLoader> = {
  'integration-as-api': () => import('./integration-as-api'),
  webhook: () => import('./_shared/UnsupportedFallback'),
  automation: () => import('./automation'),
  'file-integration': () => import('./file-integration'),
  'event-integration': () => import('./event-integration'),
  'ai-agent': () => import('./ai-agent'),
  'mcp-server': () => import('./_shared/UnsupportedFallback'),
  'mcp-proxy': () => import('./_shared/UnsupportedFallback'),
  'tailscale-vpn': () => import('./_shared/UnsupportedFallback'),
  unsupported: () => import('./_shared/UnsupportedFallback'),
};
