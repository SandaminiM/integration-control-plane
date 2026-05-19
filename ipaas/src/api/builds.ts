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

import { choreoClient, systemClient } from './httpClients';
import type { BuildRunLogs } from '../types/build';

export async function fetchBuildRunLogs(orgHandler: string, projectId: string, componentId: string, runId: string): Promise<BuildRunLogs | null> {
  try {
    const data = await choreoClient.get<{ data?: BuildRunLogs }>(`/component-mgt/1.0.0/orgs/${encodeURIComponent(orgHandler)}/projects/${encodeURIComponent(projectId)}/components/${encodeURIComponent(componentId)}/runs/${encodeURIComponent(runId)}/logs`);
    return data?.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchBuildLogs(componentId: string, versionId: string, workflowName: string): Promise<BuildRunLogs | null> {
  try {
    const data = await systemClient.post<{ data?: BuildRunLogs }>('/systemapis/choreologgingapi/0.2.0/logs/component/build', { componentId, deploymentTrackId: versionId, workflowName });
    return data?.data ?? null;
  } catch {
    return null;
  }
}
