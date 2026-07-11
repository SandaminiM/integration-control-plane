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

// Storage / volume mounts, backed by the DevOps API (shared with Devant). A `Volume` is the
// definition (name + type); a `VolumeMount` binds a volume to a container at a mount path.

export type VolumeApiType = 'EmptyDir' | 'PVC' | 'NFS' | 'HostPath';

export type VolumeAccessMode = 'ReadWriteMany' | 'ReadOnlyMany' | 'ReadWriteOnce';

export interface EmptyDirBacking {
  emptyDir: { medium?: '' | 'Memory' };
}
export interface PvcBacking {
  persistentVolumeClaim: { accessModes: VolumeAccessMode[]; storageClassName: string; storageRequest: string };
}
export type VolumeBacking = EmptyDirBacking | PvcBacking | { nfs: Record<string, unknown> } | { hostPath: Record<string, unknown> };

export interface Volume {
  ID: string;
  name: string;
  type: VolumeApiType;
  kubernetes_name?: string;
  organization_id: string;
  project_id: string;
  app_environment_id: string;
  environment_id: string;
  metadata?: Record<string, unknown>;
  Volume: VolumeBacking;
  status?: unknown;
}

export interface VolumeMount {
  ID: string;
  MountPath: string;
  ReadOnly: boolean;
  SubPath?: string;
  app_volume_id: string;
  container_id: string;
  environment_id?: string;
  app_environment_id?: string;
}

export interface VolumeCreateData {
  name: string;
  organization_id: string;
  project_id: string;
  app_environment_id: string;
  environment_id: string;
  metadata: Record<string, unknown>;
  type: VolumeApiType;
  volume: VolumeBacking;
}

export interface VolumeMountCreateData {
  app_volume_id: string;
  mountPath: string;
  readOnly: boolean;
}

export interface VolumeMountUpdateData {
  mountPath: string;
  readOnly: boolean;
}

/** Release/container path segments shared by the mount endpoints. */
export interface VolumeMountPath {
  componentId: string;
  releaseId: string;
  containerId: string;
}

export interface StorageClass {
  name: string;
}

/** UI volume-type choice (form value). Mapped to the API `type` + backing at submit. */
export const VolumeFormType = {
  EmptyDirMemory: 'EmptyDir(tmpfs)',
  EmptyDirDisk: 'EmptyDir(default)',
  Pvc: 'PVC',
} as const;
export type VolumeFormType = (typeof VolumeFormType)[keyof typeof VolumeFormType];

/** A single container mount collected in the wizard's step 2. */
export interface VolumeMountDraft {
  /** Local id — uuid for an existing (persisted) mount, generated string for a new one. */
  id: string;
  containerId: string;
  mountPath: string;
  readOnly: boolean;
  /** Set only for existing mounts loaded in edit mode. */
  existing?: boolean;
}

/** Aggregated list-row: a volume joined with the mounts pointing at it. */
export interface VolumeRow {
  volume: Volume;
  mounts: VolumeMount[];
}
