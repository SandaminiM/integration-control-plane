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
import { gql } from './graphql';
import { getOrCreateSampleRegistry } from './cloudEditor';
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

// Tailscale config lives on the devops service (via choreoClient). REST calls
// take `organization_id` + `project_id` query params; responses wrap data in
// `{ data: ... }`. Component create/deploy/read go through the project GraphQL
// endpoint (the `gql` helper). All URLs mirror Devant exactly.
const BASE = '/devops/1.0.0/api/v1';
type Wrapped<T> = { data: T };

/** `organization_id` + `project_id` (+ any extra) query string. */
function dq(orgUuid: string, projectId: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ organization_id: orgUuid, project_id: projectId, ...(extra ?? {}) });
  return params.toString();
}

/** Escape a string for safe inline embedding in a GraphQL document. */
function gqlStr(value: string): string {
  return JSON.stringify(value);
}

// ── component create / deploy / read (project GraphQL) ───────────────────────

export async function getSampleRegistryId(orgUuid: string): Promise<string> {
  const reg = await getOrCreateSampleRegistry(orgUuid);
  return reg.id;
}

export async function createByoiComponent(input: CreateByoiComponentInput): Promise<CreateByoiComponentResult> {
  const query = `mutation{ createByoiComponent(
    component: {
      name: ${gqlStr(input.name)},
      displayName: ${gqlStr(input.displayName)},
      description: ${gqlStr(input.description)},
      projectId: ${gqlStr(input.projectId)},
      componentType: ${gqlStr(input.componentType)},
      metadata: {labels: "", version: "v1.0", componentSubType: ${gqlStr(input.componentSubType)}},
      port: ${input.port === null ? 'null' : input.port},
      imageUrl: ${gqlStr(input.imageUrl)},
      registryId: ${gqlStr(input.registryId)}
    }){ id, projectId, handle }
  }`;
  const data = await gql<{ createByoiComponent: CreateByoiComponentResult }>(query);
  return data.createByoiComponent;
}

export async function deployByoiImage(componentId: string, releaseId: string, imageUrl: string): Promise<{ message: string; success: boolean }> {
  const query = `mutation{ deployImage(
    input: {
      componentId: ${gqlStr(componentId)},
      releaseId: ${gqlStr(releaseId)},
      imageUrl: ${gqlStr(imageUrl)},
      imageId: "",
      cronTimezone: ""
    }){ message, success }
  }`;
  const data = await gql<{ deployImage: { message: string; success: boolean } }>(query);
  return data.deployImage;
}

// ── devops release ───────────────────────────────────────────────────────────

export async function getReleaseById(orgUuid: string, projectId: string, componentId: string, releaseId: string): Promise<ReleaseDetails> {
  const res = await choreoClient.get<Wrapped<ReleaseDetails>>(`${BASE}/components/${encodeURIComponent(componentId)}/release/${encodeURIComponent(releaseId)}?${dq(orgUuid, projectId)}`);
  return res.data;
}

// ── secrets ──────────────────────────────────────────────────────────────────

export async function getSecrets(orgUuid: string, projectId: string, environmentId: string): Promise<DevopsSecret[]> {
  const res = await choreoClient.get<Wrapped<DevopsSecret[]>>(`${BASE}/environments/${encodeURIComponent(environmentId)}/secret?${dq(orgUuid, projectId)}`);
  return res.data;
}

export async function createSecret(orgUuid: string, projectId: string, data: SecretWriteData): Promise<DevopsSecret> {
  const res = await choreoClient.post<Wrapped<DevopsSecret>>(`${BASE}/environments/${encodeURIComponent(data.environment_id)}/secret?${dq(orgUuid, projectId)}`, data);
  return res.data;
}

export async function updateSecret(orgUuid: string, projectId: string, secretId: string, data: SecretWriteData): Promise<DevopsSecret> {
  const res = await choreoClient.put<Wrapped<DevopsSecret>>(`${BASE}/environments/${encodeURIComponent(data.environment_id)}/secret/${encodeURIComponent(secretId)}?${dq(orgUuid, projectId)}`, data);
  return res.data;
}

// ── config maps ───────────────────────────────────────────────────────────────

export async function getConfigMaps(orgUuid: string, projectId: string, environmentId: string): Promise<DevopsConfigMap[]> {
  const res = await choreoClient.get<Wrapped<DevopsConfigMap[]>>(`${BASE}/environments/${encodeURIComponent(environmentId)}/configmap?${dq(orgUuid, projectId)}`);
  return res.data;
}

export async function getConfigMapDetails(orgUuid: string, projectId: string, environmentId: string, configMapId: string): Promise<DevopsConfigMapDetails> {
  const res = await choreoClient.get<Wrapped<DevopsConfigMapDetails>>(`${BASE}/environments/${encodeURIComponent(environmentId)}/configmap/${encodeURIComponent(configMapId)}?${dq(orgUuid, projectId)}`);
  return res.data;
}

