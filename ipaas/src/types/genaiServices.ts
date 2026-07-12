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
 * GenAI services are internal-marketplace third-party services tagged `GenAI`
 * (marketplace API, `templateType=GenAI`, `isThirdParty=true`).
 */

/** Marketplace status: CREATED = registered/not published; PROTOTYPE/PUBLISHED = in marketplace. */
export type GenAiServiceStatus = 'CREATED' | 'PROTOTYPE' | 'PUBLISHED';

/** A single connection-configuration field on a service's connection schema. */
export interface ConnectionSchemaEntry {
  name: string;
  type: string;
  isOptional: boolean;
  isSensitive: boolean;
}

export interface ConnectionSchema {
  id?: string;
  name: string;
  description: string;
  isDefault: boolean;
  entries: ConnectionSchemaEntry[];
}

/** A registered GenAI service, as returned by the list and detail endpoints. */
export interface GenAiService {
  serviceId: string;
  name: string;
  version: string;
  status: string;
  serviceType: string;
  isThirdParty: boolean;
  templateType: string;
  createdTime: string;
  tags: string[];
  categories: string[];
  visibility: string[];
  summary: string;
  description?: string;
  connectionSchemas: ConnectionSchema[];
  endpointRefs?: Record<string, string>;
  organizationId: string;
  projectId: string;
  resourceId?: string;
}

export interface GenAiServiceListResponse {
  count: number;
  pagination: { limit: number; total: number; offset: number };
  data: GenAiService[];
}

/** A GenAI provider option (Open AI, Azure Open AI, Mistral AI, Anthropic AI). */
export interface GenAiProviderTemplate {
  templateId: string;
  name: string;
}

export interface GenAiDefaultConfig {
  key: string;
  value: string;
}

export interface GenAiUserDefinedConfig {
  name: string;
  isSensitive: boolean;
  configType: string;
}

export interface GenAiTemplateSpec {
  specType: string;
  /** base64-encoded OpenAPI document. */
  content: string;
}

/** Full provider template: prefills the service definition + connection schema. */
export interface GenAiProviderTemplateDetail {
  templateId: string;
  name: string;
  description: string;
  templateType: string;
  version: string;
  serviceType: string;
  spec: GenAiTemplateSpec;
  defaultConfigs: GenAiDefaultConfig[];
  userDefinedConfigs: GenAiUserDefinedConfig[];
}

/** POST /services body. */
export interface CreateServiceRequest {
  name: string;
  version: string;
  summary: string;
  connectionSchemas: ConnectionSchema[];
  organizationId: string;
  projectId: string;
  serviceType: string;
  tags: string[];
  categories: string[];
  visibility: string[];
  isThirdParty: boolean;
  idl: { idlType: string; content: string; environmentId: string };
  status: string;
  resourceType: string;
  /** Marketplace TemplateType enum (e.g. `GenAI`). Omitted for plain third-party services. */
  templateType?: string;
}

export interface CreateServiceResponse {
  details: string;
  id: string;
}

/** POST /services/{id}/connection-schemas/{schemaId}/config body. */
export interface ConnectionConfigValue {
  key: string;
  value: string;
}

export interface ConnectionConfigGroup {
  name: string;
  environmentTemplateIds: string[];
  values: ConnectionConfigValue[];
}

export interface ConnectionConfigRequest {
  configs: Record<string, ConnectionConfigGroup>;
}

export interface ConnectionConfigResponse {
  message: string;
  configs: Record<string, ConnectionConfigGroup>;
}

/** One connection value with its sensitivity, as edited in the Endpoints tab. */
export interface ConnectionParam {
  key: string;
  value: string;
  isSensitive: boolean;
}

/** An endpoint's editable config: the URL plus its parameter values, for a set of environments. */
export interface EndpointConfigDraft {
  name: string;
  serviceUrl: string;
  params: ConnectionParam[];
  environmentIds: string[];
}

/** The service definition (OpenAPI) document. `content` is base64 (may be compressed). */
export interface ServiceIdl {
  environmentId?: string;
  content: string;
  idlType: string;
}

/** PUT /services/{id} body. Same shape as create but without `idl` (updated separately). */
export interface UpdateServiceRequest {
  name: string;
  version: string;
  summary: string;
  description?: string;
  connectionSchemas: ConnectionSchema[];
  organizationId: string;
  projectId: string;
  serviceType: string;
  tags: string[];
  categories: string[];
  visibility: string[];
  isThirdParty: boolean;
  status: string;
  resourceType: string;
  /** Omitted for plain third-party services (backend rejects an empty TemplateType). */
  templateType?: string;
}

/** Editable fields captured by the General Details tab. */
export interface GenAiServiceEdit {
  name: string;
  summary: string;
  description: string;
  tags: string[];
}

// --- wizard-facing draft shapes (owned by the register flow, flattened by utils) ---

/** Step 2 output: service details + the connection entries derived from the template. */
export interface GenAiServiceDraft {
  name: string;
  version: string;
  summary: string;
  serviceUrl: string;
  /** True when the template supplied a default service URL (field is then read-only). */
  serviceUrlLocked: boolean;
  /** base64 OpenAPI document from the chosen template's spec. */
  serviceDefContent: string;
  /** Connection fields (ServiceURL + provider-specific keys) the user must supply values for. */
  connectionEntries: ConnectionSchemaEntry[];
}

/** Step 3: one endpoint = a named set of environments sharing one value per connection entry. */
export interface ConnectionEndpointDraft {
  name: string;
  environmentIds: string[];
  values: Record<string, string>;
}

/** Args to the create orchestration (create → config → status). */
export interface CreateGenAiServiceArgs {
  draft: GenAiServiceDraft;
  endpoints: ConnectionEndpointDraft[];
}
