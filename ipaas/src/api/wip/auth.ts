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

import { authClient, userMgtClient } from './httpClients';
import type {
  User,
  Role,
  RoleDetail,
  Group,
  GroupRoleMapping,
  GroupUser,
  Permission,
  PermissionsResponse,
  RoleGroupMapping,
  UserPermissionsResponse,
  ChangePasswordInput,
  ForceChangePasswordInput,
  CreateUserInput,
  UpdateUserInput,
  UpdateUserGroupsInput,
  CreateRoleInput,
  UpdateRoleInput,
  CreateGroupInput,
  UpdateGroupInput,
  AddRolesToGroupInput,
  RemoveRoleFromGroupInput,
  AddUsersToGroupInput,
  RemoveUserFromGroupInput,
  MessageResult,
  ResetPasswordResult,
  PendingInvitation,
  InviteUsersInput,
} from '../../types/auth';

const authGet = <T>(path: string): Promise<T> => authClient.get<T>(path);
const authPost = <T>(path: string, body: unknown): Promise<T> => authClient.post<T>(path, body);
const authPut = <T>(path: string, body: unknown): Promise<T> => authClient.put<T>(path, body);
const authDelete = <T>(path: string): Promise<T> => authClient.delete<T>(path);

// ── Shared gateway user-mgt service (same backend as Devant) ──
// The org member/role/group reads come from `user-mgt/1.0.0`, matching Devant's
// exact endpoints. The raw wire shapes below are private to this file; each
// `to<Domain>` mapper converts them to the app's domain types in src/types/auth.ts.

const umGet = <T>(path: string): Promise<T> => userMgtClient.get<T>(path);
const umPost = <T>(path: string, body: unknown): Promise<T> => userMgtClient.post<T>(path, body);
const umPut = <T>(path: string, body: unknown): Promise<T> => userMgtClient.put<T>(path, body);
const umDelete = <T>(path: string): Promise<T> => userMgtClient.delete<T>(path);

interface RawGroupRef {
  id?: string;
  uuid?: string;
  displayName?: string;
  handle?: string;
  description?: string;
  assignedRoleCount?: number;
}
interface RawUser {
  id?: number;
  idpId: string;
  email: string;
  displayName?: string;
  pictureUrl?: string;
  groups?: RawGroupRef[];
}
interface RawRole {
  uuid: string;
  handle: string;
  displayName: string;
  description?: string;
  assignedGroupCount?: number;
  tags?: { handle: string }[];
}
interface RawPermission {
  id: string;
  handle: string;
  displayName: string;
  domainArea?: string;
  description?: string;
}
interface RawPermissionDomain {
  domain: string;
  list: RawPermission[];
}
interface RawMappingContext {
  orgUUID?: string;
  projectUUID?: string;
  environmentUUID?: string;
  componentUUID?: string;
}
interface RawGroupAssociation {
  groupHandle: string;
  groupUUID: string;
  groupDisplayName: string;
  mappingContext?: RawMappingContext;
}
interface RawRoleAssociation {
  roleHandle: string;
  roleUUID: string;
  roleDisplayName: string;
  mappingContext?: RawMappingContext;
}

const toUser = (r: RawUser): User => ({
  // Devant keys org-member operations by the IdP id; group/role ops by handle.
  userId: r.idpId,
  username: r.email,
  displayName: r.displayName || r.email,
  isSuperAdmin: false,
  isOidcUser: true, // gateway members are IdP-backed, not local credential users
  pictureUrl: r.pictureUrl,
  // Group sub-resource paths key by handle; the user-side body needs the uuid.
  groups: (r.groups ?? []).map((g) => ({ groupId: g.handle ?? g.uuid ?? g.id ?? '', uuid: g.uuid, groupName: g.displayName ?? g.handle ?? '', groupDescription: g.description ?? '' })),
  groupCount: (r.groups ?? []).length,
});

// Roles are addressed by their handle in Devant's paths, so we surface that as the id.
const toRole = (r: RawRole): Role => ({ roleId: r.handle, roleName: r.displayName, description: r.description ?? '', orgId: 0, tags: (r.tags ?? []).map((t) => t.handle) });

// Groups are addressed by their handle in `/groups/v2/{handle}` paths; the uuid is
// kept for the user-side `groupUUIDs` body.
const toGroup = (g: RawGroupRef): Group => ({ groupId: g.handle ?? g.uuid ?? g.id ?? '', uuid: g.uuid, groupName: g.displayName ?? g.handle ?? '', description: g.description ?? '', roleCount: g.assignedRoleCount });

const toPermissions = (domains: RawPermissionDomain[]): PermissionsResponse => {
  const groupedByDomain: Record<string, Permission[]> = {};
  const permissions: Permission[] = [];
  for (const d of domains) {
    const mapped = d.list.map<Permission>((p) => ({ permissionId: p.id, permissionName: p.displayName, permissionDomain: d.domain, resourceType: p.domainArea ?? '', action: '', description: p.description ?? '' }));
    groupedByDomain[d.domain] = mapped;
    permissions.push(...mapped);
  }
  return { permissions, groupedByDomain };
};

