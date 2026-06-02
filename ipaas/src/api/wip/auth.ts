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

import { authClient } from './httpClients';
import type { User, Role, RoleDetail, Group, GroupRoleMapping, GroupUser, PermissionsResponse, RoleGroupMapping } from '../../types/auth';

// Types moved to src/types/auth — re-exported here for backward compatibility

const authGet = <T>(path: string): Promise<T> => authClient.get<T>(path);
const authPost = <T>(path: string, body: unknown): Promise<T> => authClient.post<T>(path, body);
const authPut = <T>(path: string, body: unknown): Promise<T> => authClient.put<T>(path, body);
const authDelete = <T>(path: string): Promise<T> => authClient.delete<T>(path);

// ── Permission fetching ──

interface UserPermissionsResponse {
  userId: string;
  scope: { orgUuid: string; projectUuid?: string; integrationUuid?: string; envUuid?: string };
  permissions: { permissionId: number; permissionName: string; permissionDomain: string; description: string }[];
  permissionNames: string[];
}

export function fetchOrgPermissions(orgHandle: string, userId: string): Promise<UserPermissionsResponse> {
  return authGet<UserPermissionsResponse>(`/orgs/${orgHandle}/users/${userId}/permissions`);
}

export function fetchProjectPermissions(orgHandle: string, userId: string, projectId: string): Promise<UserPermissionsResponse> {
  return authGet<UserPermissionsResponse>(`/orgs/${orgHandle}/users/${userId}/permissions?projectId=${projectId}`);
}

export function fetchComponentPermissions(orgHandle: string, userId: string, projectId: string, componentId: string): Promise<UserPermissionsResponse> {
  return authGet<UserPermissionsResponse>(`/orgs/${orgHandle}/users/${userId}/permissions?projectId=${projectId}&integrationId=${componentId}`);
}

function scopedQueryString(projectId?: string, integrationId?: string): string {
  const params = new URLSearchParams();
  if (projectId) params.append('projectId', projectId);
  if (integrationId) params.append('integrationId', integrationId);
  const s = params.toString();
  return s ? `?${s}` : '';
}

// ── Users ──

export function fetchCurrentUser(orgHandler: string, userId: string): Promise<User> {
  return authGet<User>(`/orgs/${orgHandler}/users/${userId}`);
}

export function fetchUsers(orgHandler: string): Promise<User[]> {
  return authGet<{ users: User[]; count: number }>(`/orgs/${orgHandler}/users`).then((d) => d.users);
}

export function changePassword(input: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
  return authPost<{ message: string }>('/change-password', input);
}

export function forceChangePassword(input: { newPassword: string }): Promise<{ message: string }> {
  return authPost<{ message: string }>('/force-change-password', input);
}

export function resetPassword(orgHandler: string, userId: string): Promise<{ password: string; message: string }> {
  return authPost<{ password: string; message: string }>(`/orgs/${orgHandler}/users/${userId}/reset-password`, {});
}

export function revokeUserTokens(orgHandler: string, userId: string): Promise<{ message: string }> {
  return authPost<{ message: string }>(`/orgs/${orgHandler}/users/${userId}/revoke-tokens`, {});
}

export function unlockAccount(orgHandler: string, userId: string): Promise<{ message: string }> {
  return authPost<{ message: string }>(`/orgs/${orgHandler}/users/${userId}/unlock-account`, {});
}

export function createUser(orgHandler: string, input: { username: string; displayName: string; password: string }): Promise<unknown> {
  return authPost(`/orgs/${orgHandler}/users`, input);
}

export function updateUser(orgHandler: string, input: { userId: string; displayName: string; groupIds: string[] }): Promise<unknown> {
  return authPut(`/orgs/${orgHandler}/users/${input.userId}`, { displayName: input.displayName, groupIds: input.groupIds });
}

export function updateUserGroups(orgHandler: string, input: { userId: string; groupIds: string[] }): Promise<unknown> {
  return authPut(`/orgs/${orgHandler}/users/${input.userId}/groups`, { groupIds: input.groupIds });
}

export function deleteUser(orgHandler: string, userId: string): Promise<unknown> {
  return authDelete(`/orgs/${orgHandler}/users/${userId}`);
}

// ── Roles ──

