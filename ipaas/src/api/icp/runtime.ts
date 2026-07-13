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

// Component runtime (pods/metrics/redeploy) is a wip-only surface for now. Signatures mirror Contracts.RuntimeApi.
import type { ClusterPod, PodMetrics, RuntimeReleaseDetails } from '../../types/runtime';

const ni = (name: string): never => {
  throw new Error(`[icp] runtime.${name}: not implemented`);
};

export const fetchReleaseDetails = (_projectId: string, _componentId: string, _releaseId: string): Promise<RuntimeReleaseDetails> => ni('fetchReleaseDetails');
export const fetchComponentPods = (_projectId: string, _clusterId: string, _releaseId: string, _namespace: string): Promise<ClusterPod[]> => ni('fetchComponentPods');
export const fetchComponentPodMetrics = (_projectId: string, _clusterId: string, _releaseId: string, _namespace: string): Promise<PodMetrics[]> => ni('fetchComponentPodMetrics');
export const redeployRelease = (_projectId: string, _componentId: string, _releaseId: string, _message?: string): Promise<void> => ni('redeployRelease');
