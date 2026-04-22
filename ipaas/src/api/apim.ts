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

import { authenticatedFetch, getOrgUuidFromToken } from '../auth/tokenManager';

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

// Derive APIM Publisher base URL from the choreoOrgApiUrl config.
// e.g. https://apis.preview-dv.choreo.dev/... → https://sts.preview-dv.choreo.dev
export function getApimBaseUrl(): string | null {
  const match = (window.API_CONFIG?.choreoOrgApiUrl ?? '').match(/\/\/apis\.([^.]+)\.choreo\.dev/);
  return match ? `https://sts.${match[1]}.choreo.dev` : null;
}

// Derive Developer Portal base URL from the choreoOrgApiUrl config.
export function getDevPortalBaseUrl(): string | null {
  const match = (window.API_CONFIG?.choreoOrgApiUrl ?? '').match(/\/\/apis\.([^.]+)\.choreo\.dev/);
  return match ? `https://devportal.${match[1]}.choreo.dev` : null;
}

export async function fetchApimApi(apimId: string): Promise<ApimApiInfo | null> {
  const base = getApimBaseUrl();
  if (!base) return null;
  const orgUuid = getOrgUuidFromToken() ?? '';
  try {
    const res = await authenticatedFetch(`${base}/api/am/publisher/v2/apis/${encodeURIComponent(apimId)}?organizationId=${encodeURIComponent(orgUuid)}`);
    if (!res.ok) return null;
    return res.json() as Promise<ApimApiInfo>;
  } catch {
    return null;
  }
}

export async function updateApimApi(apimId: string, body: ApimApiInfo): Promise<ApimApiInfo> {
  const base = getApimBaseUrl();
  if (!base) throw new Error('APIM base URL could not be derived from configuration');
  const orgUuid = getOrgUuidFromToken() ?? '';
  let res: Response;
  try {
    res = await authenticatedFetch(`${base}/api/am/publisher/v2/apis/${encodeURIComponent(apimId)}?organizationId=${encodeURIComponent(orgUuid)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(`APIM update request failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`APIM update failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`);
  }
  return res.json() as Promise<ApimApiInfo>;
}

export interface GeneratedTestKey {
  apikey: string;
  validityTime: number;
}

export async function generateTestKey(apimId: string, keyType: 'Development' | 'Production'): Promise<GeneratedTestKey | null> {
  const base = getApimBaseUrl();
  if (!base) return null;
  const orgUuid = getOrgUuidFromToken() ?? '';
  try {
    const params = new URLSearchParams({ organizationId: orgUuid, keyType });
    const res = await authenticatedFetch(`${base}/api/am/publisher/v2/apis/${encodeURIComponent(apimId)}/generate-key?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!res.ok) return null;
    return res.json() as Promise<GeneratedTestKey>;
  } catch {
    return null;
  }
}

// ── Proxy Deployer ─────────────────────────────────────────────────────────────

export function getProxyDeployerBaseUrl(): string {
  const base = (window.API_CONFIG?.choreoOrgApiUrl ?? '').replace(/\/orgs\/.*$/, '');
  return `${base}/proxy/deployer/v1`;
}

export interface DeploySettingsV2Payload {
  environmentId: string;
  buildId: string;
  comment?: string;
  apiSettings: Record<string, {
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
  }>;
}

export async function deploySettingsV2(
  componentId: string,
  versionId: string,
  payload: DeploySettingsV2Payload,
): Promise<void> {
  const base = getProxyDeployerBaseUrl();
  const url = `${base}/components/${encodeURIComponent(componentId)}/versions/${encodeURIComponent(versionId)}/deploy-settings-v2`;
  let res: Response;
  try {
    res = await authenticatedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new Error(`deploy-settings-v2 request failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`deploy-settings-v2 failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`);
  }
}

// ── APIM Swagger ───────────────────────────────────────────────────────────────

export async function fetchApimSwagger(apimRevisionId: string): Promise<unknown> {
  const base = getApimBaseUrl();
  if (!base) return null;
  const orgUuid = getOrgUuidFromToken() ?? '';
  try {
    const res = await authenticatedFetch(`${base}/api/am/publisher/v2/apis/${encodeURIComponent(apimRevisionId)}/swagger?organizationId=${encodeURIComponent(orgUuid)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