export async function createConfigMap(orgUuid: string, projectId: string, data: ConfigMapWriteData): Promise<DevopsConfigMap> {
  const res = await choreoClient.post<Wrapped<DevopsConfigMap>>(`${BASE}/environments/${encodeURIComponent(data.environment_id)}/configmap?${dq(orgUuid, projectId)}`, data);
  return res.data;
}

export async function updateConfigMapData(orgUuid: string, projectId: string, configMapId: string, data: ConfigMapWriteData): Promise<DevopsConfigMapDetails> {
  const res = await choreoClient.put<Wrapped<DevopsConfigMapDetails>>(`${BASE}/environments/${encodeURIComponent(data.environment_id)}/configmap/${encodeURIComponent(configMapId)}?${dq(orgUuid, projectId)}`, data);
  return res.data;
}

// ── config mounts ──────────────────────────────────────────────────────────────

export async function getContainerConfigMounts(orgUuid: string, projectId: string, componentId: string, releaseId: string, containerId: string): Promise<DevopsConfigMount[]> {
  const res = await choreoClient.get<Wrapped<DevopsConfigMount[] | DevopsConfigMount>>(`${BASE}/components/${encodeURIComponent(componentId)}/release/${encodeURIComponent(releaseId)}/container/${encodeURIComponent(containerId)}/config-mount?${dq(orgUuid, projectId)}`);
  const mounts = res.data;
  return Array.isArray(mounts) ? mounts : mounts ? [mounts] : [];
}

export async function mountConfig(orgUuid: string, projectId: string, componentId: string, data: ConfigMountWriteData): Promise<DevopsConfigMount> {
  const body = { mount_path: '', config_key: '', deploy_changes: true, ...data };
  const res = await choreoClient.post<Wrapped<DevopsConfigMount>>(`${BASE}/components/${encodeURIComponent(componentId)}/release/${encodeURIComponent(data.app_environment_id)}/container/${encodeURIComponent(data.container_id)}/config-mount?${dq(orgUuid, projectId)}`, body);
  return res.data;
}

export async function updateConfigMount(orgUuid: string, projectId: string, path: { componentId: string; releaseId: string; containerId: string; mountId: string }, data: Record<string, unknown>): Promise<DevopsConfigMount> {
  const res = await choreoClient.put<Wrapped<DevopsConfigMount>>(`${BASE}/components/${encodeURIComponent(path.componentId)}/release/${encodeURIComponent(path.releaseId)}/container/${encodeURIComponent(path.containerId)}/config-mount/${encodeURIComponent(path.mountId)}?${dq(orgUuid, projectId)}`, { ...data, deploy_changes: true });
  return res.data;
}

// ── volumes ────────────────────────────────────────────────────────────────────

export async function createVolume(orgUuid: string, projectId: string, data: VolumeWriteData): Promise<DevopsVolume> {
  const res = await choreoClient.post<Wrapped<DevopsVolume>>(`${BASE}/volume?${dq(orgUuid, projectId)}`, data);
  return res.data;
}

export async function mountVolume(orgUuid: string, projectId: string, path: { appId: string; appEnvId: string; containerId: string }, data: VolumeMountWriteData): Promise<DevopsVolumeMount> {
  const res = await choreoClient.post<Wrapped<DevopsVolumeMount>>(`${BASE}/components/${encodeURIComponent(path.appId)}/release/${encodeURIComponent(path.appEnvId)}/container/${encodeURIComponent(path.containerId)}/volume-mount?${dq(orgUuid, projectId)}`, data);
  return res.data;
}

// ── BYOI endpoints YAML ──────────────────────────────────────────────────────

export async function getByoiEndpointsYaml(orgUuid: string, projectId: string, componentId: string, releaseId: string): Promise<ByoiEndpointFileContents> {
  return choreoClient.get<ByoiEndpointFileContents>(`${BASE}/byoi/components/${encodeURIComponent(componentId)}/releases/${encodeURIComponent(releaseId)}/endpoints?${dq(orgUuid, projectId)}`);
}

export async function updateByoiEndpointsYaml(orgUuid: string, projectId: string, componentId: string, releaseId: string, endpointsYaml: string): Promise<void> {
  // Devant encodes the YAML as base64 under `main`; no API schema files for the proxy.
  await choreoClient.put<unknown>(`${BASE}/byoi/components/${encodeURIComponent(componentId)}/releases/${encodeURIComponent(releaseId)}/endpoints?${dq(orgUuid, projectId)}`, { main: btoa(endpointsYaml), apiSchemas: [] });
}
