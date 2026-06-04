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

export const DeploymentStatus = {
  Active: 'Active',
  InProgress: 'InProgress',
  Error: 'Error',
  Suspended: 'Suspended',
  NotDeployed: 'NotDeployed',
} as const;

export type DeploymentStatus = (typeof DeploymentStatus)[keyof typeof DeploymentStatus];

export interface GqlReleaseMgtDeploymentRef {
  releaseMgtReleaseId: string;
  releaseMgtDeploymentId: string;
}

export interface GqlComponentDeployment {
  releaseId: string;
  cron: string;
  cronTimezone: string;
  deploymentStatusV2?: string | null;
  invokeUrl?: string | null;
  imageUrl?: string | null;
  configCount?: number;
  releaseMgtDeployment?: GqlReleaseMgtDeploymentRef | null;
  build?: {
    buildId: string;
    deployedAt?: string;
    runId?: string;
    commit?: {
      sha: string;
      message: string;
      isLatest: boolean;
      author: { name: string; date: string; email: string; avatarUrl: string };
    };
  };
}

export interface GqlDeploymentStatus {
  id: number;
  sha: string;
  started_at: string;
  completed_at: string;
  status: string;
  conclusion: string;
  conclusionV2: string;
  isAutoDeploy: boolean;
  isTriggeredAtCreation: boolean;
  name: string;
  failureReason: number;
  sourceCommitId: string;
  buildRef?: string;
}

export interface GqlReleaseMgtDeployment {
  id: string;
  release_mgt_id: string;
  environment_id: string;
  deployment_name: string;
  attempt: number;
  config_revision: number;
  status: string;
  comment: string;
  deployed_at: string;
  deployed_by: string;
  release_name: string;
  commit_hash: string;
  component_configs: {
    config_mapping_revision: number;
    schema_based_config_revision: number;
    api_settings: string;
  };
  created_at: string;
}

export interface GqlDeploymentTrackImage {
  imageId: string;
  createdAt: string;
  updatedAt: string;
  commitHash: string;
  commitMessage: string;
  builtAt: string;
  runId: string;
  author: {
    name: string;
    email: string;
    date: string;
    avatarUrl: string;
  };
}

export interface DeployDeploymentTrackInput {
  componentId: string;
  id: string;
  imageId: string;
  environmentId: string;
  deploymentPipelineId?: string;
  cronTimezone?: string;
  cron?: string;
  jobTimeoutSeconds?: number;
  cronJobAllowConcurrency?: boolean;
}

export interface PromoteInput {
  componentId: string;
  apiVersionId: string;
  sourceReleaseId: string;
  targetEnvironmentId: string;
  deploymentPipelineId: string;
}

export interface StopDeploymentInput {
  orgHandler: string;
  componentId: string;
  releaseId: string;
  // Required by the cloud (OpenChoreo) BFF
  environment?: string;
  type?: string;
  clearCron?: boolean;
}

export interface DeployPrebuiltImageInput {
  componentId: string;
  imageUrl: string;
  appBranch: string;
}
