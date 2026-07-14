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
import type { StorageClass, Volume, VolumeCreateData, VolumeMount, VolumeMountCreateData, VolumeMountPath, VolumeMountUpdateData } from '../../types/storage';

const BASE = '/devops/1.0.0/api/v1';
type Wrapped<T> = { data: T };

function dq(orgUuid: string, projectId: string, extra?: Record<string, string>): string {
  return new URLSearchParams({ organization_id: orgUuid, project_id: projectId, ...(extra ?? {}) }).toString();
}

function mountBase(path: VolumeMountPath): string {
  return `${BASE}/components/${encodeURIComponent(path.componentId)}/release/${encodeURIComponent(path.releaseId)}/container/${encodeURIComponent(path.containerId)}/volume-mount`;
}

export async function listVolumes(orgUuid: string, projectId: string, environmentId: string): Promise<Volume[]> {
  const res = await choreoClient.get<Wrapped<Volume[]>>(`${BASE}/volume?${dq(orgUuid, projectId, { environment_id: environmentId })}`);
  return res.data ?? [];
}

export async function createVolume(orgUuid: string, projectId: string, data: VolumeCreateData): Promise<Volume> {
  const res = await choreoClient.post<Wrapped<Volume>>(`${BASE}/volume?${dq(orgUuid, projectId)}`, data);
  return res.data;
}

export async function deleteVolume(orgUuid: string, projectId: string, volumeId: string): Promise<void> {
  await choreoClient.delete(`${BASE}/volume/${encodeURIComponent(volumeId)}?${dq(orgUuid, projectId)}`);
}

export async function listVolumeMounts(orgUuid: string, projectId: string, componentId: string, releaseId: string): Promise<VolumeMount[]> {
  const res = await choreoClient.get<Wrapped<VolumeMount[]>>(`${BASE}/components/${encodeURIComponent(componentId)}/release/${encodeURIComponent(releaseId)}/volume-mount?${dq(orgUuid, projectId, { app_environment_id: releaseId })}`);
  return res.data ?? [];
}

export async function createVolumeMount(orgUuid: string, projectId: string, path: VolumeMountPath, data: VolumeMountCreateData): Promise<VolumeMount> {
  const res = await choreoClient.post<Wrapped<VolumeMount>>(`${mountBase(path)}?${dq(orgUuid, projectId)}`, data);
  return res.data;
}

export async function updateVolumeMount(orgUuid: string, projectId: string, path: VolumeMountPath, mountId: string, data: VolumeMountUpdateData): Promise<VolumeMount> {
  const res = await choreoClient.put<Wrapped<VolumeMount>>(`${mountBase(path)}/${encodeURIComponent(mountId)}?${dq(orgUuid, projectId)}`, data);
  return res.data;
}

export async function deleteVolumeMount(orgUuid: string, projectId: string, path: VolumeMountPath, mountId: string): Promise<void> {
  await choreoClient.delete(`${mountBase(path)}/${encodeURIComponent(mountId)}?${dq(orgUuid, projectId)}`);
}

export async function listStorageClasses(orgUuid: string, projectId: string, environmentId: string): Promise<StorageClass[]> {
  const res = await choreoClient.get<Wrapped<StorageClass[]>>(`${BASE}/environments/${encodeURIComponent(environmentId)}/storage-classes?${dq(orgUuid, projectId)}`);
  return res.data ?? [];
}
