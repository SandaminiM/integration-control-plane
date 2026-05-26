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

// TODO: implement using ICP local REST APIs

import type { GqlComponentDeployment, GqlDeploymentStatus, GqlReleaseMgtDeployment, GqlDeploymentTrackImage, DeployDeploymentTrackInput, PromoteInput, StopDeploymentInput, DeployPrebuiltImageInput } from '../../types/deployment';
import type { GqlEnvEndpoint } from '../../types/component';

const ni = (name: string): never => { throw new Error(`[icp] deployments.${name}: not implemented`); };

export const fetchComponentDeployment = (_orgHandler: string, _orgUuid: string, _componentId: string, _versionId: string, _environmentId: string): Promise<GqlComponentDeployment | null> => ni('fetchComponentDeployment');
export const fetchEnvEndpoints = (_componentId: string, _versionId: string, _releaseId: string): Promise<GqlEnvEndpoint[]> => ni('fetchEnvEndpoints');
export const fetchDeploymentStatus = (_componentId: string, _versionId: string): Promise<GqlDeploymentStatus[]> => ni('fetchDeploymentStatus');
export const fetchReleaseMgtDeployments = (_orgUuid: string, _projectId: string, _componentId: string, _versionId: string, _environmentId: string): Promise<GqlReleaseMgtDeployment[]> => ni('fetchReleaseMgtDeployments');
export const fetchDeploymentTrackImages = (_componentId: string, _versionId: string): Promise<GqlDeploymentTrackImage[]> => ni('fetchDeploymentTrackImages');
export const deployDeploymentTrack = (_input: DeployDeploymentTrackInput): Promise<string> => ni('deployDeploymentTrack');
export const triggerBuild = (_input: { orgHandler: string; projectId: string; componentId: string; versionId: string; branch: string; commitId?: string }): Promise<{ message: string; success: boolean }> => ni('triggerBuild');
export const promote = (_input: PromoteInput): Promise<string> => ni('promote');
export const stopDeployment = (_input: StopDeploymentInput): Promise<string> => ni('stopDeployment');
export const redeployDeployment = (_input: { orgHandler: string; componentId: string; releaseId: string; type: string; releaseMgtReleaseId?: string; releaseMgtDeploymentId?: string }): Promise<string> => ni('redeployDeployment');
export const deployPrebuiltImage = (_input: DeployPrebuiltImageInput): Promise<string> => ni('deployPrebuiltImage');
