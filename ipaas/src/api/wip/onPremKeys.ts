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

import { choreoClient } from './httpClients';
import type { OnPremKey, OnPremKeySubscription } from '../../types/onPremKey';

// on-prem-key-mgt service (same gateway host as graphql, via choreoClient).
// Keyed by the org HANDLE in the path; per-key ops use the key's `handle` UUID.
const base = (orgHandle: string) => `/onprem-key-mgt/1.0.0/orgs/${encodeURIComponent(orgHandle)}`;

// Generate/rename send the full model, but only `displayName` is meaningful.
const keyBody = (displayName: string) => ({ displayName, key: '', handle: '', status: '' });

export async function fetchOnPremKeys(orgHandle: string): Promise<OnPremKey[]> {
  return choreoClient.get<OnPremKey[]>(`${base(orgHandle)}/keys`);
}

export async function fetchOnPremKeySubscription(orgHandle: string): Promise<OnPremKeySubscription> {
  return choreoClient.get<OnPremKeySubscription>(`${base(orgHandle)}/keys/subscription-info`);
}

export async function generateOnPremKey(orgHandle: string, displayName: string): Promise<OnPremKey> {
  return choreoClient.post<OnPremKey>(`${base(orgHandle)}/keys`, keyBody(displayName));
}

export async function regenerateOnPremKey(orgHandle: string, handle: string): Promise<OnPremKey> {
  return choreoClient.post<OnPremKey>(`${base(orgHandle)}/keys/${encodeURIComponent(handle)}/regenerate`);
}

export async function renameOnPremKey(orgHandle: string, handle: string, displayName: string): Promise<OnPremKey> {
  return choreoClient.put<OnPremKey>(`${base(orgHandle)}/keys/${encodeURIComponent(handle)}`, keyBody(displayName));
}

export async function revokeOnPremKey(orgHandle: string, handle: string): Promise<OnPremKey> {
  return choreoClient.post<OnPremKey>(`${base(orgHandle)}/keys/${encodeURIComponent(handle)}/revoke`);
}
