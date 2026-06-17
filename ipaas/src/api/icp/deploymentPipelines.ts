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

import type { CreateDeploymentPipelineRequest, DeploymentPipeline, EnvTemplate, PipelineDeletionEligibility } from '../../types/deploymentPipeline';

const ni = (name: string): never => {
  throw new Error(`[icp] deploymentPipelines.${name}: not implemented`);
};

export const fetchEnvTemplates = (_orgNumericId: number): Promise<EnvTemplate[]> => ni('fetchEnvTemplates');
export const fetchOrgDeploymentPipelines = (_orgUuid: string): Promise<DeploymentPipeline[]> => ni('fetchOrgDeploymentPipelines');
export const fetchProjectDeploymentPipelines = (_orgUuid: string, _projectId: string): Promise<DeploymentPipeline[]> => ni('fetchProjectDeploymentPipelines');
export const createDeploymentPipeline = (_orgUuid: string, _input: CreateDeploymentPipelineRequest): Promise<DeploymentPipeline> => ni('createDeploymentPipeline');
export const updateDeploymentPipeline = (_orgUuid: string, _pipelineId: string, _input: CreateDeploymentPipelineRequest): Promise<DeploymentPipeline> => ni('updateDeploymentPipeline');
export const deleteDeploymentPipeline = (_orgUuid: string, _pipelineId: string): Promise<void> => ni('deleteDeploymentPipeline');
export const fetchPipelineDeletionEligibility = (_orgUuid: string, _pipelineId: string): Promise<PipelineDeletionEligibility> => ni('fetchPipelineDeletionEligibility');
export const updateProjectDeploymentPipelines = (_orgUuid: string, _projectId: string, _deploymentPipelineIds: string[]): Promise<string[]> => ni('updateProjectDeploymentPipelines');
export const setDefaultProjectDeploymentPipeline = (_orgUuid: string, _projectId: string, _defaultDeploymentPipelineId: string): Promise<string> => ni('setDefaultProjectDeploymentPipeline');
