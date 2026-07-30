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
import { createConsumer, fetchConsumers, fetchSubscription, regenerateConsumerToken, revokeConsumer, setEndpointApiKeyAuth, setEndpointJwtAuth, setEndpointSubscriptionValidation } from '#api/consumers';
import type { ApiKeyAuthOptions, Consumer, CreateConsumerInput, EndpointAuthKind, EndpointRef, Subscription } from '../types/consumers';

/** Endpoint refs are only usable once every segment is known. */
const isCompleteRef = (ref: EndpointRef | null | undefined): ref is EndpointRef => !!ref?.componentName && !!ref.environmentName && !!ref.endpointName;

const refKey = (ref: EndpointRef | null | undefined) => [ref?.componentName ?? '', ref?.environmentName ?? '', ref?.endpointName ?? ''] as const;

const consumersKey = (projectName: string | null | undefined, ref: EndpointRef | null | undefined) => ['consumers', projectName ?? '', ...refKey(ref)] as const;

// ---------------------------------------------------------------------------
// Consumers (applications subscribed to the exposed API)
// ---------------------------------------------------------------------------

/** Consumer applications in the project subscribed to this endpoint's API. */
export function useConsumers(projectName: string | null | undefined, ref: EndpointRef | null | undefined, enabled = true) {
  return useQuery<Consumer[]>({
    queryKey: consumersKey(projectName, ref),
    queryFn: () => fetchConsumers(projectName!, ref!),
    enabled: enabled && !!projectName && isCompleteRef(ref),
    staleTime: 30_000,
    retry: false,
  });
}

/**
 * The subscription token is not returned by the list route, so the dialog
 * re-reads the single subscription to reveal the `Subscription-Key`.
 */
export function useSubscription(applicationId: string | null | undefined, subscriptionId: string | null | undefined, enabled = true) {
  return useQuery<Subscription>({
    queryKey: ['subscription', applicationId ?? '', subscriptionId ?? ''],
    queryFn: () => fetchSubscription(applicationId!, subscriptionId!),
    enabled: enabled && !!applicationId && !!subscriptionId,
    staleTime: 30_000,
    retry: false,
  });
}

/** Create a consumer application and subscribe it to this API in one step. */
export function useCreateConsumer(projectName: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation<Consumer, Error, CreateConsumerInput>({
    mutationFn: (input) => createConsumer(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: consumersKey(projectName, vars) });
    },
  });
}

/** Re-issue a consumer's subscription token (unsubscribe + resubscribe). */
export function useRegenerateConsumerToken(projectName: string | null | undefined, ref: EndpointRef | null | undefined) {
  const qc = useQueryClient();
  return useMutation<Subscription, Error, { applicationId: string; subscriptionId: string }>({
    mutationFn: ({ applicationId, subscriptionId }) => regenerateConsumerToken(applicationId, subscriptionId, ref!),
    onSuccess: (data, vars) => {
      qc.removeQueries({ queryKey: ['subscription', vars.applicationId, vars.subscriptionId] });
      qc.setQueryData(['subscription', vars.applicationId, data.id], data);
      qc.invalidateQueries({ queryKey: consumersKey(projectName, ref) });
    },
    // Regenerating deletes before it re-creates, so even on failure the old
    // subscription is gone — the cached list must not keep showing it.
    onError: (_err, vars) => {
      qc.removeQueries({ queryKey: ['subscription', vars.applicationId, vars.subscriptionId] });
      qc.invalidateQueries({ queryKey: consumersKey(projectName, ref) });
    },
  });
}

/** Unsubscribe a consumer. The application itself is left in place. */
export function useRevokeConsumer(projectName: string | null | undefined, ref: EndpointRef | null | undefined) {
  const qc = useQueryClient();
  return useMutation<void, Error, { applicationId: string; subscriptionId: string }>({
    mutationFn: ({ applicationId, subscriptionId }) => revokeConsumer(applicationId, subscriptionId),
    onSuccess: (_data, vars) => {
      qc.removeQueries({ queryKey: ['subscription', vars.applicationId, vars.subscriptionId] });
      qc.invalidateQueries({ queryKey: consumersKey(projectName, ref) });
    },
  });
}

// ---------------------------------------------------------------------------
// Endpoint security — enforcement policies
// ---------------------------------------------------------------------------

/**
 * Set one of the gateway enforcement policies. There is no route to read the
 * current policy state, so the caller owns the displayed state and applies the
 * server-echoed result on success.
 *
 * The remaining spec routes (expose/unexpose, API keys, test key) are
 * implemented in the API layer but not wired to any UI yet.
 */
export function useSetEndpointAuth(ref: EndpointRef | null | undefined) {
  return useMutation<boolean, Error, { kind: EndpointAuthKind; enabled: boolean; options?: ApiKeyAuthOptions }>({
    mutationFn: ({ kind, enabled, options }) => {
      if (kind === 'jwt') return setEndpointJwtAuth(ref!, enabled);
      if (kind === 'subscription') return setEndpointSubscriptionValidation(ref!, enabled);
      return setEndpointApiKeyAuth(ref!, enabled, options);
    },
  });
}
