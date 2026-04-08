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

export interface BuildStep {
  number: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface BuildStage {
  log: string | null;
  status: string | null;
  steps: BuildStep[];
}

export interface BuildRunLogs {
  init: BuildStage;
  build: BuildStage;
  deploy: BuildStage;
}

export async function fetchBuildRunLogs(orgHandler: string, projectId: string, componentId: string, runId: string): Promise<BuildRunLogs | null> {
  try {
    const base = window.API_CONFIG?.choreoOrgApiUrl?.replace(/\/orgs\/[^/]+$/, '');
    if (!base) return null;
    const url = `${base}/component-mgt/1.0.0/orgs/${orgHandler}/projects/${projectId}/components/${componentId}/runs/${runId}/logs`;
    const res = await authenticatedFetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data as BuildRunLogs) ?? null;
  } catch {
    return null;
  }
}

export async function fetchBuildLogs(componentId: string, versionId: string, workflowName: string): Promise<BuildRunLogs | null> {
  try {
    const baseUrl = window.API_CONFIG?.systemApisBaseUrl;
    if (!baseUrl) return null;
    const url = `${baseUrl}/systemapis/choreologgingapi/0.2.0/logs/component/build`;
    const res = await authenticatedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ componentId, deploymentTrackId: versionId, workflowName }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data as BuildRunLogs) ?? null;
  } catch {
    return null;
  }
}
