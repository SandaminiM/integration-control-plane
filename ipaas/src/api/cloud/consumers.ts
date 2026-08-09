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
 * One wire-shape note: the spec returns bare JSON arrays for the list routes,
 * while most other BFF routes use the `{ items: [] }` envelope. `asList`
 * accepts both so a server-side switch to the envelope does not break the UI.
 */

import type { ApiExposure, ApiKeyAuthOptions, ApiKeyResult, ApiKeySummary, Consumer, ConsumerApplication, CreateApiKeyInput, CreateApplicationInput, CreateConsumerInput, EndpointRef, SecurityConfig, ConsumerCredential } from '../../types/consumers';
import { normalizeConsumerStatus } from '../../utils/apiConsumption';
import { userFacingError } from '../../utils/apiSecurity';
import { bff, items, seg, type ListResponse } from './_client';

/** Tolerates both the bare-array (spec) and `{ items: [] }` (BFF house style) list shapes. */
const asList = <T>(r: T[] | ListResponse<T> | null | undefined): T[] => (Array.isArray(r) ? r : items(r));

const endpointPath = ({ componentName, environmentName, endpointName }: EndpointRef): string => `/components/${seg(componentName)}/environments/${seg(environmentName)}/endpoints/${seg(endpointName)}`;

/**
 * The exposed API's handle is `{componentName}-{endpointName}` (per the spec's
 * `APIExposure.handle` / `CreateSubscriptionRequest.restApiId` examples). There
 * is no "get exposure" route, so this derivation is how the UI matches existing
 * credentials to the endpoint in view before anything is exposed in-session.
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
// Consumer applications
// ---------------------------------------------------------------------------

const listApplications = (projectName: string): Promise<ConsumerApplication[]> => bff.get<ConsumerApplication[] | ListResponse<ConsumerApplication>>(`/applications?projectName=${encodeURIComponent(projectName)}`).then(asList);

const createApplication = (input: CreateApplicationInput): Promise<ConsumerApplication> => bff.post<ConsumerApplication>('/applications', input);

const deleteApplication = (applicationId: string): Promise<void> => bff.delete<void>(`/applications/${seg(applicationId)}`);

// ---------------------------------------------------------------------------
// Consumers — a consumer application holding one api-key on the exposed endpoint.
//
// There is no subscription-token flow: the BFF implements /applications but not
// the spec's /subscriptions routes, so the credential is an endpoint api-key
// (shown once at creation, sent as X-API-Key) while the *application* is the
// durable identity of the consumer. That split is what makes the two distinct
// destructive actions possible:
//
//   revoke — kill the api-key, keep the application. The row stays, marked
//            revoked, and regenerating brings it back.
//   delete — kill the api-key *and* DELETE /applications/{id}. The row is gone.
//
// Applications are project-scoped and carry no endpoint reference of their own,
// so the endpoint they were created for is tagged into `description`. Anything
// listed by the endpoint's api-keys but not matching a tagged application still
// gets a row (keys minted before this, or a failed application list), so the
// panel degrades to the old key-only behaviour instead of rendering empty.
// ---------------------------------------------------------------------------

const ENDPOINT_TAG_PREFIX = 'endpoint:';

const endpointTag = (ref: EndpointRef): string => `${ENDPOINT_TAG_PREFIX}${ref.componentName}/${ref.environmentName}/${ref.endpointName}`;

/**
 * Groups an endpoint's api-keys by the consumer they belong to. Keys minted here
 * carry the application id as their `displayName`; older keys carry a plain name
 * and simply group under themselves.
 */
function groupKeysByConsumer(keys: ApiKeySummary[]): Map<string, ApiKeySummary[]> {
  const groups = new Map<string, ApiKeySummary[]>();
  for (const key of keys) {
    const consumerId = key.displayName || key.name;
    const group = groups.get(consumerId);
    if (group) group.push(key);
    else groups.set(consumerId, [key]);
  }
  return groups;
}

/**
 * One row from a consumer's keys. A consumer counts as active while any of its
 * keys still authenticates; with none left it is revoked but keeps its row.
 */
function toConsumer(application: ConsumerApplication, keys: ApiKeySummary[], restApiId: string): Consumer {
  const activeKey = keys.find((k) => normalizeConsumerStatus(k.status) === 'active');
  return {
    application,
    // ApiKeySummary has no creation timestamp; leave createdAt unset rather than
    // mislabelling the key's expiry as its creation time.
    credential: { id: activeKey?.name ?? keys[0]?.name ?? application.id, applicationId: application.id, restApiId, createdAt: application.createdAt },
    status: activeKey ? 'active' : 'revoked',
    credentialIds: keys.map((k) => k.name),
  };
}

