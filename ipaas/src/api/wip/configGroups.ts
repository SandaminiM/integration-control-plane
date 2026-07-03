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

import { choreoClient, withScopeRetry } from './httpClients';
import { gql } from './graphql';
import type { ConfigGroup, ConfigGroupNameAvailability, ConfigGroupUsage, CreateConfigGroupRequest, EditConfigGroupRequest } from '../../types/configGroups';

const BASE = '/config-svc/v1.0/configs/groups';

/** All org-level config groups. */
export function listConfigGroups(): Promise<ConfigGroup[]> {
  return withScopeRetry(() => choreoClient.get<ConfigGroup[]>(BASE));
}

/** A single config group (with its full configurations), for the edit view. */
export function getConfigGroup(groupUuid: string): Promise<ConfigGroup> {
  return withScopeRetry(() => choreoClient.get<ConfigGroup>(`${BASE}/${encodeURIComponent(groupUuid)}`));
}

/** Update an existing config group. */
export function updateConfigGroup(request: EditConfigGroupRequest): Promise<ConfigGroup> {
  return withScopeRetry(() => choreoClient.put<ConfigGroup>(`${BASE}/${encodeURIComponent(request.groupUuid)}`, request));
}

/** Delete a config group. */
export function deleteConfigGroup(groupUuid: string): Promise<void> {
  return withScopeRetry(() => choreoClient.delete(`${BASE}/${encodeURIComponent(groupUuid)}`));
}

const USAGE_QUERY = (id: string): string =>
  `query ConfigGroupUsage { configGroupUsage(configGroupId: "${id}") { configGroupId usageInProjects { projectId projectName projectHandler usageInComponents { componentId componentName componentHandler usageInReleases { envTemplateId envTemplateName } } } } }`;

/** Where a config group is referenced (projects → components → releases). GraphQL. */
export async function getConfigGroupUsage(configGroupId: string): Promise<ConfigGroupUsage> {
  const data = await gql<{ configGroupUsage: ConfigGroupUsage }>(USAGE_QUERY(configGroupId));
  return data.configGroupUsage;
}

/** Whether a candidate group name is free (returns a suggestion when taken). */
export function checkConfigGroupName(candidateGroupName: string): Promise<ConfigGroupNameAvailability> {
  return choreoClient.get<ConfigGroupNameAvailability>(`${BASE}/check-group-name?candidateGroupName=${encodeURIComponent(candidateGroupName)}`);
}

/** Create a config group; the API scopes it to the org and returns the persisted record. */
export function createConfigGroup(request: CreateConfigGroupRequest): Promise<ConfigGroup> {
  return withScopeRetry(() => choreoClient.post<ConfigGroup>(BASE, request));
}
