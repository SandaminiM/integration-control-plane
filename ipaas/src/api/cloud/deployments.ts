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

// TODO: implement using Choreo v3 REST APIs

import type { ComponentDeployment, BuildRun, ReleaseMgtDeployment, DeploymentTrackImage, DeployDeploymentTrackInput, PromoteInput, StopDeploymentInput, DeployPrebuiltImageInput } from '../../types/deployment';
import type { EnvEndpoint } from '../../types/component';
import type { DeployComponentInput } from '../../types/build';

const ni = (name: string): never => { throw new Error(`[cloud] deployments.${name}: not implemented`); };

export const fetchComponentDeployment = (_orgHandler: string, _orgUuid: string, _componentId: string, _versionId: string, _environmentId: string): Promise<ComponentDeployment | null> => ni('fetchComponentDeployment');
export const fetchEnvEndpoints = (_componentId: string, _versionId: string, _releaseId: string): Promise<EnvEndpoint[]> => ni('fetchEnvEndpoints');
export const fetchDeploymentStatus = (_componentId: string, _versionId: string): Promise<BuildRun[]> => ni('fetchDeploymentStatus');
export const fetchReleaseMgtDeployments = (_orgUuid: string, _projectId: string, _componentId: string, _versionId: string, _environmentId: string): Promise<ReleaseMgtDeployment[]> => ni('fetchReleaseMgtDeployments');
export const fetchDeploymentTrackImages = (_componentId: string, _versionId: string): Promise<DeploymentTrackImage[]> => ni('fetchDeploymentTrackImages');
export const deployDeploymentTrack = (_input: DeployDeploymentTrackInput): Promise<string> => ni('deployDeploymentTrack');
export const triggerBuild = (_input: DeployComponentInput): Promise<{ message: string; success: boolean }> => ni('triggerBuild');
export const promote = (_input: PromoteInput): Promise<string> => ni('promote');
export const stopDeployment = (_input: StopDeploymentInput): Promise<string> => ni('stopDeployment');
export const redeployDeployment = (_input: { orgHandler: string; componentId: string; releaseId: string; type: string; releaseMgtReleaseId?: string; releaseMgtDeploymentId?: string }): Promise<string> => ni('redeployDeployment');
export const deployPrebuiltImage = (_input: DeployPrebuiltImageInput): Promise<string> => ni('deployPrebuiltImage');
