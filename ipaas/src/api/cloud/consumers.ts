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
 * BFF routes used:
 *   POST/DELETE /components/{c}/environments/{e}/endpoints/{ep}/expose
 *   GET/POST    …/endpoints/{ep}/api-keys        (list masked / mint plaintext once)
 *   DELETE      …/endpoints/{ep}/api-keys/{keyName}
 *   POST        …/endpoints/{ep}/test-key        (1h key, forces api-key-auth on)
 *   PUT         …/endpoints/{ep}/security/{api-key|jwt|subscription}
 *   GET/POST    /applications                     (list is project-scoped)
 *   DELETE      /applications/{id}
 *   GET/POST    /applications/{id}/subscriptions
 *   GET/DELETE  /applications/{id}/subscriptions/{subId}
 *
 * Two shape notes:
 *   - The spec returns bare JSON arrays for the list routes, while most other
 *     BFF routes use the `{ items: [] }` envelope. `asList` accepts both so a
 *     server-side switch to the envelope does not break the UI.
 *   - The list-subscriptions route documents `token`, but only create and the
 *     single-subscription GET are guaranteed to populate it. Callers that need
 *     the token re-read the subscription (see `fetchSubscription`).
 */

import type { ApiExposure, ApiKeyAuthOptions, ApiKeyResult, ApiKeySummary, Consumer, ConsumerApplication, CreateApiKeyInput, CreateConsumerInput, EndpointRef, Subscription } from '../../types/consumers';
import { bff, items, q, seg, type ListResponse } from './_client';

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
export const deriveRestApiId = (ref: EndpointRef): string => `${ref.componentName}-${ref.endpointName}`;

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

export const setEndpointSubscriptionValidation = (ref: EndpointRef, enabled: boolean, header?: string): Promise<boolean> =>
  bff.put<AuthToggleResponse>(`${endpointPath(ref)}/security/subscription`, { enabled, ...(header ? { header } : {}) }).then(toggled(enabled));

// ---------------------------------------------------------------------------
// Consumer applications + subscriptions
// ---------------------------------------------------------------------------

export const fetchApplications = (projectName: string): Promise<ConsumerApplication[]> => bff.get<ConsumerApplication[] | ListResponse<ConsumerApplication>>(`/applications${q({ projectName })}`).then(asList);

export const fetchSubscriptions = (applicationId: string): Promise<Subscription[]> => bff.get<Subscription[] | ListResponse<Subscription>>(`/applications/${seg(applicationId)}/subscriptions`).then(asList);

export const fetchSubscription = (applicationId: string, subscriptionId: string): Promise<Subscription> => bff.get<Subscription>(`/applications/${seg(applicationId)}/subscriptions/${seg(subscriptionId)}`);

export const deleteApplication = (applicationId: string): Promise<void> => bff.delete<void>(`/applications/${seg(applicationId)}`);

const createApplication = (input: { displayName: string; projectName: string; description?: string }): Promise<ConsumerApplication> => bff.post<ConsumerApplication>('/applications', input);

/** Subscribe by the component/environment/endpoint triple — the BFF derives the handle. */
const createSubscription = (applicationId: string, ref: EndpointRef): Promise<Subscription> => bff.post<Subscription>(`/applications/${seg(applicationId)}/subscriptions`, ref);

const deleteSubscription = (applicationId: string, subscriptionId: string): Promise<void> => bff.delete<void>(`/applications/${seg(applicationId)}/subscriptions/${seg(subscriptionId)}`);

// ---------------------------------------------------------------------------
// Composite reads/writes backing the Consumers panel
// ---------------------------------------------------------------------------

/**
 * Applications in the project that are subscribed to this endpoint's API.
 * Applications are org-scoped and can subscribe to many APIs, so the panel
 * shows the ones whose subscription targets this endpoint's handle.
 *
 * A per-application subscription read that fails (e.g. an application deleted
 * mid-flight) is skipped rather than failing the whole list.
 */
export async function fetchConsumers(projectName: string, ref: EndpointRef): Promise<Consumer[]> {
  const restApiId = deriveRestApiId(ref);
  const applications = await fetchApplications(projectName);
  const perApp = await Promise.all(
    applications.map(async (application): Promise<Consumer[]> => {
      try {
        const subscriptions = await fetchSubscriptions(application.id);
        return subscriptions.filter((s) => s.restApiId === restApiId).map((subscription) => ({ application, subscription }));
      } catch {
        return [];
      }
    }),
  );
  return perApp.flat();
}

/**
 * Create the consumer application and subscribe it to this API. If the
 * subscription fails the just-created application is removed, so a half-created
 * consumer never shows up in the list.
 */
export async function createConsumer(input: CreateConsumerInput): Promise<Consumer> {
  const { projectName, appName, description, componentName, environmentName, endpointName } = input;
  const application = await createApplication({ displayName: appName, projectName, description });
  try {
    const subscription = await createSubscription(application.id, { componentName, environmentName, endpointName });
    return { application, subscription };
  } catch (err) {
    await deleteApplication(application.id).catch(() => undefined);
    throw err;
  }
}

/**
 * Re-issue the subscription token. The BFF has no rotate route, so this
 * unsubscribes and resubscribes — the old `Subscription-Key` stops working the
 * moment the delete lands.
 */
export async function regenerateConsumerToken(applicationId: string, subscriptionId: string, ref: EndpointRef): Promise<Subscription> {
  await deleteSubscription(applicationId, subscriptionId);
  return createSubscription(applicationId, ref);
}

export const revokeConsumer = (applicationId: string, subscriptionId: string): Promise<void> => deleteSubscription(applicationId, subscriptionId);
