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

import { choreoClient, choreoClientTolerant, withScopeRetry } from './httpClients';
import { ConnectionType } from '../../types/connections';
import type {
  ChoreoConnectionRequest,
  Connection,
  ConnectionCatalogResponse,
  ConnectionListingRecord,
  ConnectionRequest,
  ConnectionServiceIdl,
  ConnectionUpdatePayload,
  DeleteConnectionParams,
  EnvKeyRotationParams,
  ListCatalogParams,
  ListConnectionsParams,
  ResourceConnectionRequest,
  RotateConnectionKeysByConnectionIdParams,
} from '../../types/connections';

/**
 * Dependency-config service, shared with Devant. `choreoClient` already targets the platform
 * API gateway (`window.API_CONFIG.choreoBaseApiUrl`), so only the service path is needed here.
 */
const BASE = '/connections/v1/configurations/service-configs';
const MARKETPLACE = '/marketplace/0.1.0';

/** Build a `?a=b&c=d` string, dropping empty/undefined values. */
function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')}`;
}

/** All connections visible in a project (or a component, when `componentId` is set). */
export function listConnections(params: ListConnectionsParams): Promise<ConnectionListingRecord[]> {
  const { projectId, componentId, scope, resolveServiceName } = params;
  return withScopeRetry(() => choreoClient.get<ConnectionListingRecord[]>(`${BASE}/connections${qs({ projectId, componentId, scope, resolveServiceName })}`));
}

/**
 * Browse the marketplace catalog of connectable items. `kind` selects the facet
 * (services / databases / resources); `filters` carries facet-specific query params.
 */
export function listConnectionCatalog(params: ListCatalogParams): Promise<ConnectionCatalogResponse> {
  const { kind, projectId, offset = 0, limit = 20, search, filters } = params;
  const query = qs({
    networkVisibilityFilter: 'public,org,project',
    networkVisibilityprojectId: projectId,
    offset,
    limit,
    sortBy: 'createdTime',
    sortAscending: false,
    searchContent: false,
    aggregateByMajorVersion: kind === 'services',
    includeCreated: false,
    ...(search ? { searchValue: search } : {}),
    ...filters,
  });
  return withScopeRetry(() => choreoClient.get<ConnectionCatalogResponse>(`${MARKETPLACE}/${kind}${query}`));
}

/** A catalog service's API definition (OpenAPI/Swagger), for the detail drawer's API Definition tab. */
export async function getConnectionServiceIdl(serviceId: string): Promise<ConnectionServiceIdl> {
  const raw = await withScopeRetry(() => choreoClient.get<{ content: unknown; idlType?: string; environmentId?: string }>(`${MARKETPLACE}/services/${encodeURIComponent(serviceId)}/idl`));
  return {
    content: typeof raw.content === 'string' ? raw.content : JSON.stringify(raw.content ?? '', null, 2),
    idlType: raw.idlType,
    environmentId: raw.environmentId,
  };
}

/** A single fully-resolved connection (for the detail/edit view). */
export function getConnection(groupUuid: string): Promise<Connection> {
  return withScopeRetry(() => choreoClient.get<Connection>(`${BASE}/connections/${encodeURIComponent(groupUuid)}`));
}

/** Create an in-platform (Choreo service) connection. `generateCreds` requests credential generation. */
export function createChoreoConnection(request: ChoreoConnectionRequest, generateCreds = true): Promise<Connection> {
  return withScopeRetry(() => choreoClient.post<Connection>(`${BASE}/choreo-connections${qs({ generateCreds })}`, request));
}

/** Create a resource (storage/messaging) connection via the unified endpoint. */
export function createResourceConnection(request: ResourceConnectionRequest): Promise<Connection> {
  return withScopeRetry(() => choreoClient.post<Connection>(`${BASE}/connections`, request));
}

/** Create a third-party (well-known) service connection with per-environment configuration. */
export function createThirdPartyConnection(request: ConnectionRequest): Promise<Connection> {
  return withScopeRetry(() => choreoClient.post<Connection>(`${BASE}/third-party-connections${qs({ wellKnownService: true })}`, request));
}

/** Create a connection to a platform database, mapping a resource + credential per environment. */
export function createDatabaseConnection(request: ResourceConnectionRequest): Promise<Connection> {
  return withScopeRetry(() => choreoClient.post<Connection>(`${BASE}/choreo-database-connections`, request));
}

/** Update an existing connection's configuration. */
export function updateConnection(payload: ConnectionUpdatePayload): Promise<Connection> {
  return withScopeRetry(() => choreoClient.put<Connection>(`${BASE}/connections/${encodeURIComponent(payload.configGroupId)}`, payload.connRequest));
}

/** Delete a connection. Database connections use a distinct route. */
export function deleteConnection({ groupUuid, connType }: DeleteConnectionParams): Promise<void> {
  const path = connType === ConnectionType.DATABASE ? `${BASE}/choreo-database-connections/${encodeURIComponent(groupUuid)}` : `${BASE}/choreo-connections/${encodeURIComponent(groupUuid)}`;
  return withScopeRetry(() => choreoClientTolerant.delete<void>(path));
}

/** Regenerate a connection's configuration (re-resolves upstream service config). */
export function refreshConnection(connectionId: string): Promise<Connection> {
  return withScopeRetry(() => choreoClient.post<Connection>(`${BASE}/choreo-connections/refresh/${encodeURIComponent(connectionId)}`, {}));
}

/** Rotate environment keys for every connection in an environment. */
export function rotateConnectionEnvKeys(params: EnvKeyRotationParams): Promise<void> {
  return withScopeRetry(() => choreoClient.post<void>(`${BASE}/choreo-connections/rotate-keys${qs({ ...params })}`, {}));
}

/** Rotate environment keys for one connection. */
export function rotateConnectionKeysById(params: RotateConnectionKeysByConnectionIdParams): Promise<Connection> {
  const { connectionId, environmentId } = params;
  return withScopeRetry(() => choreoClient.post<Connection>(`${BASE}/connections/${encodeURIComponent(connectionId)}/rotate-keys${qs({ environmentId })}`, {}));
}
