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

import { systemClient } from './httpClients';
import type { ComponentHttpMetricsPayload, ComponentUsageMetricsPayload, ProjectMetricsModel } from '../../types/observability';

// Devant's obs API v3 (see devant-matrics-01.har + choreo-console's
// data/api/observability.ts). Lives on the same systemapis gateway the
// executions/build-logs fetches already use.
const BASE = '/systemapis/choreoobsapi/0.3.0';

/** Bucket width the histograms are aggregated into: 1/100th of the range,
 * floored to whole minutes, min 1m (Devant computes the same). */
export function metricsBreakSize(fromIso: string, toIso: string): string {
  const minutes = (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000 / 100;
  return `${Math.max(Math.floor(minutes), 1)}m`;
}

export async function fetchComponentHttpMetrics(releaseId: string, fromIso: string, toIso: string): Promise<ComponentHttpMetricsPayload | null> {
  const params = new URLSearchParams({ releaseId, from: fromIso, to: toIso, breakSize: metricsBreakSize(fromIso, toIso) });
  return systemClient.get<ComponentHttpMetricsPayload>(`${BASE}/metrics/component/http/?${params.toString()}`);
}

export async function fetchComponentUsageMetrics(releaseId: string, fromIso: string, toIso: string): Promise<ComponentUsageMetricsPayload | null> {
  const params = new URLSearchParams({ releaseId, from: fromIso, to: toIso, breakSize: metricsBreakSize(fromIso, toIso) });
  return systemClient.get<ComponentUsageMetricsPayload>(`${BASE}/metrics/component/usage?${params.toString()}`);
}

/** Project-level HTTP dependency graph with per-link metrics — feeds the cell
 * diagram's observability layer. */
export async function fetchProjectMetricsModel(projectId: string, environmentId: string, fromIso: string, toIso: string): Promise<ProjectMetricsModel | null> {
  const params = new URLSearchParams({ environmentId, from: fromIso, to: toIso, projectId });
  return systemClient.get<ProjectMetricsModel>(`${BASE}/metrics/project/http?${params.toString()}`);
}
