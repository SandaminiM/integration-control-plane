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

// TODO: implement using icp APIs
const ni = (name: string): never => { throw new Error(`[icp] auth.${name}: not implemented`); };

export const fetchOrgPermissions = (..._args: unknown[]): never => ni('fetchOrgPermissions');
export const fetchProjectPermissions = (..._args: unknown[]): never => ni('fetchProjectPermissions');
export const fetchComponentPermissions = (..._args: unknown[]): never => ni('fetchComponentPermissions');
export const fetchCurrentUser = (..._args: unknown[]): never => ni('fetchCurrentUser');
export const fetchUsers = (..._args: unknown[]): never => ni('fetchUsers');
export const changePassword = (..._args: unknown[]): never => ni('changePassword');
export const forceChangePassword = (..._args: unknown[]): never => ni('forceChangePassword');
export const resetPassword = (..._args: unknown[]): never => ni('resetPassword');
export const revokeUserTokens = (..._args: unknown[]): never => ni('revokeUserTokens');
export const unlockAccount = (..._args: unknown[]): never => ni('unlockAccount');
export const createUser = (..._args: unknown[]): never => ni('createUser');
export const updateUser = (..._args: unknown[]): never => ni('updateUser');
export const updateUserGroups = (..._args: unknown[]): never => ni('updateUserGroups');
export const deleteUser = (..._args: unknown[]): never => ni('deleteUser');
export const fetchRoles = (..._args: unknown[]): never => ni('fetchRoles');
export const fetchRoleDetail = (..._args: unknown[]): never => ni('fetchRoleDetail');
export const fetchAllPermissions = (..._args: unknown[]): never => ni('fetchAllPermissions');
export const createRole = (..._args: unknown[]): never => ni('createRole');
export const updateRole = (..._args: unknown[]): never => ni('updateRole');
export const deleteRole = (..._args: unknown[]): never => ni('deleteRole');
export const fetchRoleGroups = (..._args: unknown[]): never => ni('fetchRoleGroups');
export const fetchGroups = (..._args: unknown[]): never => ni('fetchGroups');
export const createGroup = (..._args: unknown[]): never => ni('createGroup');
export const updateGroup = (..._args: unknown[]): never => ni('updateGroup');
export const deleteGroup = (..._args: unknown[]): never => ni('deleteGroup');
export const fetchGroupRoles = (..._args: unknown[]): never => ni('fetchGroupRoles');
export const fetchGroupUsers = (..._args: unknown[]): never => ni('fetchGroupUsers');
export const addRolesToGroup = (..._args: unknown[]): never => ni('addRolesToGroup');
export const removeRoleFromGroup = (..._args: unknown[]): never => ni('removeRoleFromGroup');
export const addUsersToGroup = (..._args: unknown[]): never => ni('addUsersToGroup');
export const removeUserFromGroup = (..._args: unknown[]): never => ni('removeUserFromGroup');