// ── Permission fetching ──

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
  return umGet<{ list?: RawUser[] }>(`/orgs/${orgHandler}/users`).then((d) => (d.list ?? []).map(toUser));
}

export function changePassword(input: ChangePasswordInput): Promise<MessageResult> {
  return authPost<MessageResult>('/change-password', input);
}

export function forceChangePassword(input: ForceChangePasswordInput): Promise<MessageResult> {
  return authPost<MessageResult>('/force-change-password', input);
}

export function resetPassword(orgHandler: string, userId: string): Promise<ResetPasswordResult> {
  return authPost<ResetPasswordResult>(`/orgs/${orgHandler}/users/${userId}/reset-password`, {});
}

export function revokeUserTokens(orgHandler: string, userId: string): Promise<MessageResult> {
  return authPost<MessageResult>(`/orgs/${orgHandler}/users/${userId}/revoke-tokens`, {});
}

export function unlockAccount(orgHandler: string, userId: string): Promise<MessageResult> {
  return authPost<MessageResult>(`/orgs/${orgHandler}/users/${userId}/unlock-account`, {});
}

export function createUser(orgHandler: string, input: CreateUserInput): Promise<unknown> {
  return authPost(`/orgs/${orgHandler}/users`, input);
}

export function updateUser(orgHandler: string, input: UpdateUserInput): Promise<unknown> {
  return authPut(`/orgs/${orgHandler}/users/${input.userId}`, { displayName: input.displayName, groupIds: input.groupIds });
}

export function updateUserGroups(orgHandler: string, input: UpdateUserGroupsInput): Promise<unknown> {
  return umPut(`/orgs/${orgHandler}/users/${encodeURIComponent(input.userId)}/groups`, { groupUUIDs: input.groupIds });
}

export function deleteUser(orgHandler: string, userId: string): Promise<unknown> {
  return umDelete(`/orgs/${orgHandler}/users/${userId}`);
}

// ── Invitations ──
// The registered application on the shared backend (same as Devant's invites).
const INVITE_APPLICATION = 'devant';

interface RawInvitation {
  id: number | string;
  email: string;
  groups?: string[];
}

export function fetchPendingInvitations(orgHandler: string): Promise<PendingInvitation[]> {
  return umGet<RawInvitation[] | { list?: RawInvitation[] }>(`/orgs/${orgHandler}/v2/invitations`).then((d) => {
    const list = Array.isArray(d) ? d : (d.list ?? []);
    return list.map((i) => ({ id: String(i.id), email: i.email, groups: i.groups ?? [] }));
  });
}

export function inviteUsers(orgHandler: string, input: InviteUsersInput): Promise<unknown> {
  return umPost(`/orgs/${orgHandler}/v2/invitations`, { application: INVITE_APPLICATION, emails: input.emails, groups: input.groups });
}

export function deleteInvitation(orgHandler: string, invitationId: string): Promise<unknown> {
  return umDelete(`/orgs/${orgHandler}/v2/invitations/${encodeURIComponent(invitationId)}`);
}

// ── Roles ──

export function fetchRoles(orgHandler: string, projectId?: string, integrationId?: string): Promise<Role[]> {
  const params = new URLSearchParams({ limit: '100' });
  if (projectId) params.append('projectId', projectId);
  if (integrationId) params.append('integrationId', integrationId);
  return umGet<{ list?: RawRole[] }>(`/orgs/${orgHandler}/roles/v2?${params.toString()}`).then((d) => (d.list ?? []).map(toRole));
}

export function fetchRoleDetail(orgHandler: string, roleId: string, projectId?: string, integrationId?: string): Promise<RoleDetail> {
  const params = new URLSearchParams({ include: 'permissions' });
  if (projectId) params.append('projectId', projectId);
  if (integrationId) params.append('integrationId', integrationId);
  return umGet<RawRole & { permissions?: RawPermission[] }>(`/orgs/${orgHandler}/roles/v2/${encodeURIComponent(roleId)}?${params.toString()}`).then((r) => ({
    ...toRole(r),
    permissions: (r.permissions ?? []).map<Permission>((p) => ({ permissionId: p.id, permissionName: p.displayName, permissionDomain: p.domainArea ?? '', resourceType: p.domainArea ?? '', action: '', description: p.description ?? '' })),
  }));
}

export function fetchAllPermissions(): Promise<PermissionsResponse> {
  return umGet<RawPermissionDomain[]>('/roles/permissions').then(toPermissions);
}

export function createRole(orgHandler: string, input: CreateRoleInput): Promise<unknown> {
  return authPost(`/orgs/${orgHandler}/roles`, input);
}

