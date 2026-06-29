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

/**
 * Project-level Application Security: authorization roles (authz-mgt) bound to
 * the API scopes a project may consume. Distinct from Access Control roles —
 * these gate machine-to-machine API access, not console permissions.
 */

/** An authorization role scoped to a project, carrying a set of API scopes. */
export interface AuthzRole {
  id: string;
  name: string;
  description: string;
  projectId: string;
  /** Scope names assigned to the role. */
  scopes: string[];
}

/** Payload to create a project authz role. */
export interface CreateAuthzRoleInput {
  name: string;
  description: string;
  scopes: string[];
}

/** Payload to update a project authz role. */
export interface UpdateAuthzRoleInput {
  roleId: string;
  name: string;
  description: string;
  scopes: string[];
}
