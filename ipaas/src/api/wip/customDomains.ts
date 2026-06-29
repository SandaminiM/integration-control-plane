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

import { urlManagerClient } from './httpClients';
import type { CreateUrlMappingInput, CustomDomain, CustomDomainType, CustomUrlMapping } from '../../types/customDomain';

// Custom domains + URL mappings live on the Choreo URL-manager service. URLs and
// payloads mirror Devant's `data/api/custom-domains.ts` exactly.

export async function fetchCustomDomains(type?: CustomDomainType): Promise<CustomDomain[]> {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return urlManagerClient.get<CustomDomain[]>(`/domains${qs}`);
}

export async function fetchComponentUrlMappings(componentId: string): Promise<CustomUrlMapping[]> {
  return urlManagerClient.get<CustomUrlMapping[]>(`/url-mappings?componentId=${encodeURIComponent(componentId)}`);
}

export async function createUrlMapping(input: CreateUrlMappingInput): Promise<CustomUrlMapping> {
  return urlManagerClient.post<CustomUrlMapping>('/url-mappings', { status: 'pending', ...input });
}

export async function updateUrlMapping(urlId: string, input: CreateUrlMappingInput): Promise<CustomUrlMapping> {
  return urlManagerClient.post<CustomUrlMapping>(`/url-mappings/${encodeURIComponent(urlId)}`, { status: 'pending', ...input });
}

export async function deleteUrlMapping(urlId: string): Promise<void> {
  await urlManagerClient.delete<void>(`/url-mappings/${encodeURIComponent(urlId)}`);
}
