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

import type { Sample } from '../types/samples';
import type { PrebuiltIntegration } from '../types/samples';
import type { PrebuiltIntegrationsData } from '../types/prebuilt';
import type { JSONSchema } from '../components/SchemaConfigForm';

export interface SamplesData {
  samples: Sample[];
  featuredSamples: Sample[];
  uniqueTypes: string[];
  uniqueBuildPacks: string[];
  uniqueTags: string[];
}

/** Fetches and parses the samples manifest from the given URL. */
export async function fetchSamples(url: string, signal?: AbortSignal): Promise<{ samples: Sample[] }> {
  const response = await fetch(url, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = (await response.json()) as { samples: Sample[] };
  if (!Array.isArray(data?.samples)) throw new Error('Invalid response format: missing samples array');
  return data;
}

/** Fetches and parses the prebuilt integrations manifest from the given URL. */
export async function fetchPrebuiltIntegrations(url: string, signal?: AbortSignal): Promise<{ prebuiltIntegrations: PrebuiltIntegration[] }> {
  const response = await fetch(url, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = (await response.json()) as { prebuiltIntegrations: PrebuiltIntegration[] };
  if (!Array.isArray(data?.prebuiltIntegrations)) throw new Error('Invalid response format: missing prebuiltIntegrations array');
  return data;
}

/** Builds a PrebuiltIntegrationsData record from the raw manifest. */
export function normalizePrebuiltIntegrations(raw: { prebuiltIntegrations: PrebuiltIntegration[] }): PrebuiltIntegrationsData {
  const appSet = new Set<string>();
  for (const integration of raw.prebuiltIntegrations) {
    integration.applications?.forEach((app) => appSet.add(app));
  }
  return { prebuiltIntegrations: raw.prebuiltIntegrations, applications: Array.from(appSet).sort() };
}

/** Fetches a prebuilt asset file (instructions, schema, diagram) from the given base URL. */
export async function fetchPrebuiltAsset(baseUrl: string, filename: string, signal?: AbortSignal): Promise<Response> {
  const res = await fetch(`${baseUrl}${filename}`, { cache: 'no-store', signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

export type { PrebuiltIntegrationsData, JSONSchema };
