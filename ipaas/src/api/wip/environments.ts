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
import { choreoClient, withScopeRetry } from './httpClients';
import { EnvironmentValidationError } from '../../utils/environment';
import type { CloudDataPlane, CreateEnvironmentData, EnvDeletionEligibility, EnvironmentTemplate, Environment, EnvironmentInput, Logger, UpdateLogLevelInput, ValidityResponse } from '../../types/environment';

const DEVOPS = '/devops/1.0.0/api/v1';

const ENVIRONMENTS_QUERY = `
  query GetEnvironments($orgUuid: String!, $projectId: String!) {
    environments(orgUuid: $orgUuid, type: "external", projectId: $projectId) {
      id, name, critical, templateId, dpId, apimEnvId, scaleToZeroEnabled
    }
  }`;

const ALL_ENVIRONMENTS_QUERY = `{
  environments { id, name, description, critical, dpId, templateId, createdAt }
}`;

const LOGGERS_QUERY = `
  query GetLoggers($environmentId: String!, $componentId: String!) {
    loggersByEnvironmentAndComponent(environmentId: $environmentId, componentId: $componentId) {
      componentName, logLevel, runtimeIds
    }
  }`;

const CREATE_ENVIRONMENT = `
  mutation CreateEnvironment($name: String!, $description: String!, $critical: Boolean!) {
    createEnvironment(environment: { name: $name, description: $description, critical: $critical }) {
      id, name, description, critical, createdAt
    }
  }`;

const UPDATE_ENVIRONMENT = `
  mutation UpdateEnvironment($environmentId: String!, $name: String!, $description: String!, $critical: Boolean!) {
    updateEnvironment(environmentId: $environmentId, name: $name, description: $description, critical: $critical) {
      id, name, description, critical, createdAt
    }
  }`;

const DELETE_ENVIRONMENT = `
  mutation DeleteEnvironment($environmentId: String!) {
    deleteEnvironment(environmentId: $environmentId)
  }`;

const UPDATE_LOG_LEVEL = `
  mutation UpdateLogLevel($input: UpdateLogLevelInput!) {
    updateLogLevel(input: $input) {
      success, message, commandIds
    }
  }`;

export async function fetchEnvironments(orgUuid: string, projectId: string): Promise<Environment[]> {
  return gql<{ environments: Environment[] }>(ENVIRONMENTS_QUERY, { orgUuid, projectId }).then((d) => d.environments);
}

export async function fetchAllEnvironments(): Promise<Environment[]> {
  return gql<{ environments: Environment[] }>(ALL_ENVIRONMENTS_QUERY).then((d) => d.environments);
}

export async function fetchCloudDataPlanes(orgUuid: string): Promise<CloudDataPlane[]> {
  return choreoClient.get<CloudDataPlane[]>(`/devops/1.0.0/api/v1/clusters/clouddataplanes?org_uuid=${encodeURIComponent(orgUuid)}`);
}

export async function fetchLoggers(environmentId: string, componentId: string): Promise<Logger[]> {
  return gql<{ loggersByEnvironmentAndComponent: Logger[] }>(LOGGERS_QUERY, { environmentId, componentId }).then((d) => d.loggersByEnvironmentAndComponent);
}

export async function createEnvironment(input: EnvironmentInput): Promise<Environment> {
  return gql<{ createEnvironment: Environment }>(CREATE_ENVIRONMENT, { ...input }).then((d) => d.createEnvironment);
}

export async function updateEnvironment(input: EnvironmentInput & { environmentId: string }): Promise<Environment> {
  return gql<{ updateEnvironment: Environment }>(UPDATE_ENVIRONMENT, { ...input }).then((d) => d.updateEnvironment);
}

export async function deleteEnvironment(environmentId: string): Promise<string> {
  return gql<{ deleteEnvironment: string }>(DELETE_ENVIRONMENT, { environmentId }).then((d) => d.deleteEnvironment);
}

