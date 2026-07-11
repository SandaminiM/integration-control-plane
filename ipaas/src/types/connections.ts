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
 * Domain types for the Connections feature (project/component admin surface).
 *
 * Wire field names mirror the dependency-config service (`/connections/v1/configurations/service-configs`)
 * exactly, since request/response bodies are shared with Devant's backend. Ported from Devant's
 * `types/generated/connections/models/*` and flattened out of the OpenAPI allOf splits.
 */

/** Kind of thing a connection points at. Mirrors Devant's `ConnectionTypes` enum. */
export const ConnectionType = {
  CHOREO_SERVICE: 'CHOREO_SERVICE',
  DATABASE: 'DATABASE',
  THIRD_PARTY_SERVICE: 'THIRD_PARTY_SERVICE',
  STORAGE: 'STORAGE',
  CHOREO_CONFIGURATION_GROUP: 'CHOREO_CONFIGURATION_GROUP',
} as const;
export type ConnectionType = (typeof ConnectionType)[keyof typeof ConnectionType];

/** Listing/marketplace resource type string (SERVICE | DATABASE | STORAGE | …). */
export type ConnectionResourceType = string;

/** Visibility (access mode) of a connection — org-, project- or component-scoped. */
export interface VisibilityOrganization {
  organizationUuid: string;
}
export interface VisibilityProject {
  organizationUuid: string;
  projectUuid: string;
}
export interface VisibilityComponent {
  organizationUuid: string;
  projectUuid: string;
  componentUuid: string;
}
export type ConfigVisibility = VisibilityOrganization | VisibilityProject | VisibilityComponent;

/** A single connection config key-value pair. */
export interface ConfigKeyEntry {
  key: string;
  keyUuid?: string;
  value: string;
  isSensitive: boolean;
  isFile: boolean;
}

/** Connection config scoped to one environment. */
export interface EnvConnectionConfig {
  environmentUuid: string;
  isCritical?: boolean;
  entries: Record<string, ConfigKeyEntry>;
}

/** Reference to a platform resource (database/storage) the connection maps to per environment. */
export interface ResourceReference {
  resourceId: string;
  parameterReference: string;
}

/** Fields shared by every connection request and the persisted connection. */
export interface ConnectionMetadata {
  name: string;
  description?: string;
  schemaReference: string;
  visibilities: ConfigVisibility[];
  serviceId: string;
}

/**
 * One entry in the connections listing (`GET .../connections`). Richer than a bare
 * connection because the service resolves `serviceName`/`schemaName` for display.
 */
export interface ConnectionListingRecord {
  name: string;
  description: string | null;
  groupUuid: string;
  schemaReference: string;
  serviceId: string;
  serviceName?: string;
  schemaName?: string;
  isPartiallyCreated?: boolean;
  status?: unknown;
  componentId: string | null;
  dependentComponentId: string | null;
  version?: string;
  resourceType: ConnectionResourceType | null;
}

/** A fully-resolved connection (`GET .../connections/{groupUuid}`). */
export interface Connection extends ConnectionMetadata {
  groupUuid: string;
  serviceName: string;
  schemaName: string;
  status?: unknown;
  isPartiallyCreated: boolean;
  resourceType?: ConnectionResourceType | null;
  configurations: Record<string, EnvConnectionConfig>;
  envMapping: Record<string, ResourceReference>;
}

/** Visibility of the requesting service on a Choreo (in-platform) connection. */
export const RequestingServiceVisibility = {
  Public: 'PUBLIC',
  Organization: 'ORGANIZATION',
  Project: 'PROJECT',
} as const;
export type RequestingServiceVisibility = (typeof RequestingServiceVisibility)[keyof typeof RequestingServiceVisibility];

/** Component-type marker sent on create; project-level connections use `non-component`. */
export const ConnectionComponentType = {
  SERVICE: 'service',
  WEBAPP: 'web-app',
  EXTERNAL_CONSUMER: 'external-consumer',
  NON_COMPONENT: 'non-component',
} as const;
export type ConnectionComponentType = (typeof ConnectionComponentType)[keyof typeof ConnectionComponentType];

/** Per-environment target on a Choreo connection create request. */
export interface ChoreoConnectionEnvironment {
  /** Environment template id. */
  id: string;
  isCritical: boolean;
  /** Provider environment id (usually equal to `id`). */
  providerEnvId: string;
}

