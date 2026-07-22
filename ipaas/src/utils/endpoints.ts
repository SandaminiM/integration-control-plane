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

import type { EnvEndpoint } from '../types/component';

/**
 * Resolve the URL to invoke an endpoint at, preferring the widest network
 * visibility it is exposed on (Public → Organization → Project), then any URL
 * available. The trailing slash is stripped so a path can be appended cleanly.
 */
export function resolveEndpointInvokeUrl(endpoint: EnvEndpoint | undefined): string {
  if (!endpoint) return '';
  const visibilities = endpoint.networkVisibilities ?? [];
  const preferred: Array<string | null | undefined> = [];
  if (visibilities.includes('Public')) preferred.push(endpoint.publicUrl, endpoint.defaultPublicUrl);
  if (visibilities.includes('Organization')) preferred.push(endpoint.organizationUrl, endpoint.defaultOrganizationUrl);
  if (visibilities.includes('Project')) preferred.push(endpoint.projectUrl);
  const url = [...preferred, endpoint.publicUrl, endpoint.defaultPublicUrl, endpoint.organizationUrl, endpoint.defaultOrganizationUrl, endpoint.projectUrl, endpoint.invokeUrl].find((u) => !!u) ?? '';
  return url.replace(/\/+$/, '');
}
