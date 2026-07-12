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

import { choreoClient, choreoTextClient } from './httpClients';
import type { ExternalCiToken } from '../../types/externalCi';

// External CI tokens live on the devops service. `organization_id` + `project_id`
// query params; responses wrap data in `{ data }`. URLs mirror Devant.
const BASE = '/devops/1.0.0/api/v1';
type Wrapped<T> = { data: T };

function dq(orgUuid: string, projectId: string): string {
  return new URLSearchParams({ organization_id: orgUuid, project_id: projectId }).toString();
}

const tokensPath = (componentId: string): string => `${BASE}/ci/component/${encodeURIComponent(componentId)}/tokens`;

export async function getExternalCiTokens(orgUuid: string, projectId: string, componentId: string): Promise<ExternalCiToken[]> {
  const res = await choreoClient.get<Wrapped<ExternalCiToken[] | null>>(`${tokensPath(componentId)}?${dq(orgUuid, projectId)}`);
  return res.data ?? [];
}

/** Create a token; returns the raw token string (shown to the user only once). */
export async function createExternalCiToken(orgUuid: string, projectId: string, componentId: string, tokenName: string): Promise<string> {
  const res = await choreoClient.post<Wrapped<string>>(`${tokensPath(componentId)}?${dq(orgUuid, projectId)}`, { tokenName });
  return res.data;
}

export async function revokeExternalCiToken(orgUuid: string, projectId: string, componentId: string, tokenId: string): Promise<void> {
  // The revoke endpoint replies with a plain "OK", so use the text-tolerant client.
  await choreoTextClient.delete<void>(`${tokensPath(componentId)}/${encodeURIComponent(tokenId)}/revoke?${dq(orgUuid, projectId)}`, {});
}