export function updateRole(orgHandler: string, input: UpdateRoleInput): Promise<unknown> {
  return authPut(`/orgs/${orgHandler}/roles/${input.roleId}`, { roleName: input.roleName, description: input.description, permissionIds: input.permissionIds });
}

export function deleteRole(orgHandler: string, roleId: string): Promise<unknown> {
  return umDelete(`/orgs/${orgHandler}/roles/v2/${encodeURIComponent(roleId)}`);
}

export function fetchRoleGroups(orgHandler: string, roleId: string, projectId?: string, integrationId?: string): Promise<RoleGroupMapping[]> {
  return umGet<{ groupAssociations?: RawGroupAssociation[] }>(`/orgs/${orgHandler}/roles/v2/${encodeURIComponent(roleId)}/groups${scopedQueryString(projectId, integrationId)}`).then((d) =>
    (d.groupAssociations ?? []).map((a, i) => ({
      id: i,
      groupId: a.groupHandle,
      groupName: a.groupDisplayName,
      roleId,
      orgUuid: a.mappingContext?.orgUUID ?? '',
      projectUuid: a.mappingContext?.projectUUID || null,
      envUuid: a.mappingContext?.environmentUUID || null,
      integrationUuid: a.mappingContext?.componentUUID || null,
    })),
  );
}

// ── Groups ──

export function fetchGroups(orgHandler: string, projectId?: string, integrationId?: string): Promise<Group[]> {
  return umGet<{ list?: RawGroupRef[] }>(`/orgs/${orgHandler}/groups/v2${scopedQueryString(projectId, integrationId)}`).then((d) => (d.list ?? []).map(toGroup));
}

export function createGroup(orgHandler: string, input: CreateGroupInput): Promise<unknown> {
  return umPost(`/orgs/${orgHandler}/groups/v2`, { displayName: input.groupName, description: input.description });
}

export function updateGroup(orgHandler: string, input: UpdateGroupInput): Promise<unknown> {
  return umPut(`/orgs/${orgHandler}/groups/v2/${encodeURIComponent(input.groupId)}`, { displayName: input.groupName, description: input.description });
}

export function deleteGroup(orgHandler: string, groupId: string): Promise<unknown> {
  return umDelete(`/orgs/${orgHandler}/groups/v2/${encodeURIComponent(groupId)}`);
}

export function fetchGroupRoles(orgHandler: string, groupId: string, projectId?: string, integrationId?: string): Promise<GroupRoleMapping[]> {
  return umGet<{ roleAssociations?: RawRoleAssociation[] }>(`/orgs/${orgHandler}/groups/v2/${encodeURIComponent(groupId)}/roles${scopedQueryString(projectId, integrationId)}`).then((d) =>
    (d.roleAssociations ?? []).map((a, i) => ({
      id: i,
      groupId,
      roleId: a.roleHandle,
      roleName: a.roleDisplayName,
      roleDescription: '',
      orgUuid: a.mappingContext?.orgUUID ?? '',
      projectUuid: a.mappingContext?.projectUUID || null,
      envUuid: a.mappingContext?.environmentUUID || null,
      integrationUuid: a.mappingContext?.componentUUID || null,
    })),
  );
}

export function fetchGroupUsers(orgHandler: string, groupId: string): Promise<GroupUser[]> {
  // Members come from the group detail (Devant's group object embeds `users`).
  return umGet<{ users?: RawUser[] }>(`/orgs/${orgHandler}/groups/v2/${encodeURIComponent(groupId)}`).then((d) => (d.users ?? []).map((u) => ({ userId: u.idpId, username: u.email, displayName: u.displayName || u.email })));
}

export function addRolesToGroup(orgHandler: string, input: AddRolesToGroupInput, projectId?: string, componentId?: string): Promise<unknown> {
  const body = {
    roleIds: input.roleIds,
    envUuid: input.envUuid,
    ...(projectId ? { projectUuid: projectId } : {}),
    ...(componentId ? { integrationUuid: componentId } : {}),
  };
  return authPost(`/orgs/${orgHandler}/groups/${input.groupId}/roles`, body);
}

export function removeRoleFromGroup(orgHandler: string, input: RemoveRoleFromGroupInput): Promise<unknown> {
  return authDelete(`/orgs/${orgHandler}/groups/${input.groupId}/roles/${input.mappingId}`);
}

export function addUsersToGroup(orgHandler: string, input: AddUsersToGroupInput): Promise<unknown> {
  return umPost(`/orgs/${orgHandler}/groups/v2/${encodeURIComponent(input.groupId)}/members`, { userIds: input.userIds });
}

export function removeUserFromGroup(orgHandler: string, input: RemoveUserFromGroupInput): Promise<unknown> {
  // Devant removes the user↔group association from the user side (idpId + group id).
  return umDelete(`/orgs/${orgHandler}/users/${input.userId}/groups/${input.groupId}`);
}
