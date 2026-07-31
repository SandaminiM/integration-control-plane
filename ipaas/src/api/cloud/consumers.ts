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

/**
 * Cloud (OpenChoreo) API security & exposure API. Calls the ipaas-service BFF
 * ("Integration Platform - API Security & Exposure"). Org context comes from
 * the JWT, so no org parameter appears on any of these calls.
 *
 * Two wire-shape notes:
 *   - The spec returns bare JSON arrays for the list routes, while most other
 *     BFF routes use the `{ items: [] }` envelope. `asList` accepts both so a
 *     server-side switch to the envelope does not break the UI.
 *   - The list-subscriptions route documents `token`, but only create and the
 *     single-subscription GET are guaranteed to populate it. Callers that need
 *     the token re-read the subscription (see `fetchSubscription`).
 */

import type { ApiExposure, ApiKeyAuthOptions, ApiKeyResult, ApiKeySummary, Consumer, CreateApiKeyInput, CreateConsumerInput, EndpointRef, SecurityConfig, Subscription } from '../../types/consumers';
import { userFacingError } from '../../utils/apiSecurity';
import { bff, items, seg, type ListResponse } from './_client';

/** Tolerates both the bare-array (spec) and `{ items: [] }` (BFF house style) list shapes. */
const asList = <T>(r: T[] | ListResponse<T> | null | undefined): T[] => (Array.isArray(r) ? r : items(r));

const endpointPath = ({ componentName, environmentName, endpointName }: EndpointRef): string => `/components/${seg(componentName)}/environments/${seg(environmentName)}/endpoints/${seg(endpointName)}`;

/**
 * The exposed API's handle is `{componentName}-{endpointName}` (per the spec's
 * `APIExposure.handle` / `CreateSubscriptionRequest.restApiId` examples). There
 * is no "get exposure" route, so this derivation is how the UI matches existing
 * subscriptions to the endpoint in view before anything is exposed in-session.
 * Prefer the server-returned `handle` from `exposeEndpoint` whenever it is known.
 */
const deriveRestApiId = (ref: EndpointRef): string => `${ref.componentName}-${ref.endpointName}`;

// ---------------------------------------------------------------------------
// Exposure
// ---------------------------------------------------------------------------

export const exposeEndpoint = (ref: EndpointRef): Promise<ApiExposure> => bff.post<ApiExposure>(`${endpointPath(ref)}/expose`);

export const unexposeEndpoint = (ref: EndpointRef): Promise<void> => bff.delete<void>(`${endpointPath(ref)}/expose`);

// ---------------------------------------------------------------------------
// Endpoint security — API keys
// ---------------------------------------------------------------------------

export const listEndpointApiKeys = (ref: EndpointRef): Promise<ApiKeySummary[]> => bff.get<ApiKeySummary[] | ListResponse<ApiKeySummary>>(`${endpointPath(ref)}/api-keys`).then(asList);

export const createEndpointApiKey = (ref: EndpointRef, input: CreateApiKeyInput): Promise<ApiKeyResult> => bff.post<ApiKeyResult>(`${endpointPath(ref)}/api-keys`, input);

export const revokeEndpointApiKey = (ref: EndpointRef, keyName: string): Promise<void> => bff.delete<void>(`${endpointPath(ref)}/api-keys/${seg(keyName)}`);

/** One-click 1h credential. Also forces `api-key-auth` on (no-op when already on). */
export const createEndpointTestKey = (ref: EndpointRef): Promise<ApiKeyResult> => bff.post<ApiKeyResult>(`${endpointPath(ref)}/test-key`);

// ---------------------------------------------------------------------------
// Endpoint security — enforcement policies
// ---------------------------------------------------------------------------

interface AuthToggleResponse {
  enabled?: boolean;
}

// The BFF echoes the applied state; fall back to the requested value when the
// body is empty so a 200 with no payload does not read as "toggle failed".
const toggled =
  (requested: boolean) =>
  (r: AuthToggleResponse | null | undefined): boolean =>
    r?.enabled ?? requested;

export const setEndpointApiKeyAuth = (ref: EndpointRef, enabled: boolean, options?: ApiKeyAuthOptions): Promise<boolean> => bff.put<AuthToggleResponse>(`${endpointPath(ref)}/security/api-key`, { enabled, ...options }).then(toggled(enabled));

export const setEndpointJwtAuth = (ref: EndpointRef, enabled: boolean): Promise<boolean> => bff.put<AuthToggleResponse>(`${endpointPath(ref)}/security/jwt`, { enabled }).then(toggled(enabled));

/** Read the single active auth mode (+ options) of the exposed API. */
export const getEndpointSecurity = (ref: EndpointRef): Promise<SecurityConfig> => bff.get<SecurityConfig>(`${endpointPath(ref)}/security`);

/** Set the single active auth mode. The BFF clears the other mode + redeploys. */
export const setEndpointSecurity = (ref: EndpointRef, cfg: SecurityConfig): Promise<SecurityConfig> => bff.put<SecurityConfig>(`${endpointPath(ref)}/security`, cfg);

// ---------------------------------------------------------------------------
// Consumers — a consumer is a named api-key on the exposed endpoint.
//
// There is no subscription-token flow. The gateway enforces the api-key when the
// endpoint's security mode is "api-key"; the plaintext key is shown once at
// creation and is the credential the consumer sends (default header X-API-Key).
// ---------------------------------------------------------------------------

/** A masked api-key mapped onto the Consumer view-model (application = the key's identity). */
const keyToConsumer = (k: ApiKeySummary, restApiId: string): Consumer => ({
  application: { id: k.name, displayName: k.displayName ?? k.name },
  // ApiKeySummary has no creation timestamp; leave createdAt unset rather than
  // mislabelling the key's expiry as its creation time.
  subscription: { id: k.name, applicationId: k.name, restApiId, status: k.status },
});

/** A freshly-minted key mapped onto a Subscription — `token` carries the plaintext api-key (once). */
const resultToSubscription = (r: ApiKeyResult, restApiId: string): Subscription => ({
  id: r.keyId,
  applicationId: r.keyId,
  restApiId,
  token: r.apiKey,
  status: 'active',
});

export async function fetchConsumers(ref: EndpointRef): Promise<Consumer[]> {
  const restApiId = deriveRestApiId(ref);
  const keys = await listEndpointApiKeys(ref);
  return keys.map((k) => keyToConsumer(k, restApiId));
}

export async function createConsumer(input: CreateConsumerInput): Promise<Consumer> {
  const { appName, description, componentName, environmentName, endpointName } = input;
  const ref: EndpointRef = { componentName, environmentName, endpointName };
  const result = await createEndpointApiKey(ref, { displayName: appName });
  return {
    application: { id: result.keyId, displayName: appName, description },
    subscription: resultToSubscription(result, deriveRestApiId(ref)),
  };
}

/**
 * Re-issue a consumer's api-key: revoke the old key, then mint a new one under the same name.
 * The old key stops working the moment the revoke lands; the new plaintext is returned once.
 */
export async function regenerateConsumerToken(ref: EndpointRef, keyName: string, displayName: string): Promise<Subscription> {
  await revokeEndpointApiKey(ref, keyName);
  try {
    const result = await createEndpointApiKey(ref, { displayName });
    return resultToSubscription(result, deriveRestApiId(ref));
  } catch (err) {
    throw userFacingError(`The old API key was revoked, but a new one could not be issued for “${displayName}”. Close this dialog and create the consumer again.`, err);
  }
}

export const revokeConsumer = (ref: EndpointRef, keyName: string): Promise<void> => revokeEndpointApiKey(ref, keyName);
