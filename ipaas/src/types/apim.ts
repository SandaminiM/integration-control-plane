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

export interface ApimApiOperation {
  id?: string;
  target: string;
  verb: string;
  authType?: string;
  throttlingPolicy?: string;
  scopes?: string[];
  /** MCP tool description (operations that back an MCP tool carry one). */
  description?: string;
  /** MCP tool input schema, as a JSON string. */
  schemaDefinition?: string | null;
}

export interface CorsConfiguration {
  corsConfigurationEnabled: boolean;
  accessControlAllowOrigins: string[];
  accessControlAllowCredentials: boolean;
  accessControlAllowHeaders: string[];
  accessControlAllowMethods: string[];
}

export interface ApimApiInfo {
  id: string;
  name: string;
  displayName: string;
  version: string;
  lifeCycleStatus: string;
  securityScheme?: string[];
  authorizationHeader?: string;
  apiKeyHeader?: string;
  enableBackendJWT?: boolean;
  backendJWTConfiguration?: { audiences?: string[] };
  operations?: ApimApiOperation[];
  policies?: string[];
  scopes?: { scope: { name: string } }[];
  corsConfiguration?: CorsConfiguration;
  apiThrottlingPolicy?: string | null;
  throttlingLimit?: { requestCount: number; unit: string } | null;
  endpointConfig?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GeneratedTestKey {
  apikey: string;
  validityTime: number;
}

export interface DeploySettingsV2Payload {
  environmentId: string;
  buildId: string;
  comment?: string;
  apiSettings: Record<
    string,
    {
      accessMode: string;
      settings: {
        corsConfiguration?: CorsConfiguration & { corsOverrideEnabled?: boolean };
        throttlingLimit: { requestCount: number; unit: string } | null;
        operations?: { verb: string; target: string; throttlingLimit: { requestCount: number; unit: string } }[];
        resiliency?: number;
      };
      revisionId?: string;
      isAsyncAPI?: boolean;
      multiGatewayDeployment?: boolean;
    }
  >;
}

export interface LifecycleStateTransition {
  event: string;
  targetState: string;
}

export interface LifecycleState {
  state: string;
  checkItems: { name: string; value: boolean }[];
  availableTransitions: LifecycleStateTransition[];
}

export interface LifecycleHistoryItem {
  previousState: string | null;
  postState: string;
  user: string;
  updatedTime: string;
}

export interface LifecycleHistory {
  count: number;
  list: LifecycleHistoryItem[];
}

export interface MarketplaceService {
  serviceId: string;
  description?: string;
  name?: string;
  summary?: string;
  tags?: string[];
  visibility?: string[];
  version?: string;
  createdTime?: string;
  organizationId?: string;
  serviceType?: string;
  connectionSchemas?: unknown;
  status?: string;
  resourceType?: string;
  isThirdParty?: boolean;
  [key: string]: unknown;
}
