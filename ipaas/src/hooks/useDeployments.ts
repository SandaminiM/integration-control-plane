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
import type { Query } from '@tanstack/react-query';
import { fetchApimSwagger } from '../api/apim';
import {
  fetchComponentDeployment,
  fetchEnvEndpoints,
  fetchDeploymentStatus,
  fetchReleaseMgtDeployments,
  fetchDeploymentTrackImages,
  deployDeploymentTrack,
  triggerBuild,
  promote,
  stopDeployment,
  redeployDeployment,
  deployPrebuiltImage,
} from '../api/deployments';
import type { GqlComponentDeployment, GqlDeploymentStatus, DeployDeploymentTrackInput, PromoteInput, StopDeploymentInput, DeployPrebuiltImageInput } from '../types/deployment';
import type { DeployComponentInput } from '../types/build';

const TERMINAL_CONCLUSIONS = new Set(['success', 'failure', 'cancelled', 'timed_out', 'neutral', 'skipped']);

export function useComponentDeployment(orgHandler: string, orgUuid: string, componentId: string, versionId: string, environmentId: string, options?: { refetchInterval?: number | false | ((query: Query<GqlComponentDeployment | null>) => number | false) }) {
  return useQuery<GqlComponentDeployment | null, Error, GqlComponentDeployment | null>({
    queryKey: ['componentDeployment', orgHandler, componentId, versionId, environmentId],
    queryFn: () => fetchComponentDeployment(orgHandler, orgUuid, componentId, versionId, environmentId),
    enabled: !!orgHandler && !!orgUuid && !!componentId && !!versionId && !!environmentId,
    retry: false,
    refetchInterval: options?.refetchInterval,
  });
}

export function useEnvEndpoints(componentId: string, versionId: string, releaseId: string) {
  return useQuery({
    queryKey: ['envEndpoints', componentId, versionId, releaseId],
    queryFn: () => fetchEnvEndpoints(componentId, versionId, releaseId),
    enabled: !!componentId && !!versionId && !!releaseId,
    staleTime: 30_000,
    retry: false,
  });
}

export function useApiDefinition(apimRevisionId: string | null | undefined) {
  return useQuery({
    queryKey: ['apiDefinition', apimRevisionId],
    queryFn: () => fetchApimSwagger(apimRevisionId!),
    enabled: !!apimRevisionId,
    staleTime: 60_000,
    retry: false,
  });
}

export function useDeploymentStatus(componentId: string, versionId: string) {
  return useQuery({
    queryKey: ['deploymentStatus', componentId, versionId],
    queryFn: () => fetchDeploymentStatus(componentId, versionId),
    enabled: !!componentId && !!versionId,
    retry: false,
    refetchInterval: (query) => {
      const data = query.state.data as GqlDeploymentStatus[] | undefined;
      if (!data || data.length === 0) return 15000;
      const allTerminal = data.every((d) => d.status === 'completed' || TERMINAL_CONCLUSIONS.has((d.conclusionV2 ?? d.conclusion ?? '').toLowerCase()));
      return allTerminal ? false : 15000;
    },
  });
}

export function useReleaseMgtDeployments(orgUuid: string, projectId: string, componentId: string, versionId: string, environmentId: string) {
  return useQuery({
    queryKey: ['releaseMgtDeployments', orgUuid, projectId, componentId, versionId, environmentId],
    queryFn: () => fetchReleaseMgtDeployments(orgUuid, projectId, componentId, versionId, environmentId),
    enabled: !!orgUuid && !!projectId && !!componentId && !!versionId && !!environmentId,
    retry: false,
    staleTime: 30_000,
  });
}

export function useDeploymentTrackImages(componentId: string, versionId: string, refetchInterval?: number) {
  return useQuery({
    queryKey: ['deploymentTrackImages', componentId, versionId],
    queryFn: async () => {
      const images = await fetchDeploymentTrackImages(componentId, versionId);
      return [...images].sort((a, b) => new Date(b.builtAt).getTime() - new Date(a.builtAt).getTime());
    },
    enabled: !!componentId && !!versionId,
    retry: false,
    staleTime: 30_000,
    refetchInterval,
  });
}

export function useRefreshEnvironmentArtifacts() {
  const qc = useQueryClient();

  return (envId: string, componentId: string) => {
    return Promise.all([
      qc.invalidateQueries({
        queryKey: ['artifacts'],
        predicate: (query) => {
          const [, , envIdKey, compIdKey] = query.queryKey;
          return envIdKey === envId && compIdKey === componentId;
        },
      }),
      qc.invalidateQueries({
        queryKey: ['artifactTypes', componentId, envId],
      }),
    ]);
  };
}

export function useDeployDeploymentTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DeployDeploymentTrackInput) => deployDeploymentTrack(input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['deploymentStatus', input.componentId, input.id] });
      qc.invalidateQueries({ queryKey: ['executionConfigs', input.componentId] });
      qc.invalidateQueries({ queryKey: ['componentDeployment'] });
    },
  });
}

export function useTriggerBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DeployComponentInput) => triggerBuild(input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['deploymentStatus', input.componentId, input.versionId] });
    },
  });
}

export function usePromote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PromoteInput) => promote(input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['componentDeployment'] });
      qc.invalidateQueries({ queryKey: ['deploymentStatus', input.componentId] });
    },
  });
}

export function useStopDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StopDeploymentInput) => stopDeployment(input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['executionConfigs', input.componentId] });
      qc.invalidateQueries({ queryKey: ['componentDeployment'] });
    },
  });
}

export function useRedeployDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { orgHandler: string; componentId: string; releaseId: string; type: string; releaseMgtReleaseId?: string; releaseMgtDeploymentId?: string }) => redeployDeployment(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['componentDeployment'] }),
  });
}

export function useDeployPrebuiltImage() {
  return useMutation({
    mutationFn: (input: DeployPrebuiltImageInput) => deployPrebuiltImage(input),
  });
}
