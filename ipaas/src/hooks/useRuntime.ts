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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchComponentPodMetrics, fetchComponentPods, fetchReleaseDetails, redeployRelease } from '#api/runtime';
import { IS_WIP } from '../features';

const ROOT_KEY = 'runtime';
const POLL_MS = 30_000;

/** Component runtime (pods/metrics/redeploy) is wip-only for now (cloud/icp API stubs throw). */
export function isRuntimeEnabled(): boolean {
  return IS_WIP;
}

export function useReleaseDetails(projectId: string, componentId: string, releaseId: string) {
  return useQuery({
    queryKey: [ROOT_KEY, 'release', releaseId],
    queryFn: () => fetchReleaseDetails(projectId, componentId, releaseId),
    enabled: isRuntimeEnabled() && !!projectId && !!componentId && !!releaseId,
    retry: false,
  });
}

export function useComponentPods(projectId: string, clusterId: string, releaseId: string, namespace: string, pollMs: number = POLL_MS) {
  return useQuery({
    queryKey: [ROOT_KEY, 'pods', clusterId, releaseId, namespace],
    queryFn: () => fetchComponentPods(projectId, clusterId, releaseId, namespace),
    enabled: isRuntimeEnabled() && !!projectId && !!clusterId && !!releaseId && !!namespace,
    retry: false,
    staleTime: pollMs,
    refetchInterval: pollMs,
    placeholderData: (prev) => prev,
  });
}

export function useComponentPodMetrics(projectId: string, clusterId: string, releaseId: string, namespace: string) {
  return useQuery({
    queryKey: [ROOT_KEY, 'podMetrics', clusterId, releaseId, namespace],
    queryFn: () => fetchComponentPodMetrics(projectId, clusterId, releaseId, namespace),
    enabled: isRuntimeEnabled() && !!projectId && !!clusterId && !!releaseId && !!namespace,
    retry: false,
    staleTime: POLL_MS,
    refetchInterval: POLL_MS,
    placeholderData: (prev) => prev,
  });
}

export function useRedeployRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { projectId: string; componentId: string; releaseId: string }) => redeployRelease(input.projectId, input.componentId, input.releaseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOT_KEY] });
      qc.invalidateQueries({ queryKey: ['componentDeployment'] });
    },
  });
}
