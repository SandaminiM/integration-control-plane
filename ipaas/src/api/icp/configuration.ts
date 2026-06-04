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

import type { CertGroup, CertMapping, SchemaConfigData, ConfigMgtData, SchemaConfigItem, SaveSchemaConfigInput, ConfigMgtSaveItem } from '../../types/configuration';

export interface PostConfigMgtInput {
  orgHandler: string;
  projectId: string;
  componentId: string;
  envId: string;
  versionId: string;
  moduleName: string;
  commitHash: string;
  configs: ConfigMgtSaveItem[];
}

const ni = (name: string): never => { throw new Error(`[icp] configuration.${name}: not implemented`); };

export const fetchCertificateGroups = (_projectId: string, _componentId: string): Promise<CertGroup[]> => ni('fetchCertificateGroups');
export const fetchConfigGroups = (_projectId: string, _componentId: string): Promise<CertGroup[]> => ni('fetchConfigGroups');
export const fetchCertificateMappings = (_projectId: string, _componentId: string, _envId: string, _deploymentTrackId: string): Promise<CertMapping | null> => ni('fetchCertificateMappings');
export const fetchSchemaConfig = (_projectId: string, _componentId: string, _envId: string, _deploymentTrackId: string, _commitHash?: string): Promise<SchemaConfigData | null> => ni('fetchSchemaConfig');
export const fetchConfigMgt = (_orgHandler: string, _projectId: string, _componentId: string, _envId: string, _versionId: string, _componentName: string, _commitHash?: string): Promise<ConfigMgtData> => ni('fetchConfigMgt');
export const saveSchemaConfig = (_input: SaveSchemaConfigInput): Promise<{ configurations: SchemaConfigItem[] }> => ni('saveSchemaConfig');
export const postConfigMgt = (_input: PostConfigMgtInput): Promise<unknown> => ni('postConfigMgt');
export const postCertificateMappings = (_data: CertMapping): Promise<unknown> => ni('postCertificateMappings');
