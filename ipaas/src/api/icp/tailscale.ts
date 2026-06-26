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

import type {
  ByoiEndpointFileContents,
  ConfigMapWriteData,
  ConfigMountWriteData,
  CreateByoiComponentInput,
  CreateByoiComponentResult,
  DevopsConfigMap,
  DevopsConfigMapDetails,
  DevopsConfigMount,
  DevopsSecret,
  DevopsVolume,
  DevopsVolumeMount,
  ReleaseDetails,
  SecretWriteData,
  VolumeMountWriteData,
  VolumeWriteData,
} from '../../types/tailscale';

// Intentionally a stub (the standard icp-stub contract — see src/api/AGENTS.md).
const ni = (name: string): never => {
  throw new Error(`[icp] tailscale.${name}: not implemented`);
};

export const getSampleRegistryId = (_orgUuid: string): Promise<string> => ni('getSampleRegistryId');
export const createByoiComponent = (_input: CreateByoiComponentInput): Promise<CreateByoiComponentResult> => ni('createByoiComponent');
export const deployByoiImage = (_componentId: string, _releaseId: string, _imageUrl: string): Promise<{ message: string; success: boolean }> => ni('deployByoiImage');
export const getReleaseById = (_orgUuid: string, _projectId: string, _componentId: string, _releaseId: string): Promise<ReleaseDetails> => ni('getReleaseById');
export const getSecrets = (_orgUuid: string, _projectId: string, _environmentId: string): Promise<DevopsSecret[]> => ni('getSecrets');
export const createSecret = (_orgUuid: string, _projectId: string, _data: SecretWriteData): Promise<DevopsSecret> => ni('createSecret');
export const updateSecret = (_orgUuid: string, _projectId: string, _secretId: string, _data: SecretWriteData): Promise<DevopsSecret> => ni('updateSecret');
export const getConfigMaps = (_orgUuid: string, _projectId: string, _environmentId: string): Promise<DevopsConfigMap[]> => ni('getConfigMaps');
export const getConfigMapDetails = (_orgUuid: string, _projectId: string, _environmentId: string, _configMapId: string): Promise<DevopsConfigMapDetails> => ni('getConfigMapDetails');
export const createConfigMap = (_orgUuid: string, _projectId: string, _data: ConfigMapWriteData): Promise<DevopsConfigMap> => ni('createConfigMap');
export const updateConfigMapData = (_orgUuid: string, _projectId: string, _configMapId: string, _data: ConfigMapWriteData): Promise<DevopsConfigMapDetails> => ni('updateConfigMapData');
export const getContainerConfigMounts = (_orgUuid: string, _projectId: string, _componentId: string, _releaseId: string, _containerId: string): Promise<DevopsConfigMount[]> => ni('getContainerConfigMounts');
export const mountConfig = (_orgUuid: string, _projectId: string, _componentId: string, _data: ConfigMountWriteData): Promise<DevopsConfigMount> => ni('mountConfig');
export const updateConfigMount = (_orgUuid: string, _projectId: string, _path: { componentId: string; releaseId: string; containerId: string; mountId: string }, _data: Record<string, unknown>): Promise<DevopsConfigMount> => ni('updateConfigMount');
export const createVolume = (_orgUuid: string, _projectId: string, _data: VolumeWriteData): Promise<DevopsVolume> => ni('createVolume');
export const mountVolume = (_orgUuid: string, _projectId: string, _path: { appId: string; appEnvId: string; containerId: string }, _data: VolumeMountWriteData): Promise<DevopsVolumeMount> => ni('mountVolume');
export const getByoiEndpointsYaml = (_orgUuid: string, _projectId: string, _componentId: string, _releaseId: string): Promise<ByoiEndpointFileContents> => ni('getByoiEndpointsYaml');
export const updateByoiEndpointsYaml = (_orgUuid: string, _projectId: string, _componentId: string, _releaseId: string, _endpointsYaml: string): Promise<void> => ni('updateByoiEndpointsYaml');
