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

import { choreoClient } from './httpClients';
import type { EgressPolicy, EgressPolicyRequest } from '../../types/egressPolicy';

// Egress policy lives on the devops service (via choreoClient), keyed by org UUID.
// Responses are wrapped in `{ data: ... }`.
const BASE = '/devops/1.0.0/api/v1';
const policyPath = (orgUuid: string) => `${BASE}/organizations/${encodeURIComponent(orgUuid)}/egress-policy`;
// Project-scoped calls add `?project_id={projectId}`; org calls omit it.
const scoped = (path: string, projectId?: string) => (projectId ? `${path}?project_id=${encodeURIComponent(projectId)}` : path);
type Wrapped<T> = { data: T };

export async function fetchEgressPolicy(orgUuid: string, projectId?: string): Promise<EgressPolicy | null> {
  try {
    const res = await choreoClient.get<Wrapped<EgressPolicy>>(scoped(policyPath(orgUuid), projectId));
    return res.data;
  } catch (err) {
    // A 404 means there is no policy yet — a normal empty state, not an error.
    if (err instanceof Error && err.message.includes('HTTP 404')) return null;
    throw err;
  }
}

export async function createEgressPolicy(orgUuid: string, input: EgressPolicyRequest, projectId?: string): Promise<EgressPolicy> {
  const res = await choreoClient.post<Wrapped<EgressPolicy>>(scoped(policyPath(orgUuid), projectId), input);
  return res.data;
}

export async function updateEgressPolicy(orgUuid: string, policyId: string, input: EgressPolicyRequest, projectId?: string): Promise<EgressPolicy> {
  const res = await choreoClient.put<Wrapped<EgressPolicy>>(scoped(`${policyPath(orgUuid)}/${encodeURIComponent(policyId)}`, projectId), input);
  return res.data;
}

export async function deleteEgressPolicy(orgUuid: string, policyId: string, projectId?: string): Promise<void> {
  await choreoClient.delete<void>(scoped(`${policyPath(orgUuid)}/${encodeURIComponent(policyId)}`, projectId));
}
