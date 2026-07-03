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

/**
 * Cloud (OpenChoreo) devops config API. Calls the ipaas-service BFF.
 *
 * The Configs & Secrets page speaks devant's ConfigMap/Secret + config-mount
 * model, but OpenChoreo exposes only a flat per-(component, environment) file
 * mount surface:
 *   GET    /components/{c}/environments/{e}/files
 *   PUT    /components/{c}/environments/{e}/files/{fileName}
 *   DELETE /components/{c}/environments/{e}/files/{fileName}?mountPath=…
 * so this layer maps every file mount onto the devant shapes it expects:
 *   - `fileName` is the shared id (ConfigMap/Secret `ID` == config-mount `ID`),
 *     so `buildConfigRows` joins mounts to sources and the editor's mount/config
 *     ids round-trip.
 *   - the `sensitive` flag distinguishes a Secret (secret_id set) from a
 *     ConfigMap (configmap_id set).
 *   - env-scoped ConfigMap/Secret lists have no counterpart, so getConfigMaps/
 *     getSecrets return []; the mounts call is the sole source of rows.
 *   - getConfigMapDetails fetches a single non-secret file's content on edit so
 *     the editor prefills it; secret content is secret-backed and unreadable, so
 *     it stays empty (re-entered).
 *
 * Only File Mounts are backed. The Environment Variables kind has no BFF route
 * (that surface is the schema-driven config-schema wired in configuration.ts),
 * so mount operations reject a non-File mount type.
 */

import { bff, items, q, seg, type ListResponse } from './_client';
import type { ConfigMapWriteData, ConfigMountPath, ConfigMountWriteData, DevopsConfigMap, DevopsConfigMapDetails, DevopsConfigMount, DevopsSecret, DevopsSecretDetails, ReleaseContainer, ReleaseDetails, SecretWriteData } from '../../types/devopsConfigs';

// _orgUuid/_projectId are kept for devant contract parity where cloud does not
// need them; cloud derives the org from the token and addresses everything by
// name (componentId/envId/projectId are OpenChoreo names, not UUIDs).

interface BffFileMount {
  fileName: string;
  mountPath: string;
  sensitive: boolean;
  configType?: string;
  /** Inline content of a non-secret file; absent/empty for secret files. */
  content?: string;
}

// getConfigMapDetails (which prefills the editor) receives the env + fileName but
// not the component, yet the file endpoint is component-scoped. The Configs page
// always lists a component+environment's files (getContainerConfigMounts) before
// any edit is possible, so record that exact scope here and reuse it verbatim to
// fetch one file's content.
let lastFileScope: { componentId: string; env: string } | null = null;

// GET /files returns content-free metadata; the file's identity is its name.
const toMount = (f: BffFileMount, env: string, releaseId: string): DevopsConfigMount => ({
  ID: f.fileName,
  configmap_id: f.sensitive ? null : f.fileName,
  secret_id: f.sensitive ? f.fileName : null,
  container_id: env,
  app_environment_id: releaseId,
  mount_path: f.mountPath,
  config_key: 'data',
  mount_type: 'File',
  mount_permissions: '0644',
});

// The BFF upserts a file (content + mountPath + sensitivity) in one PUT, but the
// Configs hook creates the config/secret (which carries the content) and then
// mounts it (which carries the mountPath) as two calls. Stage the content by
// fileName between the two so the mount call can issue the combined PUT.
interface PendingFile {
  content: string;
  sensitive: boolean;
}
const pendingFiles = new Map<string, PendingFile>();
const stage = (fileName: string, data: { data?: Record<string, string> }, sensitive: boolean): void => {
  pendingFiles.set(fileName, { content: data.data?.data ?? '', sensitive });
};

// Resolve the environment a release is bound to. OpenChoreo has no releaseId→env
// route, but release-mgt-deployments lists every binding (env filter ignored)
// with its release name, so match on it to recover the env name.
interface BffReleaseBinding {
  environment_id?: string;
  release_name?: string;
}
const envForRelease = (componentId: string, releaseId: string): Promise<string> =>
  bff.get<ListResponse<BffReleaseBinding>>(`/components/${seg(componentId)}/release-mgt-deployments`).then((r) => items(r).find((d) => d.release_name === releaseId)?.environment_id ?? '');

