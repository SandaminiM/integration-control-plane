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
  ConfigMapWriteData,
  ConfigMountPath,
  ConfigMountWriteData,
  ContainerWriteData,
  DevopsConfigMap,
  DevopsConfigMapDetails,
  DevopsConfigMount,
  DevopsSecret,
  DevopsSecretDetails,
  ReleaseContainer,
  ReleaseDetails,
  SecretWriteData,
} from '../../types/devopsConfigs';

// Intentionally a stub (the standard icp-stub contract — see src/api/AGENTS.md).
const ni = (name: string): never => {
  throw new Error(`[icp] devopsConfigs.${name}: not implemented`);
};

export const getReleaseById = (_orgUuid: string, _projectId: string, _componentId: string, _releaseId: string): Promise<ReleaseDetails> => ni('getReleaseById');
export const updateContainer = (_orgUuid: string, _projectId: string, _componentId: string, _releaseId: string, _containerId: string, _data: ContainerWriteData): Promise<ReleaseContainer> => ni('updateContainer');
export const getSecrets = (_orgUuid: string, _projectId: string, _environmentId: string): Promise<DevopsSecret[]> => ni('getSecrets');
export const getSecretDetails = (_orgUuid: string, _projectId: string, _environmentId: string, _secretId: string): Promise<DevopsSecretDetails> => ni('getSecretDetails');
export const createSecret = (_orgUuid: string, _projectId: string, _data: SecretWriteData): Promise<DevopsSecret> => ni('createSecret');
export const updateSecret = (_orgUuid: string, _projectId: string, _secretId: string, _data: SecretWriteData): Promise<DevopsSecret> => ni('updateSecret');
export const deleteSecret = (_orgUuid: string, _projectId: string, _environmentId: string, _secretId: string): Promise<void> => ni('deleteSecret');
export const getConfigMaps = (_orgUuid: string, _projectId: string, _environmentId: string): Promise<DevopsConfigMap[]> => ni('getConfigMaps');
export const getConfigMapDetails = (_orgUuid: string, _projectId: string, _environmentId: string, _configMapId: string): Promise<DevopsConfigMapDetails> => ni('getConfigMapDetails');
export const createConfigMap = (_orgUuid: string, _projectId: string, _data: ConfigMapWriteData): Promise<DevopsConfigMap> => ni('createConfigMap');
export const updateConfigMapData = (_orgUuid: string, _projectId: string, _configMapId: string, _data: ConfigMapWriteData): Promise<DevopsConfigMapDetails> => ni('updateConfigMapData');
export const deleteConfigMap = (_orgUuid: string, _projectId: string, _environmentId: string, _configMapId: string): Promise<void> => ni('deleteConfigMap');
export const getContainerConfigMounts = (_orgUuid: string, _projectId: string, _componentId: string, _releaseId: string, _containerId: string): Promise<DevopsConfigMount[]> => ni('getContainerConfigMounts');
export const mountConfig = (_orgUuid: string, _projectId: string, _componentId: string, _data: ConfigMountWriteData): Promise<DevopsConfigMount> => ni('mountConfig');
export const updateConfigMount = (_orgUuid: string, _projectId: string, _path: ConfigMountPath, _data: Record<string, unknown>): Promise<DevopsConfigMount> => ni('updateConfigMount');
export const removeConfigMount = (_orgUuid: string, _projectId: string, _path: ConfigMountPath): Promise<void> => ni('removeConfigMount');
