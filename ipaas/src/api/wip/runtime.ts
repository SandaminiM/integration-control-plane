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

import { getOrgUuidFromToken } from '../../auth/tokenManager';
import { choreoClient, withScopeRetry } from './httpClients';
import type { ClusterPod, PodMetrics, RuntimeReleaseDetails } from '../../types/runtime';

// Component runtime data lives on the choreo gateway devops service; REST calls
// carry organization_id + project_id query params (org UUID comes from the token).
const BASE = '/devops/1.0.0/api/v1';

function commonParams(projectId: string): URLSearchParams {
  return new URLSearchParams({ organization_id: getOrgUuidFromToken() ?? '', project_id: projectId });
}

/** Full runtime detail for a deployed release (replicas, namespace, cluster, last-deployed). */
export function fetchReleaseDetails(projectId: string, componentId: string, releaseId: string): Promise<RuntimeReleaseDetails> {
  return withScopeRetry(async () => {
    const res = await choreoClient.get<{ data: RuntimeReleaseDetails }>(`${BASE}/components/${encodeURIComponent(componentId)}/release/${encodeURIComponent(releaseId)}?${commonParams(projectId).toString()}`);
    return res.data;
  });
}

// Generic data-plane resource query proxy. The backend expects the apiVersion
// segment URL-encoded; PodMetrics passes an already-encoded value so it lands
// double-encoded on the wire, matching the devops proxy contract.
async function queryDpResources<T>(projectId: string, clusterId: string, apiVersion: string, kind: string, q: { namespace?: string; labelSelector?: string; fieldSelector?: string }): Promise<T[]> {
  const search = commonParams(projectId);
  if (q.namespace) search.set('namespace', q.namespace);
  if (q.labelSelector) search.set('labelSelector', q.labelSelector);
  if (q.fieldSelector) search.set('fieldSelector', q.fieldSelector);
  const res = await choreoClient.get<{ payload: T[] }>(`${BASE}/clusters/${encodeURIComponent(clusterId)}/query/${encodeURIComponent(apiVersion)}/${encodeURIComponent(kind)}?${search.toString()}`);
  return res.payload ?? [];
}

/** Pods for a release (labelSelector release_id=…). */
export function fetchComponentPods(projectId: string, clusterId: string, releaseId: string, namespace: string): Promise<ClusterPod[]> {
  return withScopeRetry(() => queryDpResources<ClusterPod>(projectId, clusterId, 'v1', 'Pod', { namespace, labelSelector: `release_id=${releaseId}` }));
}

/** Live cpu/memory metrics for a release's pods. */
export function fetchComponentPodMetrics(projectId: string, clusterId: string, releaseId: string, namespace: string): Promise<PodMetrics[]> {
  return withScopeRetry(() => queryDpResources<PodMetrics>(projectId, clusterId, encodeURIComponent('metrics.k8s.io/v1beta1'), 'PodMetrics', { namespace, labelSelector: `release_id=${releaseId}` }));
}

/** Redeploy the currently deployed release ("Redeploy Release" button). */
export function redeployRelease(projectId: string, componentId: string, releaseId: string, message = 'Manually redeployed'): Promise<void> {
  return withScopeRetry(() => choreoClient.post<void>(`${BASE}/components/${encodeURIComponent(componentId)}/release/${encodeURIComponent(releaseId)}/deploy-deployment?${commonParams(projectId).toString()}`, { message }));
}
