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

import { gql } from '../graphql';
import { choreoClient, subscriptionsClient } from '../httpClients';
import type { OrgEntry, OrgComponentLimits, OrgSubscription, RegisterUserResponse } from '../../types/org';
import type { GqlProject } from '../../types/project';

// Types moved to src/types/org — re-exported here so existing imports continue to work

type RawOrgEntry = { handle?: string; orgHandle?: string; id?: string | number; orgId?: string | number; uuid?: string; orgUuid?: string; org_uuid?: string };

/** Fetches the list of orgs the current user belongs to. */
export async function fetchOrgList(): Promise<OrgEntry[]> {
  const data = await choreoClient.get<{ list?: RawOrgEntry[]; organizations?: RawOrgEntry[] }>('/orgs/1.0.0/orgs');
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
    const data = await choreoClient.get<{ isValid?: boolean; valid?: boolean }>(`/orgs/1.0.0/validate/orgname?orgName=${encodeURIComponent(orgName)}`);
    return data.isValid ?? data.valid ?? true;
  } catch (err) {
    // 404 means the endpoint is not yet deployed on this environment — treat name as available.
    if (err instanceof Error && err.message.startsWith('HTTP 404')) return true;
    throw err;
  }
}

/** Registers a new user + org. Returns the created org entry. */
export async function registerUser(orgName: string, termsAccepted: boolean, serviceName: string): Promise<RegisterUserResponse> {
  return choreoClient.post<RegisterUserResponse>('/orgs/1.0.0/register-user', { organization: { name: orgName }, termsAccepted, serviceName });
}

/** Initialises default environments for the org in the given region. */
export async function initOrg(orgUuid: string, region: string): Promise<void> {
  await choreoClient.post(`/devops/1.0.0/api/v1/organizations/${orgUuid}/projects/init`, { region });
}

const PROJECTS_QUERY = `
  query GetProjects($orgId: Int!) {
    projects(orgId: $orgId) {
      id, orgId, name, handler, description, version, createdDate, updatedAt, region, type, defaultDeploymentPipelineId
    }
  }`;

export async function fetchProjectsByOrgId(orgNumericId: number): Promise<GqlProject[]> {
  return gql<{ projects: GqlProject[] }>(PROJECTS_QUERY, { orgId: orgNumericId }).then((d) => d.projects ?? []);
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

/** Fetches orgs with uuid included (used by org-selector and related hooks). */
export async function fetchOrgs(): Promise<OrgEntry[]> {
  const raw = await choreoClient.get<Record<string, unknown> | RawOrgEntry[]>('/orgs/1.0.0/orgs');
  const list: RawOrgEntry[] = Array.isArray(raw) ? raw : ((raw.list ?? raw.organizations ?? []) as RawOrgEntry[]);
  return list
    .map((o) => ({
      handle: o.handle ?? o.orgHandle ?? '',
      numericId: parseInt(String(o.id ?? o.orgId ?? '0'), 10),
      uuid: o.uuid ?? o.orgUuid ?? o.org_uuid ?? '',
    }))
    .filter((o) => o.handle && o.numericId > 0);
}

export async function fetchOrgComponentLimits(orgUuid: string): Promise<OrgComponentLimits> {
  const json = await choreoClient.get<{ data: OrgComponentLimits }>(`/component-mgt/1.0.0/orgs/${encodeURIComponent(orgUuid)}/component-limits?originCloud=devant`);
  return json.data;
}

export async function fetchOrgSubscriptions(orgUuid: string): Promise<OrgSubscription[]> {
  const json = await subscriptionsClient.get<{ list?: OrgSubscription[] }>(`/api/organizations/${encodeURIComponent(orgUuid)}/subscriptions?cloudType=devant&origin=choreo-console`);
  return json.list ?? [];
}
