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
import { authenticatedFetch } from '../auth/tokenManager';
import type { SchemaConfigItem } from './queries';

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

export async function checkNameAvailability(projectId: string, candidate: string): Promise<string> {
  const safe = candidate.replace(/["\\\n\r]/g, '');
  const data = await gql<{ componentNameAvailability: NameAvailability }>(
    `query { componentNameAvailability(projectId: "${projectId}", componentNameCandidate: "${safe}") { componentNameUnique alternateComponentName } }`,
  );
  return data.componentNameAvailability.componentNameUnique ? candidate : data.componentNameAvailability.alternateComponentName;
}

export async function fetchComponentDetail(projectId: string, handler: string): Promise<ComponentDetail> {
  const data = await gql<{ component: ComponentDetail }>(
    `query { component(projectId: "${projectId}", componentHandler: "${handler}") { id handler deploymentTracks { id } } }`,
  );
  return data.component;
}

export async function fetchFirstEnvironment(orgUuid: string, projectId: string): Promise<Environment> {
  const data = await gql<{ environments: Environment[] }>(
    `query { environments(orgUuid: "${orgUuid}", type: "external", projectId: "${projectId}") { id templateId } }`,
  );
  const envs = data.environments ?? [];
  if (envs.length === 0) throw new Error('No environments found for this project');
  return envs[0];
}

export async function fetchLatestCommitSha(componentId: string, branch: string): Promise<string> {
  const data = await gql<{ commitHistory: { sha: string; isLatest: boolean }[] }>(
    `query { commitHistory(componentId: "${componentId}", branch: "${branch}") { sha isLatest } }`,
  );
  const commits = data.commitHistory ?? [];
  const latest = commits.find((c) => c.isLatest) ?? commits[0];
  if (!latest) throw new Error('No commits found');
  return latest.sha;
}

export async function savePrebuiltConfig(
  projectId: string,
  componentId: string,
  envId: string,
  deploymentTrackId: string,
  configurations: SchemaConfigItem[],
  commitHash: string,
): Promise<void> {
  let base: string;
  try {
    base = new URL(window.API_CONFIG.graphqlUrl).origin;
  } catch {
    throw new Error('API configuration is missing or invalid: graphqlUrl is not a valid URL');
  }
  const url = `${base}/configuration-schema/v1.0/projects/${projectId}/components/${componentId}/env-template/${envId}/deployment-track/${deploymentTrackId}/configurations`;
  const configurationsWithEnv = configurations.map((item) => ({
    ...item,
    values: item.values.map((v) => ({ ...v, environmentUuid: envId })),
  }));
  const res = await authenticatedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ configurations: configurationsWithEnv, commitHash }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Config save HTTP ${res.status}`);
  }
}
