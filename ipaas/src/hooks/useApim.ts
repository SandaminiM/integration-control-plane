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
import { changeLifecycleState, deploySettingsV2, fetchApimApi, fetchApimSwagger, fetchLifecycleHistory, fetchLifecycleState, generateTestKey, updateApimApi } from '../api/apim';
import type { ApimApiInfo, DeploySettingsV2Payload, GeneratedTestKey, LifecycleHistory, LifecycleState } from '../types/apim';

export function useApimApi(apimId: string | undefined | null) {
  return useQuery<ApimApiInfo | null>({
    queryKey: ['apimApi', apimId],
    queryFn: () => fetchApimApi(apimId!),
    enabled: !!apimId,
    staleTime: 30_000,
    retry: false,
  });
}

export function useLifecycleState(apimId: string | undefined | null) {
  return useQuery<LifecycleState | null>({
    queryKey: ['lifecycleState', apimId],
    queryFn: () => fetchLifecycleState(apimId!),
    enabled: !!apimId,
    staleTime: 0,
    retry: false,
  });
}

export function useLifecycleHistory(apimId: string | undefined | null) {
  return useQuery<LifecycleHistory | null>({
    queryKey: ['lifecycleHistory', apimId],
    queryFn: () => fetchLifecycleHistory(apimId!),
    enabled: !!apimId,
    staleTime: 0,
    retry: false,
  });
}

export function useChangeLifecycleState(apimId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action }: { action: string }) => changeLifecycleState(apimId!, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lifecycleState', apimId] });
      qc.invalidateQueries({ queryKey: ['lifecycleHistory', apimId] });
    },
  });
}

export function useUpdateApimApi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ apimId, body }: { apimId: string; body: ApimApiInfo }) => updateApimApi(apimId, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['apimApi', vars.apimId] });
    },
  });
}

export function useDeploySettingsV2() {
  return useMutation({
    mutationFn: ({ componentId, versionId, payload }: { componentId: string; versionId: string; payload: DeploySettingsV2Payload }) => deploySettingsV2(componentId, versionId, payload),
  });
}

export function useGenerateTestKey() {
  return useMutation<GeneratedTestKey | null, Error, { apimId: string; keyType: 'Development' | 'Production' }>({
    mutationFn: ({ apimId, keyType }) => generateTestKey(apimId, keyType),
  });
}

export function useApimSwagger(apimId: string | undefined | null) {
  return useQuery<unknown>({
    queryKey: ['apimSwagger', apimId],
    queryFn: () => fetchApimSwagger(apimId!),
    enabled: !!apimId,
    staleTime: 60_000,
    retry: false,
  });
}
