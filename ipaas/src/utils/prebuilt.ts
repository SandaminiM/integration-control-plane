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

import { toHandler } from './string';
import type { PrebuiltIntegration } from '../types/samples';

const VALID_HANDLER = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

/**
 * Derives a URL/component-name slug from a prebuilt integration.
 * Prefers the last path segment of componentPath when it is a valid handler;
 * falls back to a sanitised version of displayName.
 */
export function derivePrebuiltSlug(integration: PrebuiltIntegration): string {
  const fromPath = integration.componentPath.split('/').pop() ?? '';
  if (fromPath.length >= 3 && VALID_HANDLER.test(fromPath)) {
    return fromPath.slice(0, 25);
  }
  return toHandler(integration.displayName).slice(0, 25);
}

/**
 * Builds the raw.githubusercontent.com base URL for an integration's .choreo/ directory.
 */
export function getDotChoreoBaseUrl(integration: PrebuiltIntegration): string {
  const url = new URL(integration.repositoryUrl);
  url.hostname = 'raw.githubusercontent.com';
  url.pathname += `${integration.branch ?? 'main'}${integration.componentPath}/.choreo/`;
  return url.toString();
}
