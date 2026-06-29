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
import type { ByoiEndpointFileContents, CreateByoiComponentInput, CreateByoiComponentResult, DevopsVolume, DevopsVolumeMount, VolumeMountWriteData, VolumeWriteData } from '../../types/tailscale';

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

// Generic devops config primitives (release / secrets / configmaps / mounts)
// now live in `./devopsConfigs` — shared with the Configs & Secrets surface.

// ── volumes ────────────────────────────────────────────────────────────────────

export async function createVolume(orgUuid: string, projectId: string, data: VolumeWriteData): Promise<DevopsVolume> {
  const res = await choreoClient.post<Wrapped<DevopsVolume>>(`${BASE}/volume?${dq(orgUuid, projectId)}`, data);
  return res.data;
}

export async function mountVolume(orgUuid: string, projectId: string, path: { appId: string; appEnvId: string; containerId: string }, data: VolumeMountWriteData): Promise<DevopsVolumeMount> {
  const res = await choreoClient.post<Wrapped<DevopsVolumeMount>>(
    `${BASE}/components/${encodeURIComponent(path.appId)}/release/${encodeURIComponent(path.appEnvId)}/container/${encodeURIComponent(path.containerId)}/volume-mount?${dq(orgUuid, projectId)}`,
    data,
  );
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
