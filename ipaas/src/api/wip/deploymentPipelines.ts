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
import type { CreateDeploymentPipelineRequest, DeploymentPipeline, EnvTemplate, PipelineDeletionEligibility } from '../../types/deploymentPipeline';

// devops CD-pipeline API (same host/gateway as graphql, reached via choreoClient).
// Org-scoped routes use the org UUID; environment-templates use the org numeric id.
const BASE = '/devops/1.0.0/api/v1';
const org = (orgUuid: string) => `${BASE}/organizations/${encodeURIComponent(orgUuid)}`;

// Most endpoints wrap the payload in `{ data: ... }`; unwrap to the domain type here.
type Wrapped<T> = { data: T };

export async function fetchEnvTemplates(orgNumericId: number): Promise<EnvTemplate[]> {
  const res = await choreoClient.get<Wrapped<EnvTemplate[]>>(`${BASE}/organizations/${orgNumericId}/environment-templates`);
  return res.data;
}

export async function fetchOrgDeploymentPipelines(orgUuid: string): Promise<DeploymentPipeline[]> {
  const res = await choreoClient.get<Wrapped<DeploymentPipeline[]>>(`${org(orgUuid)}/deployment-pipelines`);
  return res.data;
}

export async function fetchProjectDeploymentPipelines(orgUuid: string, projectId: string): Promise<DeploymentPipeline[]> {
  const res = await choreoClient.get<Wrapped<DeploymentPipeline[]>>(`${org(orgUuid)}/projects/${encodeURIComponent(projectId)}/deployment-pipelines`);
  return res.data;
}

export async function createDeploymentPipeline(orgUuid: string, input: CreateDeploymentPipelineRequest): Promise<DeploymentPipeline> {
  const res = await choreoClient.post<Wrapped<DeploymentPipeline>>(`${org(orgUuid)}/deployment-pipelines`, input);
  return res.data;
}

export async function updateDeploymentPipeline(orgUuid: string, pipelineId: string, input: CreateDeploymentPipelineRequest): Promise<DeploymentPipeline> {
  const res = await choreoClient.put<Wrapped<DeploymentPipeline>>(`${org(orgUuid)}/deployment-pipelines/${encodeURIComponent(pipelineId)}`, input);
  return res.data;
}

export async function deleteDeploymentPipeline(orgUuid: string, pipelineId: string): Promise<void> {
  await choreoClient.delete<void>(`${org(orgUuid)}/deployment-pipelines/${encodeURIComponent(pipelineId)}`);
}

export async function fetchPipelineDeletionEligibility(orgUuid: string, pipelineId: string): Promise<PipelineDeletionEligibility> {
  // This endpoint returns the eligibility object directly (no `{ data }` wrapper).
  return choreoClient.get<PipelineDeletionEligibility>(`${org(orgUuid)}/deployment-pipelines/${encodeURIComponent(pipelineId)}/deletion-eligibility`);
}

export async function updateProjectDeploymentPipelines(orgUuid: string, projectId: string, deploymentPipelineIds: string[]): Promise<string[]> {
  const res = await choreoClient.put<Wrapped<{ deploymentPipelineIds: string[] }>>(`${org(orgUuid)}/projects/${encodeURIComponent(projectId)}/deployment-pipelines`, { deploymentPipelineIds });
  return res.data.deploymentPipelineIds;
}

export async function setDefaultProjectDeploymentPipeline(orgUuid: string, projectId: string, defaultDeploymentPipelineId: string): Promise<string> {
  const res = await choreoClient.patch<Wrapped<{ defaultDeploymentPipelineId: string }>>(`${org(orgUuid)}/projects/${encodeURIComponent(projectId)}/default-deployment-pipeline`, { defaultDeploymentPipelineId });
  return res.data.defaultDeploymentPipelineId;
}
