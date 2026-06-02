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

export async function fetchCertificateGroups(projectId: string, componentId: string): Promise<CertGroup[]> {
  const params = new URLSearchParams({ projectId, componentId, nested_search: 'true' });
  const data = await choreoClient.get<CertGroup[]>(`/config-svc/v1.0/configs/groups?${params}`);
  return data.filter((g) => g.groupName.startsWith('certificates-'));
}

export async function fetchConfigGroups(projectId: string, componentId: string): Promise<CertGroup[]> {
  const params = new URLSearchParams({ projectId, componentId, nested_search: 'true' });
  return choreoClient.get<CertGroup[]>(`/config-svc/v1.0/configs/groups?${params}`);
}

export async function fetchCertificateMappings(projectId: string, componentId: string, envId: string, deploymentTrackId: string): Promise<CertMapping | null> {
  const params = new URLSearchParams({ projectId, componentId, envTemplateId: envId, deploymentTrackId });
  return choreoClient.get<CertMapping>(`/config-mapping-svc/v1.0/configs/mappings?${params}`);
}

export async function fetchSchemaConfig(projectId: string, componentId: string, envId: string, deploymentTrackId: string, commitHash?: string): Promise<SchemaConfigData | null> {
  const qs = commitHash ? `?commitHash=${encodeURIComponent(commitHash)}` : '';
  return choreoClient.get<SchemaConfigData>(`/configuration-schema/v1.0/projects/${projectId}/components/${componentId}/env-template/${envId}/deployment-track/${deploymentTrackId}/configurations${qs}`);
}

export async function fetchConfigMgt(orgHandler: string, projectId: string, componentId: string, envId: string, versionId: string, componentName: string, commitHash?: string): Promise<ConfigMgtData> {
  const qs = new URLSearchParams({ component_name: componentName, ...(commitHash ? { commit_hash: commitHash } : {}) });
  return choreoClient.get<ConfigMgtData>(
    `/config-mgt/1.0.0/orgs/${encodeURIComponent(orgHandler)}/projects/${encodeURIComponent(projectId)}/components/${encodeURIComponent(componentId)}/envs/${encodeURIComponent(envId)}/${encodeURIComponent(versionId)}/configurations?${qs}`,
  );
}

export async function saveSchemaConfig(input: SaveSchemaConfigInput): Promise<{ configurations: SchemaConfigItem[] }> {
  return choreoClient.post(`/configuration-schema/v1.0/projects/${input.projectId}/components/${input.componentId}/env-template/${input.envId}/deployment-track/${input.deploymentTrackId}/configurations`, {
    configurations: input.configurations,
    ...(input.commitHash ? { commitHash: input.commitHash } : {}),
  });
}

export async function postConfigMgt(input: PostConfigMgtInput): Promise<unknown> {
  return choreoClient.post(
    `/config-mgt/1.0.0/orgs/${encodeURIComponent(input.orgHandler)}/projects/${encodeURIComponent(input.projectId)}/components/${encodeURIComponent(input.componentId)}/envs/${encodeURIComponent(input.envId)}/${encodeURIComponent(input.versionId)}/configurations`,
    {
      moduleName: input.moduleName,
      commitHash: input.commitHash,
      applyNow: true,
      operation: 0,
      sourceUuid: '',
      configs: input.configs.map(({ configPackageName: _cpn, configPackageOrganization: _cpo, ...rest }) => rest),
    },
  );
}

export async function postCertificateMappings(data: CertMapping): Promise<unknown> {
  return choreoClient.post('/config-mapping-svc/v1.0/configs/mappings', data);
}
