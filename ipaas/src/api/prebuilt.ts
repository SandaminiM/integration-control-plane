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

import { gql } from './graphql';
import { choreoClient } from './httpClients';
import type { SchemaConfigItem } from '../types/configuration';
import type { PrebuiltIntegration, PrebuiltIntegrationsData } from '../types/prebuilt';

interface NameAvailability {
  componentNameUnique: boolean;
  alternateComponentName: string;
}

interface ComponentDetail {
  id: string;
  handler: string;
  deploymentTracks: { id: string }[];
}

interface Environment {
  id: string;
  templateId?: string;
}

export async function fetchPrebuiltIntegrations(url: string, signal?: AbortSignal): Promise<{ prebuiltIntegrations: PrebuiltIntegration[] }> {
  const response = await fetch(url, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = (await response.json()) as { prebuiltIntegrations: PrebuiltIntegration[] };
  if (!Array.isArray(data?.prebuiltIntegrations)) throw new Error('Invalid response format: missing prebuiltIntegrations array');
  return data;
}

export function normalizePrebuiltIntegrations(raw: { prebuiltIntegrations: PrebuiltIntegration[] }): PrebuiltIntegrationsData {
  const appSet = new Set<string>();
  for (const integration of raw.prebuiltIntegrations) {
    integration.applications?.forEach((app) => appSet.add(app));
  }
  return { prebuiltIntegrations: raw.prebuiltIntegrations, applications: Array.from(appSet).sort() };
}

export async function fetchPrebuiltAsset(baseUrl: string, filename: string, signal?: AbortSignal): Promise<Response> {
  const res = await fetch(`${baseUrl}${filename}`, { cache: 'no-store', signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

export async function checkNameAvailability(projectId: string, candidate: string): Promise<string> {
  const safe = candidate.replace(/["\\\n\r]/g, '');
  const data = await gql<{ componentNameAvailability: NameAvailability }>(`query { componentNameAvailability(projectId: "${projectId}", componentNameCandidate: "${safe}") { componentNameUnique alternateComponentName } }`);
  return data.componentNameAvailability.componentNameUnique ? candidate : data.componentNameAvailability.alternateComponentName;
}

export async function fetchComponentDetail(projectId: string, handler: string): Promise<ComponentDetail> {
  const data = await gql<{ component: ComponentDetail }>(`query { component(projectId: "${projectId}", componentHandler: "${handler}") { id handler deploymentTracks { id } } }`);
  return data.component;
}

export async function fetchFirstEnvironment(orgUuid: string, projectId: string): Promise<Environment> {
  const data = await gql<{ environments: Environment[] }>(`query { environments(orgUuid: "${orgUuid}", type: "external", projectId: "${projectId}") { id templateId } }`);
  const envs = data.environments ?? [];
  if (envs.length === 0) throw new Error('No environments found for this project');
  return envs[0];
}

export async function fetchLatestCommitSha(componentId: string, branch: string): Promise<string> {
  const data = await gql<{ commitHistory: { sha: string; isLatest: boolean }[] }>(`query { commitHistory(componentId: "${componentId}", branch: "${branch}") { sha isLatest } }`);
  const commits = data.commitHistory ?? [];
  const latest = commits.find((c) => c.isLatest) ?? commits[0];
  if (!latest) throw new Error('No commits found');
  return latest.sha;
}

export async function savePrebuiltConfig(projectId: string, componentId: string, envId: string, deploymentTrackId: string, configurations: SchemaConfigItem[], commitHash: string): Promise<void> {
  const configurationsWithEnv = configurations.map((item) => ({
    ...item,
    values: item.values.map((v) => ({ ...v, environmentUuid: envId })),
  }));
  await choreoClient.post(`/configuration-schema/v1.0/projects/${projectId}/components/${componentId}/env-template/${envId}/deployment-track/${deploymentTrackId}/configurations`, { configurations: configurationsWithEnv, commitHash });
}
