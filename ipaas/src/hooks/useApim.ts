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

import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changeLifecycleState, deploySettingsV2, fetchApimApi, fetchApimSwagger, fetchLifecycleHistory, fetchLifecycleState, generateTestKey, updateApimApi } from '#api/apim';
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
    mutationFn: ({ action }: { action: string }) => {
      if (!apimId) return Promise.reject(new Error('apimId is required'));
      return changeLifecycleState(apimId, action);
    },
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

/**
 * Mints a test key for an APIM API and keeps it in state, refreshing when the
 * endpoint/environment changes or `regenerate()` is called. `critical` picks the
 * key tier (Production vs Development).
 */
export function useGeneratedTestKey({ apimId, critical, enabled = true }: { apimId: string | null; critical: boolean; enabled?: boolean }) {
  const generateKey = useGenerateTestKey();
  const [token, setToken] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [nonce, setNonce] = useState(0);
  const regenerate = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!apimId || !enabled) {
      setToken('');
      return undefined;
    }
    let cancelled = false;
    setIsFetching(true);
    generateKey
      .mutateAsync({ apimId, keyType: critical ? 'Production' : 'Development' })
      .then((r) => {
        if (!cancelled) setToken(r?.apikey ?? '');
      })
      .catch(() => {
        if (!cancelled) setToken('');
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false);
      });
    return () => {
      cancelled = true;
    };
    // generateKey is a stable mutation; apimId/critical/enabled/nonce drive identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apimId, critical, enabled, nonce]);

  return { token, isFetching, regenerate };
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