// PUT the combined file mount, draining any staged content for this fileName.
const putFile = (componentId: string, projectId: string, env: string, fileName: string, mountPath: string, secretIdSet: boolean): Promise<unknown> => {
  const staged = pendingFiles.get(fileName);
  pendingFiles.delete(fileName);
  return bff.put(`/components/${seg(componentId)}/environments/${seg(env)}/files/${seg(fileName)}${q({ projectName: projectId })}`, {
    fileName,
    mountPath,
    content: staged?.content ?? '',
    isBase64: false,
    sensitive: staged?.sensitive ?? secretIdSet,
  });
};

const assertFileMount = (mountType: unknown): void => {
  if (mountType !== 'File') throw new Error('[cloud] devopsConfigs: environment-variable configs are not supported on OpenChoreo (file mounts only)');
};

// ── release (synthetic container carrying the resolved env) ────────────────────

// Cloud has no release/container resource. Resolve the environment for the
// release and return it AS the (single, MAIN) container id, so the mount/delete
// functions — which receive containerId but not envId — read the env off it.
export const getReleaseById = async (_orgUuid: string, _projectId: string, componentId: string, releaseId: string): Promise<ReleaseDetails> => {
  const env = await envForRelease(componentId, releaseId);
  if (env) lastFileScope = { componentId, env }; // let getConfigMapDetails address this env's files
  const containers: ReleaseContainer[] = env ? [{ ID: env, name: env, type: 'MAIN' }] : [];
  return { ID: releaseId, containers };
};

// ── secrets / config maps (env-scoped lists have no OpenChoreo counterpart) ────

export const getSecrets = (_orgUuid: string, _projectId: string, _environmentId: string): Promise<DevopsSecret[]> => Promise.resolve([]);

export const getSecretDetails = (_orgUuid: string, _projectId: string, environmentId: string, secretId: string): Promise<DevopsSecretDetails> =>
  Promise.resolve({ ID: secretId, name: secretId, environment_id: environmentId, app_environment_id: '', keys: [], version: 1, config_type: 'File', secret_type: 'Opaque', data: null });

export const getConfigMaps = (_orgUuid: string, _projectId: string, _environmentId: string): Promise<DevopsConfigMap[]> => Promise.resolve([]);

// Fetch a single non-secret file's content on edit so the editor prefills it.
// The component is not on this signature, so reuse the (component, env) scope the
// list read recorded — the same one that surfaced this file. Secret content is
// unretrievable → empty (re-entered); a 404 also degrades to empty.
export const getConfigMapDetails = async (_orgUuid: string, projectId: string, environmentId: string, configMapId: string): Promise<DevopsConfigMapDetails> => {
  const base: DevopsConfigMapDetails = { ID: configMapId, name: configMapId, environment_id: environmentId, app_environment_id: '', version: 1, config_type: 'File', keys: [], data: { data: '' } };
  if (!lastFileScope) return base;
  const { componentId, env } = lastFileScope;
  const file = await bff
    .get<BffFileMount>(`/components/${seg(componentId)}/environments/${seg(env)}/files/${seg(configMapId)}${q({ projectName: projectId })}`)
    .catch(() => null);
  return { ...base, data: { data: file?.content ?? '' } };
};

// Create/update stage the content; the paired mount call issues the PUT. The
// returned record only needs a valid `ID` (== fileName) for the hook to proceed.
export const createSecret = (_orgUuid: string, _projectId: string, data: SecretWriteData): Promise<DevopsSecret> => {
  stage(data.name, data, true);
  return Promise.resolve({ ID: data.name, name: data.name, environment_id: data.environment_id, app_environment_id: data.app_environment_id ?? '', keys: Object.keys(data.data ?? {}), version: 1, config_type: data.config_type, secret_type: data.secret_type });
};

export const updateSecret = (_orgUuid: string, _projectId: string, secretId: string, data: SecretWriteData): Promise<DevopsSecret> => {
  stage(secretId, data, true);
  return Promise.resolve({ ID: secretId, name: data.name, environment_id: data.environment_id, app_environment_id: data.app_environment_id ?? '', keys: Object.keys(data.data ?? {}), version: 1, config_type: data.config_type, secret_type: data.secret_type });
};

