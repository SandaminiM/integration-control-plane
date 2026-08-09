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
 * Cloud API security & exposure, against the ipaas-service BFF. Org context comes
 * from the JWT, so no call takes an org parameter.
 */

import type { ApiExposure, ApiKeyAuthOptions, ApiKeyResult, ApiKeySummary, Consumer, ConsumerApplication, CreateApiKeyInput, CreateApplicationInput, CreateConsumerInput, EndpointRef, SecurityConfig, ConsumerCredential } from '../../types/consumers';
import { normalizeConsumerStatus } from '../../utils/apiConsumption';
import { userFacingError } from '../../utils/apiSecurity';
import { bff, items, seg, type ListResponse } from './_client';

/** List routes return a bare array; other BFF routes use `{ items: [] }`. Accept both. */
const asList = <T>(r: T[] | ListResponse<T> | null | undefined): T[] => (Array.isArray(r) ? r : items(r));

const endpointPath = ({ componentName, environmentName, endpointName }: EndpointRef): string => `/components/${seg(componentName)}/environments/${seg(environmentName)}/endpoints/${seg(endpointName)}`;

/** No "get exposure" route exists, so the handle is derived. Prefer `exposeEndpoint`'s when known. */
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

// A 200 with an empty body must not read as "toggle failed".
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
// Consumers
//
// The BFF implements /applications but not the spec's /subscriptions routes, so
// the credential is an endpoint api-key while the application is the consumer's
// durable identity — which is what lets revoke (key only) and delete (key +
// application) differ. Applications carry no endpoint reference, so the endpoint
// is tagged into `description`.
// ---------------------------------------------------------------------------

const ENDPOINT_TAG_PREFIX = 'endpoint:';

const endpointTag = (ref: EndpointRef): string => `${ENDPOINT_TAG_PREFIX}${ref.componentName}/${ref.environmentName}/${ref.endpointName}`;

/** Keys minted here carry the application id as `displayName`; older keys group under their own name. */
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

function toConsumer(row: { id: string; displayName: string; application?: ConsumerApplication }, keys: ApiKeySummary[], restApiId: string): Consumer {
  const activeKey = keys.find((k) => normalizeConsumerStatus(k.status) === 'active');
  return {
    ...row,
    credential: { id: activeKey?.name ?? keys[0]?.name ?? row.id, applicationId: row.id, restApiId, createdAt: row.application?.createdAt },
    status: activeKey ? 'active' : 'revoked',
    credentialIds: keys.map((k) => k.name),
  };
}

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
    // A failed application list must not take the whole panel down.
    projectName ? listApplications(projectName).catch(() => [] as ConsumerApplication[]) : Promise.resolve([] as ConsumerApplication[]),
  ]);

  const groups = groupKeysByConsumer(keys);
  const tag = endpointTag(ref);
  const ofThisEndpoint = applications.filter((app) => app.description === tag);

  const rows = ofThisEndpoint.map((app) => toConsumer({ id: app.id, displayName: app.displayName || app.id, application: app }, groups.get(app.id) ?? [], restApiId));
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

  // Application first so the key can be minted under its id; rolled back below if
  // the key fails, else the panel shows a consumer that never had a credential.
  const application = await createApplication({ displayName: appName, projectName, description: endpointTag(ref) });

  let result: ApiKeyResult;
  try {
    result = await createEndpointApiKey(ref, { displayName: application.id });
  } catch (err) {
    await deleteApplication(application.id).catch(() => undefined);
    throw err;
  }

  return {
    id: application.id,
    displayName: appName,
    application,
    credential: resultToCredential(result, deriveRestApiId(ref), application.id),
    status: 'active',
    credentialIds: [result.keyId],
  };
}

/** Revoke every key, then mint a fresh one under the same application — never adds a row. */
export async function regenerateConsumerToken(ref: EndpointRef, consumer: Consumer): Promise<ConsumerCredential> {
  await revokeConsumerKeys(ref, consumer);
  try {
    const result = await createEndpointApiKey(ref, { displayName: consumer.id });
    return resultToCredential(result, deriveRestApiId(ref), consumer.id);
  } catch (err) {
    throw userFacingError(`The old API key was revoked, but a new one could not be issued for “${consumer.displayName}”. Close this dialog and regenerate again.`, err);
  }
}

// An empty list is a no-op: `credential.id` falls back to the application id, which
// is not a key name, so revoking it would 404 and take delete down with it.
async function revokeConsumerKeys(ref: EndpointRef, consumer: Consumer): Promise<void> {
  await Promise.all(consumer.credentialIds.map((keyName) => revokeEndpointApiKey(ref, keyName)));
}

export const revokeConsumer = (ref: EndpointRef, consumer: Consumer): Promise<void> => revokeConsumerKeys(ref, consumer);

/**
 * Revoke runs first — a failed application delete must not leave a live key behind an
 * invisible row. A key-only row has no application to delete; revoking is the whole job.
 */
export async function deleteConsumer(ref: EndpointRef, consumer: Consumer): Promise<void> {
  await revokeConsumerKeys(ref, consumer);
  if (consumer.application) await deleteApplication(consumer.application.id);
}

