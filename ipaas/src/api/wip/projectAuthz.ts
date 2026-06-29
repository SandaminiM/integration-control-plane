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
import type { AuthzRole, CreateAuthzRoleInput, UpdateAuthzRoleInput } from '../../types/projectAuthz';

// Project authorization roles live on the authz-mgt service (choreo gateway),
// which takes the org from the token. Roles are filtered by project — matching
// Devant's call: `?filter=projectId+eq+{projectId}` (URLSearchParams encodes the
// spaces as `+`).
const AUTHZ = '/authz-mgt/v1.0';

// ── Wire shapes (kept private; mapped to domain types below) ──
interface RawScopeRef {
  name?: string;
  scope?: string;
  displayName?: string;
  description?: string;
}

interface RawAuthzRole {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
  projectId?: string;
  scopes?: Array<string | RawScopeRef>;
}

const scopeName = (s: string | RawScopeRef): string => (typeof s === 'string' ? s : (s.name ?? s.scope ?? ''));

const toAuthzRole = (r: RawAuthzRole, projectId: string): AuthzRole => ({
  id: r.id,
  name: r.name ?? r.displayName ?? '',
  description: r.description ?? '',
  projectId: r.projectId ?? projectId,
  scopes: (r.scopes ?? []).map(scopeName).filter(Boolean),
});

export async function fetchAuthzRoles(projectId: string): Promise<AuthzRole[]> {
  const qs = new URLSearchParams({ filter: `projectId eq ${projectId}` }).toString();
  const res = await choreoClient.get<{ list?: RawAuthzRole[] } | RawAuthzRole[]>(`${AUTHZ}/roles?${qs}`);
  const list = Array.isArray(res) ? res : (res.list ?? []);
  return list.map((r) => toAuthzRole(r, projectId));
}

export async function createAuthzRole(projectId: string, input: CreateAuthzRoleInput): Promise<AuthzRole> {
  const res = await choreoClient.post<RawAuthzRole>(`${AUTHZ}/roles`, {
    name: input.name,
    description: input.description,
    projectId,
    scopes: input.scopes,
  });
  return toAuthzRole(res, projectId);
}

export async function updateAuthzRole(projectId: string, input: UpdateAuthzRoleInput): Promise<AuthzRole> {
  const res = await choreoClient.put<RawAuthzRole>(`${AUTHZ}/roles/${encodeURIComponent(input.roleId)}`, {
    name: input.name,
    description: input.description,
    projectId,
    scopes: input.scopes,
  });
  return toAuthzRole(res, projectId);
}

export async function deleteAuthzRole(roleId: string): Promise<void> {
  await choreoClient.delete<void>(`${AUTHZ}/roles/${encodeURIComponent(roleId)}`);
}
