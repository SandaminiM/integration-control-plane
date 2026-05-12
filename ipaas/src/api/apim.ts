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

import { getOrgUuidFromToken } from '../auth/tokenManager';
import { apimClient, platformClient } from './httpClients';

export interface ApimApiOperation {
  id?: string;
  target: string;
  verb: string;
  authType?: string;
  throttlingPolicy?: string;
  scopes?: string[];
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
  endpointConfig?: Record<string, unknown>;
  [key: string]: unknown;
}

// Derive Developer Portal base URL from the choreoOrgApiUrl config.
export function getDevPortalBaseUrl(): string | null {
  const match = (window.API_CONFIG?.choreoOrgApiUrl ?? '').match(/\/\/apis\.([^.]+)\.choreo\.dev/);
  return match ? `https://devportal.${match[1]}.choreo.dev` : null;
}

export async function fetchApimApi(apimId: string): Promise<ApimApiInfo | null> {
  const orgUuid = getOrgUuidFromToken() ?? '';
  try {
    return await apimClient.get<ApimApiInfo>(`/api/am/publisher/v2/apis/${encodeURIComponent(apimId)}?organizationId=${encodeURIComponent(orgUuid)}`);
  } catch {
    return null;
  }
}

export async function updateApimApi(apimId: string, body: ApimApiInfo): Promise<ApimApiInfo> {
  const orgUuid = getOrgUuidFromToken() ?? '';
  try {
    return await apimClient.put<ApimApiInfo>(`/api/am/publisher/v2/apis/${encodeURIComponent(apimId)}?organizationId=${encodeURIComponent(orgUuid)}`, body);
  } catch (err) {
    throw new Error(`APIM update failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export interface GeneratedTestKey {
  apikey: string;
  validityTime: number;
}

export async function generateTestKey(apimId: string, keyType: 'Development' | 'Production'): Promise<GeneratedTestKey | null> {
  const orgUuid = getOrgUuidFromToken() ?? '';
  try {
    const params = new URLSearchParams({ organizationId: orgUuid, keyType });
    return await apimClient.post<GeneratedTestKey>(
      `/api/am/publisher/v2/apis/${encodeURIComponent(apimId)}/generate-key?${params}`,
    );
  } catch {
    return null;
  }
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

export async function deploySettingsV2(componentId: string, versionId: string, payload: DeploySettingsV2Payload): Promise<void> {
  try {
    await platformClient.post(`/proxy/deployer/v1/components/${encodeURIComponent(componentId)}/versions/${encodeURIComponent(versionId)}/deploy-settings-v2`, payload);
  } catch (err) {
    throw new Error(`deploy-settings-v2 failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

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

export async function fetchLifecycleState(apimId: string): Promise<LifecycleState | null> {
  const orgUuid = getOrgUuidFromToken() ?? '';
  try {
    return await apimClient.get<LifecycleState>(`/api/am/publisher/v2/apis/${encodeURIComponent(apimId)}/lifecycle-state?organizationId=${encodeURIComponent(orgUuid)}`);
  } catch {
    return null;
  }
}

export async function fetchLifecycleHistory(apimId: string): Promise<LifecycleHistory | null> {
  const orgUuid = getOrgUuidFromToken() ?? '';
  try {
    return await apimClient.get<LifecycleHistory>(`/api/am/publisher/v2/apis/${encodeURIComponent(apimId)}/lifecycle-history?organizationId=${encodeURIComponent(orgUuid)}`);
  } catch {
    return null;
  }
}

export async function changeLifecycleState(apimId: string, action: string): Promise<LifecycleState> {
  const orgUuid = getOrgUuidFromToken() ?? '';
  const params = new URLSearchParams({ organizationId: orgUuid, apiId: apimId, action });
  const data = await apimClient.post<{ lifecycleState: LifecycleState }>(`/api/am/publisher/v2/apis/change-lifecycle?${params}`);
  return data.lifecycleState;
}

// ── APIM Swagger ───────────────────────────────────────────────────────────────

export async function fetchApimSwagger(apimRevisionId: string): Promise<unknown> {
  const orgUuid = getOrgUuidFromToken() ?? '';
  try {
    return await apimClient.get<unknown>(`/api/am/publisher/v2/apis/${encodeURIComponent(apimRevisionId)}/swagger?organizationId=${encodeURIComponent(orgUuid)}`);
  } catch {
    return null;
  }
}