/** Create body for an in-platform (Choreo service) connection → `POST .../choreo-connections`. */
export interface ChoreoConnectionRequest extends ConnectionMetadata {
  requestingServiceVisibility: RequestingServiceVisibility;
  orgIdInteger: number;
  environments: ChoreoConnectionEnvironment[];
  componentType?: ConnectionComponentType | string;
}

/** Create body for a resource (database/storage/messaging) connection → `POST .../connections`. */
export interface ResourceConnectionRequest extends ConnectionMetadata {
  envMapping: Record<string, ResourceReference>;
  componentType?: ConnectionComponentType | string;
}

/** Full connection request body (third-party create + updates). */
export interface ConnectionRequest extends ConnectionMetadata {
  configurations: Record<string, EnvConnectionConfig>;
  envMapping: Record<string, ResourceReference>;
  componentType?: ConnectionComponentType | string;
}

/** Update payload → `PUT .../connections/{configGroupId}`. */
export interface ConnectionUpdatePayload {
  connRequest: ConnectionRequest;
  configGroupId: string;
}

/** Scope of a project-level connections listing. */
export const ConnectionScope = {
  PROJECT: 'PROJECT',
  COMPONENT: 'COMPONENT',
} as const;
export type ConnectionScope = (typeof ConnectionScope)[keyof typeof ConnectionScope];

/** Query inputs for the connections listing endpoint. */
export interface ListConnectionsParams {
  projectId: string;
  componentId?: string;
  scope?: ConnectionScope;
  resolveServiceName?: boolean;
}

/** Delete input — the resource type selects the delete route. */
export interface DeleteConnectionParams {
  groupUuid: string;
  connType: ConnectionType;
}

/** Env-key rotation for all connections in an environment → `POST .../choreo-connections/rotate-keys`. */
export interface EnvKeyRotationParams {
  environmentId: string;
  projectId: string;
  componentId?: string;
}

/** Env-key rotation for a single connection → `POST .../connections/{connectionId}/rotate-keys`. */
export interface RotateConnectionKeysByConnectionIdParams {
  connectionId: string;
  environmentId: string;
}

/* ── Marketplace catalog (the "what can I connect to" source) ───────────────────────────────
 * The connection create wizard browses the marketplace (`/marketplace/0.1.0/{services,databases,resources}`)
 * and renders the chosen item's `connectionSchemas[].entries` as the config form. */

/** One config field in a connection schema. */
export interface ConnectionSchemaEntry {
  name: string;
  type: string;
  description?: string;
  isSensitive: boolean;
  isOptional: boolean;
}

/** An authentication/config schema offered by a catalog service. */
export interface ConnectionSchema {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  entries: ConnectionSchemaEntry[];
}

/** A connectable item in the marketplace catalog (service/database/resource). */
export interface ConnectionCatalogItem {
  serviceId: string;
  resourceId?: string;
  name: string;
  version?: string;
  summary?: string;
  description?: string;
  serviceType?: string;
  resourceType?: string;
  status?: string;
  isThirdParty?: boolean;
  visibility?: string[];
  tags?: string[];
  categories?: string[];
  thumbnailUrl?: string;
  connectionSchemas: ConnectionSchema[];
  /** The component that publishes this catalog item (used to exclude self at component scope). */
  component?: { componentId?: string; endpointId?: string; apimId?: string };
}

export interface MarketplacePagination {
  limit: number;
  total: number;
  offset: number;
}

/** Paginated marketplace catalog envelope (shared by services/databases/resources). */
export interface ConnectionCatalogResponse {
  count: number;
  pagination: MarketplacePagination;
  data: ConnectionCatalogItem[];
}

/** Resource-picker tab / catalog facet in the UI. */
export type ResourceTab = 'services' | 'databases' | 'storage';

/** Which catalog facet to query. */
export const ConnectionCatalogKind = {
  SERVICES: 'services',
  DATABASES: 'databases',
  RESOURCES: 'resources',
} as const;
export type ConnectionCatalogKind = (typeof ConnectionCatalogKind)[keyof typeof ConnectionCatalogKind];

/** A catalog service's API definition (OpenAPI/Swagger), for the detail drawer's API Definition tab. */
export interface ConnectionServiceIdl {
  content: string;
  idlType?: string;
  environmentId?: string;
}

/** Query inputs for the marketplace catalog. */
export interface ListCatalogParams {
  kind: ConnectionCatalogKind;
  projectId: string;
  offset?: number;
  limit?: number;
  search?: string;
  /** Extra facet filters, e.g. `{ resourceTypes: 'STORAGE', tags: 'PVC' }`. */
  filters?: Record<string, string>;
}
