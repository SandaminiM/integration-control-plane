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

import { choreoClient, withScopeRetry } from './httpClients';
import { GENAI_IDL_TYPE, GENAI_TEMPLATE_TYPE, MARKETPLACE_BASE } from '../../constants/genaiServices';
import type {
  ConnectionConfigRequest,
  ConnectionConfigResponse,
  CreateServiceRequest,
  CreateServiceResponse,
  GenAiProviderTemplate,
  GenAiProviderTemplateDetail,
  GenAiService,
  GenAiServiceListResponse,
  GenAiServiceStatus,
  ServiceIdl,
  UpdateServiceRequest,
} from '../../types/genaiServices';

const SERVICES = `${MARKETPLACE_BASE}/services`;
const TEMPLATES = `${MARKETPLACE_BASE}/templates`;

/** GenAI marketplace services (paginated, searchable). Project-scoped when `projectId` is set. */
export function listGenaiServices(params: { query?: string; offset: number; limit: number; projectId?: string }): Promise<GenAiServiceListResponse> {
  const qs = new URLSearchParams({
    networkVisibilityFilter: params.projectId ? 'project' : 'org',
    templateType: GENAI_TEMPLATE_TYPE,
    isTemplated: 'true',
    offset: String(params.offset),
    limit: String(params.limit),
    query: params.query ?? '',
    sortBy: 'createdTime',
    sortAscending: 'false',
    isThirdParty: 'true',
    aggregateByMajorVersion: 'false',
    includeCreated: 'true',
  });
  if (params.projectId) qs.set('networkVisibilityprojectId', params.projectId);
  return withScopeRetry(() => choreoClient.get<GenAiServiceListResponse>(`${SERVICES}?${qs.toString()}`));
}

/** Third-party marketplace services (own service definition, not templated). */
export function listThirdPartyServices(params: { query?: string; offset: number; limit: number; projectId?: string }): Promise<GenAiServiceListResponse> {
  const qs = new URLSearchParams({
    networkVisibilityFilter: params.projectId ? 'project' : 'org',
    isTemplated: 'false',
    offset: String(params.offset),
    limit: String(params.limit),
    query: params.query ?? '',
    sortBy: 'createdTime',
    sortAscending: 'false',
    isThirdParty: 'true',
    aggregateByMajorVersion: 'false',
    includeCreated: 'true',
  });
  if (params.projectId) qs.set('networkVisibilityprojectId', params.projectId);
  return withScopeRetry(() => choreoClient.get<GenAiServiceListResponse>(`${SERVICES}?${qs.toString()}`));
}

/** GenAI provider options (Open AI, Azure Open AI, Mistral AI, Anthropic AI). */
export function listProviderTemplates(): Promise<GenAiProviderTemplate[]> {
  return withScopeRetry(() => choreoClient.get<GenAiProviderTemplate[]>(`${TEMPLATES}/list?templateType=${encodeURIComponent(GENAI_TEMPLATE_TYPE)}`));
}

/** A provider template with its service definition + connection config schema. */
export function getProviderTemplate(templateId: string): Promise<GenAiProviderTemplateDetail> {
  return withScopeRetry(() => choreoClient.get<GenAiProviderTemplateDetail>(`${TEMPLATES}/${encodeURIComponent(templateId)}?templateType=${encodeURIComponent(GENAI_TEMPLATE_TYPE)}`));
}

/** Register a new service; returns the created service id. */
export function createGenaiService(request: CreateServiceRequest): Promise<CreateServiceResponse> {
  return withScopeRetry(() => choreoClient.post<CreateServiceResponse>(SERVICES, request));
}

/** Fetch a service (detail view + post-create connection-schema id lookup). */
export function getGenaiService(serviceId: string): Promise<GenAiService> {
  return withScopeRetry(() => choreoClient.get<GenAiService>(`${SERVICES}/${encodeURIComponent(serviceId)}`));
}

/** Update a service's general details (name, summary, description, labels). */
export function updateGenaiService(serviceId: string, request: UpdateServiceRequest): Promise<GenAiService> {
  return withScopeRetry(() => choreoClient.put<GenAiService>(`${SERVICES}/${encodeURIComponent(serviceId)}`, request));
}

/** Fetch the service definition (OpenAPI) document. */
export function getGenaiServiceIdl(serviceId: string): Promise<ServiceIdl> {
  return withScopeRetry(() => choreoClient.get<ServiceIdl>(`${SERVICES}/${encodeURIComponent(serviceId)}/idl`));
}

/** Replace the service definition. `content` is the base64 OpenAPI document. */
export function updateGenaiServiceIdl(serviceId: string, content: string): Promise<void> {
  return withScopeRetry(() => choreoClient.put<void>(`${SERVICES}/${encodeURIComponent(serviceId)}/idl?idlType=${encodeURIComponent(GENAI_IDL_TYPE)}`, content));
}

/** Read the saved per-environment connection values for a schema. */
export function getConnectionConfig(serviceId: string, schemaId: string): Promise<ConnectionConfigResponse> {
  return withScopeRetry(() => choreoClient.get<ConnectionConfigResponse>(`${SERVICES}/${encodeURIComponent(serviceId)}/connection-schemas/${encodeURIComponent(schemaId)}/config`));
}

/** Update per-environment connection values for a schema. */
export function updateConnectionConfig(serviceId: string, schemaId: string, request: ConnectionConfigRequest): Promise<void> {
  return withScopeRetry(() => choreoClient.put<void>(`${SERVICES}/${encodeURIComponent(serviceId)}/connection-schemas/${encodeURIComponent(schemaId)}/config`, request));
}

/** Save per-environment connection values for a service's connection schema. */
export function addConnectionConfig(serviceId: string, schemaId: string, request: ConnectionConfigRequest): Promise<void> {
  return withScopeRetry(() => choreoClient.post<void>(`${SERVICES}/${encodeURIComponent(serviceId)}/connection-schemas/${encodeURIComponent(schemaId)}/config`, request));
}

/** Set a service's marketplace status (CREATED = registered, not published). */
export function setGenaiServiceStatus(serviceId: string, status: GenAiServiceStatus): Promise<void> {
  return withScopeRetry(() => choreoClient.put<void>(`${SERVICES}/${encodeURIComponent(serviceId)}/status?status=${encodeURIComponent(status)}`));
}

/** Delete a service. */
export function deleteGenaiService(serviceId: string): Promise<void> {
  return withScopeRetry(() => choreoClient.delete<void>(`${SERVICES}/${encodeURIComponent(serviceId)}`));
}
