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

import { gql } from './graphql';
import { devopsClient, orgClient } from './http';

export interface OrgEntry {
  handle: string;
  numericId: number;
}

export interface RegisterUserResponse {
  organizations?: Array<{ handle?: string; orgHandle?: string; name?: string; id?: number; orgId?: number }>;
  idpId?: string;
}

type RawOrgEntry = { handle?: string; orgHandle?: string; id?: string | number; orgId?: string | number };

/** Fetches the list of orgs the current user belongs to. */
export async function fetchOrgList(): Promise<OrgEntry[]> {
  const data = await orgClient.get<{ list?: RawOrgEntry[]; organizations?: RawOrgEntry[] }>('/orgs');
  const list = data.list ?? data.organizations ?? [];
  return list
    .map((o) => ({
      handle: o.handle ?? o.orgHandle ?? '',
      numericId: parseInt(String(o.id ?? o.orgId ?? '0'), 10),
    }))
    .filter((o) => o.handle && o.numericId > 0);
}

/** Validates whether an org name is available. Returns true if available. */
export async function validateOrgName(orgName: string): Promise<boolean> {
  try {
    const data = await orgClient.get<{ isValid?: boolean; valid?: boolean }>(`/validate/orgname?orgName=${encodeURIComponent(orgName)}`);
    return data.isValid ?? data.valid ?? true;
  } catch (err) {
    // 404 means the endpoint is not yet deployed on this environment — treat name as available.
    if (err instanceof Error && err.message.startsWith('HTTP 404')) return true;
    throw err;
  }
}

/** Registers a new user + org. Returns the created org entry. */
export async function registerUser(orgName: string, termsAccepted: boolean, serviceName: string): Promise<RegisterUserResponse> {
  return orgClient.post<RegisterUserResponse>('/register-user', { organization: { name: orgName }, termsAccepted, serviceName });
}

/** Initialises default environments for the org in the given region. */
export async function initOrg(orgUuid: string, region: string): Promise<void> {
  await devopsClient.post(`/api/v1/organizations/${orgUuid}/projects/init`, { region });
}

/** Creates the default project for a newly onboarded org. Returns { id, handler }. */
export async function createDefaultProject(orgNumericId: number, orgHandler: string, projectHandler = 'default'): Promise<{ id: string; handler: string }> {
  const data = await gql<{ createProject: { id: string; handler: string } }>(
    `mutation CreateDefaultProject($projectHandler: String!, $orgId: Int!, $orgHandler: String!) {
      createProject(project: {
        name: "Default",
        description: "This is a default project created by WSO2 Integration Platform",
        projectHandler: $projectHandler,
        orgId: $orgId,
        orgHandler: $orgHandler,
        version: "1.0.0"
      }) { id handler }
    }`,
    { projectHandler, orgId: orgNumericId, orgHandler },
  );
  if (!data.createProject) throw new Error('Failed to create default project');
  return data.createProject;
}