/** A freshly-minted key as a credential — `token` carries the plaintext api-key (once). */
const resultToCredential = (r: ApiKeyResult, restApiId: string, applicationId: string): ConsumerCredential => ({
  id: r.keyId,
  applicationId,
  restApiId,
  token: r.apiKey,
});

export async function fetchConsumers(ref: EndpointRef, projectName?: string): Promise<Consumer[]> {
  const restApiId = deriveRestApiId(ref);
  const [keys, applications] = await Promise.all([
    listEndpointApiKeys(ref),
    // A consumer must still be listable when applications are unavailable, so a
    // failed list degrades to "no applications" rather than failing the panel.
    projectName ? listApplications(projectName).catch(() => [] as ConsumerApplication[]) : Promise.resolve([] as ConsumerApplication[]),
  ]);

  const groups = groupKeysByConsumer(keys);
  const tag = endpointTag(ref);
  const ofThisEndpoint = applications.filter((app) => app.description === tag);

  const rows = ofThisEndpoint.map((app) => toConsumer(app, groups.get(app.id) ?? [], restApiId));
  const claimed = new Set(ofThisEndpoint.map((app) => app.id));
  for (const [consumerId, group] of groups) {
    if (claimed.has(consumerId)) continue;
    rows.push(toConsumer({ id: consumerId, displayName: group[0].displayName || consumerId }, group, restApiId));
  }
  return rows;
}

export async function createConsumer(input: CreateConsumerInput): Promise<Consumer> {
  const { appName, projectName, componentName, environmentName, endpointName } = input;
  const ref: EndpointRef = { componentName, environmentName, endpointName };

  // The application is created first so the key can be minted under its id; if
  // the key fails the application is rolled back, otherwise the panel would show
  // a consumer that never had a credential. `description` carries the endpoint
  // tag rather than the caller's text — it is what scopes the row to this
  // endpoint, so it is not the user's to set.
  const application = await createApplication({ displayName: appName, projectName, description: endpointTag(ref) }).catch(() => null);
  const consumerId = application?.id ?? appName;

  let result: ApiKeyResult;
  try {
    result = await createEndpointApiKey(ref, { displayName: consumerId });
  } catch (err) {
    if (application) await deleteApplication(application.id).catch(() => undefined);
    throw err;
  }

  return {
    application: application ?? { id: consumerId, displayName: appName },
    credential: resultToCredential(result, deriveRestApiId(ref), consumerId),
    status: 'active',
    credentialIds: [result.keyId],
  };
}

/**
 * Re-issue a consumer's api-key in place: revoke every key it holds, then mint a
 * fresh one under the same consumer. The old keys stop working the moment the
 * revokes land; the new plaintext is returned once. The consumer application is
 * untouched, so this never adds a row to the list.
 */
export async function regenerateConsumerToken(ref: EndpointRef, consumer: Consumer): Promise<ConsumerCredential> {
  const name = consumer.application.displayName || consumer.application.id;
  await revokeConsumerKeys(ref, consumer);
  try {
    const result = await createEndpointApiKey(ref, { displayName: consumer.application.id });
    return resultToCredential(result, deriveRestApiId(ref), consumer.application.id);
  } catch (err) {
    throw userFacingError(`The old API key was revoked, but a new one could not be issued for “${name}”. Close this dialog and regenerate again.`, err);
  }
}

/**
 * Revokes every key a consumer holds. Already-revoked keys are tolerated: the
 * point is that no key survives, not that each revoke was the one that killed it.
 *
 * A consumer whose keys are all gone has no `credentialIds`, and its
 * `credential.id` falls back to the application id — not a key name. Revoking
 * that would 404 and take the caller (notably delete) down with it, so an empty
 * list is a no-op: there is nothing left to revoke.
 */
async function revokeConsumerKeys(ref: EndpointRef, consumer: Consumer): Promise<void> {
  await Promise.all(consumer.credentialIds.map((keyName) => revokeEndpointApiKey(ref, keyName)));
}

export const revokeConsumer = (ref: EndpointRef, consumer: Consumer): Promise<void> => revokeConsumerKeys(ref, consumer);

/**
 * Delete is not revoke: the credential is revoked *and* the consumer application
 * is removed, so the row disappears for good. The revoke runs first — a failed
 * application delete must never leave a live key behind an invisible consumer.
 */
export async function deleteConsumer(ref: EndpointRef, consumer: Consumer): Promise<void> {
  await revokeConsumerKeys(ref, consumer);
  await deleteApplication(consumer.application.id);
}