export const createConfigMap = (_orgUuid: string, _projectId: string, data: ConfigMapWriteData): Promise<DevopsConfigMap> => {
  stage(data.name, data, false);
  return Promise.resolve({ ID: data.name, name: data.name, environment_id: data.environment_id, app_environment_id: data.app_environment_id ?? '', version: 1, config_type: data.config_type, keys: Object.keys(data.data ?? {}) });
};

export const updateConfigMapData = (_orgUuid: string, _projectId: string, configMapId: string, data: ConfigMapWriteData): Promise<DevopsConfigMapDetails> => {
  stage(configMapId, data, false);
  return Promise.resolve({ ID: configMapId, name: data.name, environment_id: data.environment_id, app_environment_id: data.app_environment_id ?? '', version: 1, config_type: data.config_type, keys: Object.keys(data.data ?? {}), data: data.data ?? {} });
};

// Env-scoped deletes lack a component, so they cannot address a file; the page
// deletes by unmounting (removeConfigMount) instead. Kept as benign no-ops.
export const deleteSecret = (_orgUuid: string, _projectId: string, _environmentId: string, _secretId: string): Promise<void> => Promise.resolve();
export const deleteConfigMap = (_orgUuid: string, _projectId: string, _environmentId: string, _configMapId: string): Promise<void> => Promise.resolve();

// ── container config mounts (the sole source of config rows) ───────────────────

export const getContainerConfigMounts = (_orgUuid: string, projectId: string, componentId: string, releaseId: string, containerId: string): Promise<DevopsConfigMount[]> => {
  const env = containerId; // carried through from getReleaseById
  if (!env) return Promise.resolve([]);
  lastFileScope = { componentId, env }; // let getConfigMapDetails address these files
  return bff.get<{ files?: BffFileMount[] }>(`/components/${seg(componentId)}/environments/${seg(env)}/files${q({ projectName: projectId })}`).then((r) => (r?.files ?? []).map((f) => toMount(f, env, releaseId)));
};

export const mountConfig = async (_orgUuid: string, projectId: string, componentId: string, data: ConfigMountWriteData): Promise<DevopsConfigMount> => {
  assertFileMount(data.mount_type);
  const fileName = data.configmap_id ?? data.secret_id ?? '';
  const env = data.container_id;
  const mountPath = data.mount_path ?? '';
  await putFile(componentId, projectId, env, fileName, mountPath, !!data.secret_id);
  return { ID: fileName, configmap_id: data.configmap_id, secret_id: data.secret_id, container_id: env, app_environment_id: data.app_environment_id, mount_path: mountPath, config_key: data.config_key ?? 'data', mount_type: 'File', mount_permissions: data.mount_permissions };
};

export const updateConfigMount = async (_orgUuid: string, projectId: string, path: ConfigMountPath, data: Record<string, unknown>): Promise<DevopsConfigMount> => {
  assertFileMount(data.mount_type);
  const fileName = path.mountId;
  const env = path.containerId;
  const mountPath = (data.mount_path as string) ?? '';
  const secretId = (data.secret_id as string | null) ?? null;
  await putFile(path.componentId, projectId, env, fileName, mountPath, !!secretId);
  return { ID: fileName, configmap_id: (data.configmap_id as string | null) ?? null, secret_id: secretId, container_id: env, app_environment_id: env, mount_path: mountPath, config_key: 'data', mount_type: 'File', mount_permissions: (data.mount_permissions as string | null) ?? '0644' };
};

// DELETE requires the mount path, which the caller does not carry, so resolve it
// from the current file list first. A file that is already gone is a no-op.
export const removeConfigMount = async (_orgUuid: string, projectId: string, path: ConfigMountPath): Promise<void> => {
  const env = path.containerId;
  const fileName = path.mountId;
  const list = await bff.get<{ files?: BffFileMount[] }>(`/components/${seg(path.componentId)}/environments/${seg(env)}/files${q({ projectName: projectId })}`);
  const file = (list?.files ?? []).find((f) => f.fileName === fileName);
  if (!file) return;
  await bff.delete(`/components/${seg(path.componentId)}/environments/${seg(env)}/files/${seg(fileName)}${q({ projectName: projectId, mountPath: file.mountPath })}`);
};
