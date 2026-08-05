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
import { createConsumer, createEndpointTestKey, fetchConsumers, getEndpointSecurity, regenerateConsumerToken, revokeConsumer, setEndpointSecurity } from '#api/consumers';
import type { ApiKeyResult, Consumer, CreateConsumerInput, EndpointRef, SecurityConfig, Subscription } from '../types/consumers';

/** Endpoint refs are only usable once every segment is known. */
const isCompleteRef = (ref: EndpointRef | null | undefined): ref is EndpointRef => !!ref?.componentName && !!ref.environmentName && !!ref.endpointName;

const refKey = (ref: EndpointRef | null | undefined) => [ref?.componentName ?? '', ref?.environmentName ?? '', ref?.endpointName ?? ''] as const;

const consumersKey = (projectName: string | null | undefined, ref: EndpointRef | null | undefined) => ['consumers', projectName ?? '', ...refKey(ref)] as const;

// ---------------------------------------------------------------------------
// Consumers (named api-keys on the exposed API)
// ---------------------------------------------------------------------------

/** Consumers (named api-keys) of this endpoint's exposed API. */
export function useConsumers(projectName: string | null | undefined, ref: EndpointRef | null | undefined) {
  return useQuery<Consumer[]>({
    queryKey: consumersKey(projectName, ref),
    queryFn: () => fetchConsumers(ref!),
    enabled: isCompleteRef(ref),
    staleTime: 30_000,
    retry: false,
  });
}

/** Create a consumer: mint a named api-key on this endpoint. The plaintext is returned once. */
export function useCreateConsumer(projectName: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation<Consumer, Error, CreateConsumerInput>({
    mutationFn: (input) => createConsumer(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: consumersKey(projectName, vars) });
    },
  });
}

/** Re-issue a consumer's api-key (revoke + mint). The new plaintext is returned once. */
export function useRegenerateConsumerToken(projectName: string | null | undefined, ref: EndpointRef | null | undefined) {
  const qc = useQueryClient();
  return useMutation<Subscription, Error, { keyName: string; displayName: string }>({
    mutationFn: ({ keyName, displayName }) => regenerateConsumerToken(ref!, keyName, displayName),
    // Regenerating revokes before it re-mints, so even on failure the old key is gone — the
    // cached list must not keep showing it.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: consumersKey(projectName, ref) });
    },
  });
}

/** Revoke a consumer's api-key. */
export function useRevokeConsumer(projectName: string | null | undefined, ref: EndpointRef | null | undefined) {
  const qc = useQueryClient();
  return useMutation<void, Error, { keyName: string }>({
    mutationFn: ({ keyName }) => revokeConsumer(ref!, keyName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consumersKey(projectName, ref) });
    },
  });
}

// ---------------------------------------------------------------------------
// Endpoint security — single active auth mode
// ---------------------------------------------------------------------------

const securityKey = (ref: EndpointRef | null | undefined) => ['endpoint-security', ...refKey(ref)] as const;

/** Read the exposed API's active auth mode so the security drawer reflects real state. */
export function useEndpointSecurity(ref: EndpointRef | null | undefined, enabled = true) {
  return useQuery<SecurityConfig>({
    queryKey: securityKey(ref),
    queryFn: () => getEndpointSecurity(ref!),
    enabled: enabled && isCompleteRef(ref),
    staleTime: 30_000,
    retry: false,
  });
}

/** Set the exposed API's active auth mode (none/api-key/jwt). */
export function useSetEndpointSecurity(ref: EndpointRef | null | undefined) {
  const qc = useQueryClient();
  return useMutation<SecurityConfig, Error, SecurityConfig>({
    mutationFn: (cfg) => setEndpointSecurity(ref!, cfg),
    onSuccess: (data) => {
      qc.setQueryData(securityKey(ref), data);
    },
  });
}

/**
 * Mint a short-lived (1h) test key for the exposed API. The plaintext is
 * returned once and is sent as the `api-key-auth` header, which this route also
 * turns on if it is off.
 */
export function useCreateEndpointTestKey(ref: EndpointRef | null | undefined) {
  return useMutation<ApiKeyResult, Error, void>({
    mutationFn: () => createEndpointTestKey(ref!),
  });
}
