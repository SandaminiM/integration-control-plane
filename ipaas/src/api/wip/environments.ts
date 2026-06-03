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
import { choreoClient } from './httpClients';
import type { Environment, CloudDataPlane, Logger, EnvironmentInput, UpdateLogLevelInput } from '../../types/environment';

const ENVIRONMENTS_QUERY = `
  query GetEnvironments($orgUuid: String!, $projectId: String!) {
    environments(orgUuid: $orgUuid, type: "external", projectId: $projectId) {
      id, name, critical, templateId, dpId, apimEnvId, scaleToZeroEnabled
    }
  }`;

const ALL_ENVIRONMENTS_QUERY = `{
  environments { id, name, description, critical, dpId, createdAt }
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