export async function updateLogLevel(input: UpdateLogLevelInput): Promise<{ success: boolean; message: string; commandIds: string[] }> {
  return gql<{ updateLogLevel: { success: boolean; message: string; commandIds: string[] } }>(UPDATE_LOG_LEVEL, {
    input: { runtimeIds: input.runtimeIds, componentName: input.componentName, logLevel: input.logLevel },
  }).then((d) => d.updateLogLevel);
}

// --- Org environment templates + REST create/delete (devops API) ---

// Wire shape of a template row (snake_case); mapped to the domain type below.
interface RawEnvironmentTemplate {
  id: string;
  env_name: string;
  created_at?: string;
  region?: string;
  cluster_id?: string;
  choreo_env?: string;
  critical: boolean;
  dns_prefix?: string;
}

function toEnvironmentTemplate(raw: RawEnvironmentTemplate): EnvironmentTemplate {
  return {
    id: raw.id,
    name: raw.env_name,
    createdAt: raw.created_at,
    region: raw.region,
    clusterId: raw.cluster_id,
    choreoEnv: raw.choreo_env,
    critical: raw.critical,
    dnsPrefix: raw.dns_prefix,
  };
}

/** Org environment templates. Keyed by the numeric org id, not the uuid. */
export async function fetchEnvironmentTemplates(orgId: string): Promise<EnvironmentTemplate[]> {
  const res = await withScopeRetry(() => choreoClient.get<{ data: RawEnvironmentTemplate[] }>(`${DEVOPS}/organizations/${encodeURIComponent(orgId)}/environment-templates`));
  return (res.data ?? []).map(toEnvironmentTemplate);
}

function validateEnvName(orgUuid: string, name: string): Promise<ValidityResponse> {
  return withScopeRetry(() => choreoClient.post<ValidityResponse>(`${DEVOPS}/organizations/${encodeURIComponent(orgUuid)}/apim/environments/validate-name?name=${encodeURIComponent(name)}`, {}));
}

function validateVhost(orgUuid: string, vhost: string): Promise<ValidityResponse> {
  return withScopeRetry(() => choreoClient.post<ValidityResponse>(`${DEVOPS}/organizations/${encodeURIComponent(orgUuid)}/apim/environments/validate-vhost?vhost=${encodeURIComponent(vhost)}`, {}));
}

/**
 * Create an org environment the way Devant does: validate the name, then the
 * derived vhost, then POST the environment. Throws `EnvironmentValidationError`
 * when a pre-flight check fails so the form can flag the offending field.
 */
export async function createOrgEnvironment(orgUuid: string, input: CreateEnvironmentData & { vhost: string }): Promise<void> {
  const { vhost, ...data } = input;
  if (!(await validateEnvName(orgUuid, data.name)).validity) throw new EnvironmentValidationError('name');
  if (!(await validateVhost(orgUuid, vhost)).validity) throw new EnvironmentValidationError('vhost');
  await withScopeRetry(() => choreoClient.post<void>(`${DEVOPS}/organizations/${encodeURIComponent(orgUuid)}/environments`, data));
}

/** Whether an environment template can be deleted (and what is deployed to it). */
export async function getEnvDeleteEligibility(orgUuid: string, templateId: string): Promise<EnvDeletionEligibility> {
  return withScopeRetry(() => choreoClient.get<EnvDeletionEligibility>(`${DEVOPS}/organizations/${encodeURIComponent(orgUuid)}/environments/templates/${encodeURIComponent(templateId)}/deletion-eligibility`));
}

/** Delete an org environment by its template id. */
export async function deleteEnvironmentTemplate(orgUuid: string, templateId: string): Promise<void> {
  await withScopeRetry(() => choreoClient.delete<void>(`${DEVOPS}/organizations/${encodeURIComponent(orgUuid)}/environments/templates/${encodeURIComponent(templateId)}`));
}
