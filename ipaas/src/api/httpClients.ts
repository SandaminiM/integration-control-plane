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

import { authenticatedFetch } from '../auth/tokenManager';
import { apimBaseUrl, choreoDevopsApiUrl, governanceBaseUrl, insightsBaseUrl, subscriptionsApiUrl } from '../config/api';

export interface HttpClient {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) => Promise<T>;
  put: <T>(path: string, body?: unknown, headers?: Record<string, string>) => Promise<T>;
  delete: <T>(path: string, body?: unknown, headers?: Record<string, string>) => Promise<T>;
}

// Factory to create HTTP clients for different services
export function createHttpClient(getBaseUrl: () => string): HttpClient {
  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await authenticatedFetch(`${getBaseUrl()}${path}`, {
      ...options,
      headers: {
        ...(options?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
    }
    const text = await res.text().catch(() => '');
    return (text ? (JSON.parse(text) as T) : undefined) as T;
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
      request<T>(path, { method: 'POST', ...(body !== undefined ? { body: JSON.stringify(body) } : {}), headers }),
    put: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
      request<T>(path, { method: 'PUT', ...(body !== undefined ? { body: JSON.stringify(body) } : {}), headers }),
    delete: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
      request<T>(path, { method: 'DELETE', ...(body !== undefined ? { body: JSON.stringify(body) } : {}), headers }),
  };
}

// HTTP Clients

// Choreo DevOps API — CI/CD, deployments, container registries, cloud editor
export const devopsClient = createHttpClient(choreoDevopsApiUrl);

// Choreo Org API — org management, registration, validation
export const orgClient = createHttpClient(() => window.API_CONFIG.choreoOrgApiUrl);

// Auth service — users, roles, groups, permissions
export const authClient = createHttpClient(() => window.API_CONFIG.authBaseUrl);

// System APIs — task execution logs, build logs, observability
export const systemClient = createHttpClient(() => {
  const base = window.API_CONFIG?.systemApisBaseUrl;
  if (!base) throw new Error('System APIs base URL is not configured');
  return base;
});

// APIM Publisher — API lifecycle, throttling, swagger
export const apimClient = createHttpClient(apimBaseUrl);

// Observability — metrics and runtime logs
export const obsClient = createHttpClient(() => {
  const base = window.API_CONFIG?.observabilityUrl;
  if (!base) throw new Error('Observability URL is not configured');
  return base;
});

// Platform API — component-mgt, config-svc, config-mapping-svc, configuration-schema, config-mgt, proxy/deployer
export const platformClient = createHttpClient(() => window.API_CONFIG.choreoBaseApiUrl);

// Subscriptions service
export const subscriptionsClient = createHttpClient(subscriptionsApiUrl);

// Choreo Insights — GraphQL-like query endpoint on a separate host
export const insightsClient = createHttpClient(insightsBaseUrl);

// Governance service
export const governanceClient = createHttpClient(governanceBaseUrl);

// AI Copilot data collector — feedback, data collection permissions
export const copilotDatacollectorClient = createHttpClient(() => {
  const base = window.API_CONFIG?.aiCopilotDatacollectorBaseUrl;
  if (!base) throw new Error('Copilot datacollector URL is not configured');
  return base;
});