export function fetchRoles(orgHandler: string, projectId?: string, integrationId?: string): Promise<Role[]> {
  return authGet<Role[]>(`/orgs/${orgHandler}/roles${scopedQueryString(projectId, integrationId)}`);
}

export function fetchRoleDetail(orgHandler: string, roleId: string, projectId?: string, integrationId?: string): Promise<RoleDetail> {
  return authGet<RoleDetail>(`/orgs/${orgHandler}/roles/${roleId}${scopedQueryString(projectId, integrationId)}`);
}

export function fetchAllPermissions(): Promise<PermissionsResponse> {
  return authGet<PermissionsResponse>('/permissions');
}

export function createRole(orgHandler: string, input: { roleName: string; description: string; permissionIds: string[] }): Promise<unknown> {
  return authPost(`/orgs/${orgHandler}/roles`, input);
}

export function updateRole(orgHandler: string, input: { roleId: string; roleName: string; description: string; permissionIds: string[] }): Promise<unknown> {
  return authPut(`/orgs/${orgHandler}/roles/${input.roleId}`, { roleName: input.roleName, description: input.description, permissionIds: input.permissionIds });
}

export function deleteRole(orgHandler: string, roleId: string): Promise<unknown> {
  return authDelete(`/orgs/${orgHandler}/roles/${roleId}`);
}

export function fetchRoleGroups(orgHandler: string, roleId: string, projectId?: string, integrationId?: string): Promise<RoleGroupMapping[]> {
  return authGet<{ mappings: RoleGroupMapping[] }>(`/orgs/${orgHandler}/roles/${roleId}/groups${scopedQueryString(projectId, integrationId)}`).then((d) => d.mappings ?? []);
}

// ── Groups ──

export function fetchGroups(orgHandler: string, projectId?: string, integrationId?: string): Promise<Group[]> {
  return authGet<Group[]>(`/orgs/${orgHandler}/groups${scopedQueryString(projectId, integrationId)}`);
}

export function createGroup(orgHandler: string, input: { groupName: string; description: string }): Promise<unknown> {
  return authPost(`/orgs/${orgHandler}/groups`, input);
}

export function updateGroup(orgHandler: string, input: { groupId: string; groupName: string; description: string }): Promise<unknown> {
  return authPut(`/orgs/${orgHandler}/groups/${input.groupId}`, { groupName: input.groupName, description: input.description });
}

export function deleteGroup(orgHandler: string, groupId: string): Promise<unknown> {
  return authDelete(`/orgs/${orgHandler}/groups/${groupId}`);
}

export function fetchGroupRoles(orgHandler: string, groupId: string, projectId?: string, integrationId?: string): Promise<GroupRoleMapping[]> {
  return authGet<{ mappings: GroupRoleMapping[] }>(`/orgs/${orgHandler}/groups/${groupId}/roles${scopedQueryString(projectId, integrationId)}`).then((d) => d.mappings ?? []);
}

export function fetchGroupUsers(orgHandler: string, groupId: string): Promise<GroupUser[]> {
  return authGet<{ users: GroupUser[] }>(`/orgs/${orgHandler}/groups/${groupId}/users`).then((d) => d.users ?? []);
}

export function addRolesToGroup(orgHandler: string, input: { groupId: string; roleIds: string[]; envUuid?: string }, projectId?: string, componentId?: string): Promise<unknown> {
  const body = {
    roleIds: input.roleIds,
    envUuid: input.envUuid,
    ...(projectId ? { projectUuid: projectId } : {}),
    ...(componentId ? { integrationUuid: componentId } : {}),
  };
  return authPost(`/orgs/${orgHandler}/groups/${input.groupId}/roles`, body);
}

export function removeRoleFromGroup(orgHandler: string, input: { groupId: string; mappingId: number }): Promise<unknown> {
  return authDelete(`/orgs/${orgHandler}/groups/${input.groupId}/roles/${input.mappingId}`);
}

export function addUsersToGroup(orgHandler: string, input: { groupId: string; userIds: string[] }): Promise<unknown> {
  return authPost(`/orgs/${orgHandler}/groups/${input.groupId}/users`, { userIds: input.userIds });
}

export function removeUserFromGroup(orgHandler: string, input: { groupId: string; userId: string }): Promise<unknown> {
  return authDelete(`/orgs/${orgHandler}/groups/${input.groupId}/users/${input.userId}`);
}
