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

import { authenticatedFetch } from '../auth/tokenManager';
import { choreoDevopsApiUrl } from '../config/api';

export interface OrgEntry {
  handle: string;
  numericId: number;
}

export interface RegisterUserResponse {
  organizations?: Array<{ handle?: string; orgHandle?: string; name?: string; id?: number; orgId?: number }>;
  idpId?: string;
}

/** Fetches the list of orgs the current user belongs to. */
export async function fetchOrgList(): Promise<OrgEntry[]> {
  const res = await authenticatedFetch(`${window.API_CONFIG.choreoOrgApiUrl}/orgs`);
  if (!res.ok) throw new Error('Failed to fetch orgs');
  const data = await res.json();
  const list: Array<{ handle?: string; orgHandle?: string; id?: string | number; orgId?: string | number }> = data.list ?? data.organizations ?? (Array.isArray(data) ? data : []);
  return list
    .map((o) => ({
      handle: o.handle ?? o.orgHandle ?? '',
      numericId: parseInt(String(o.id ?? o.orgId ?? '0'), 10),
    }))
    .filter((o) => o.handle && o.numericId > 0);
}

/** Validates whether an org name is available. Returns true if available. */
export async function validateOrgName(orgName: string): Promise<boolean> {
  const url = new URL(`${window.API_CONFIG.choreoOrgApiUrl}/validate/orgname`);
  url.searchParams.set('orgName', orgName);
  const res = await authenticatedFetch(url.toString());
  if (!res.ok) return true; // endpoint may not exist — treat as available
  const data: { isValid?: boolean; valid?: boolean } = await res.json();
  return data.isValid ?? data.valid ?? true;
}

/** Registers a new user + org. Returns the created org entry. */
export async function registerUser(orgName: string, termsAccepted: boolean, serviceName: string): Promise<RegisterUserResponse> {
  const res = await authenticatedFetch(`${window.API_CONFIG.choreoOrgApiUrl}/register-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organization: { name: orgName }, termsAccepted, serviceName }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Organization creation failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<RegisterUserResponse>;
}

/** Initialises default environments for the org in the given region. */
export async function initOrg(orgUuid: string, region: string): Promise<void> {
  const res = await authenticatedFetch(`${choreoDevopsApiUrl()}/api/v1/organizations/${orgUuid}/projects/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ region }),
  });
  if (!res.ok) throw new Error(`Failed to initialize organization (${res.status})`);
}

/** Creates the default project for a newly onboarded org. Returns { id, handler }. */
export async function createDefaultProject(orgNumericId: number, orgHandler: string, projectHandler = 'default'): Promise<{ id: string; handler: string }> {
  const res = await authenticatedFetch(window.API_CONFIG.graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation {
        createProject(project: {
          name: "Default",
          description: "This is a default project created by WSO2 Integration Platform",
          projectHandler: "${projectHandler}",
          orgId: ${orgNumericId},
          orgHandler: "${orgHandler}",
          version: "1.0.0"
        }) { id handler }
      }`,
    }),
  });
  if (!res.ok) throw new Error(`Failed to create default project (${res.status})`);
  const data: { data?: { createProject?: { id: string; handler: string } }; errors?: unknown[] } = await res.json();
  if (data.errors || !data.data?.createProject) throw new Error('Failed to create default project');
  return data.data.createProject;
}
