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

/** An identity provider (key manager) configured for the organization. */
export interface IdentityProvider {
  id: string;
  name: string;
  type: string; // 'default' | 'Asgardeo' | 'Microsoft' | 'Custom' | 'ChoreoAppDevSTS'
  description: string;
  enabled: boolean;
  tokenType?: string;
  issuer?: string;
  wellKnownEndpoint?: string;
  tokenEndpoint?: string;
  authorizeEndpoint?: string;
  revokeEndpoint?: string;
  logoutEndpoint?: string;
  jwksEndpoint?: string;
  alias?: string;
  certificates?: { type: string; value: string };
  additionalProperties?: Record<string, unknown>;
  scopesClaim?: string;
  consumerKeyClaim?: string;
}

export interface IdentityProviderListResponse {
  count: number;
  list: IdentityProvider[];
}

/** Create/update body for an identity provider (the writable fields, no id). */
export type IdentityProviderRequest = Omit<IdentityProvider, 'id'>;

export interface RoleGroupMappingRole {
  id: string;
  name: string;
  description: string;
  projectId: string;
}

/** A role and the (IdP) groups mapped to it. */
export interface RoleGroupMapping {
  role: RoleGroupMappingRole;
  groups: string[];
}

export interface RoleGroupMappingResponse {
  totalResults: number;
  roleGroupMappings: RoleGroupMapping[];
}

/** An org data plane — its `stsDefaultDomain` is used to build STS endpoint URLs. */
export interface Dataplane {
  id?: string;
  region?: string;
  stsDefaultDomain?: string;
}
