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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createByoiComponent,
  createConfigMap,
  createSecret,
  deployByoiImage,
  getByoiEndpointsYaml,
  getConfigMapDetails,
  getConfigMaps,
  getReleaseById,
  getSampleRegistryId,
  getSecrets,
  mountConfig,
  updateByoiEndpointsYaml,
  updateConfigMapData,
  updateSecret,
} from '#api/tailscale';
import { fetchComponents } from '#api/components';
import type { Component } from '../types/component';
import { OAUTH_CLIENT_SECRET, TAILSCALE_COMPONENT_SUBTYPE, TAILSCALE_COMPONENT_TYPE, TAILSCALE_IMAGE, TS_AUTH_KEY } from '../constants/tailscale';
import type { TailscaleAuthMethod, TailscalePortMapping } from '../types/tailscale';
import { buildEndpointsYaml, buildPortMappingsYaml, tailscaleConfigMapName, tailscaleSecretName } from '../utils/tailscale';
import { useOrgUuid } from './useOrgUuid';

const ROOT = 'tailscale';
const MAIN_CONTAINER_TYPES = new Set(['MAIN', 'main']);

/** All Tailscale proxy components in a project (`componentSubType: 'tailscale'`). */
export function useTailscaleComponents(orgHandler: string, projectId: string) {
  return useQuery<Component[]>({
    queryKey: ['components', orgHandler, projectId, 'tailscale'],
    queryFn: async () => {
      const all = await fetchComponents(orgHandler, projectId);
      return all.filter((c) => c.componentSubType?.toLowerCase() === TAILSCALE_COMPONENT_SUBTYPE);
    },
    enabled: !!orgHandler && !!projectId,
  });
}

/** The env's auth Secret (if any) — drives the configured-auth-method display. */
export function useTailscaleSecrets(projectId: string, environmentId: string | undefined) {
  const orgUuid = useOrgUuid();
  return useQuery({
    queryKey: [ROOT, 'secrets', orgUuid, projectId, environmentId],
    queryFn: () => getSecrets(orgUuid!, projectId, environmentId!),
    enabled: !!orgUuid && !!projectId && !!environmentId,
  });
}

/** The env's ConfigMaps (used to locate the port-mappings config). */
export function useTailscaleConfigMaps(projectId: string, environmentId: string | undefined) {
  const orgUuid = useOrgUuid();
  return useQuery({
    queryKey: [ROOT, 'configmaps', orgUuid, projectId, environmentId],
    queryFn: () => getConfigMaps(orgUuid!, projectId, environmentId!),
    enabled: !!orgUuid && !!projectId && !!environmentId,
  });
}

/** Full data (incl. `config.yaml`) for a specific ConfigMap. */
export function useTailscaleConfigMapDetails(projectId: string, environmentId: string | undefined, configMapId: string | undefined) {
  const orgUuid = useOrgUuid();
  return useQuery({
    queryKey: [ROOT, 'configMapDetails', orgUuid, projectId, environmentId, configMapId],
    queryFn: () => getConfigMapDetails(orgUuid!, projectId, environmentId!, configMapId!),
    enabled: !!orgUuid && !!projectId && !!environmentId && !!configMapId,
  });
}

/** The devops release (app-environment) — used for the proxy's namespace. */
export function useTailscaleRelease(projectId: string, componentId: string | undefined, releaseId: string | undefined) {
  const orgUuid = useOrgUuid();
  return useQuery({
    queryKey: [ROOT, 'release', orgUuid, projectId, componentId, releaseId],
    queryFn: () => getReleaseById(orgUuid!, projectId, componentId!, releaseId!),
    enabled: !!orgUuid && !!projectId && !!componentId && !!releaseId,
  });
}

/** The BYOI endpoints file (base64 YAML) for a release. */
export function useByoiEndpointsYaml(projectId: string, componentId: string | undefined, releaseId: string | undefined) {
  const orgUuid = useOrgUuid();
  return useQuery({
    queryKey: [ROOT, 'byoiEndpoints', orgUuid, projectId, componentId, releaseId],
    queryFn: () => getByoiEndpointsYaml(orgUuid!, projectId, componentId!, releaseId!),
    enabled: !!orgUuid && !!projectId && !!componentId && !!releaseId,
  });
}

/** Create a Tailscale proxy (a BYOI service component with the proxy image). */
export function useCreateTailscaleProxy(projectId: string) {
  const orgUuid = useOrgUuid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; displayName: string; description: string }) => {
      if (!orgUuid) throw new Error('Organization is not available.');
      const registryId = await getSampleRegistryId(orgUuid);
      return createByoiComponent({
        projectId,
        name: input.name,
        displayName: input.displayName,
        description: input.description,
        componentType: TAILSCALE_COMPONENT_TYPE,
        port: null,
        imageUrl: TAILSCALE_IMAGE,
        registryId,
        componentSubType: TAILSCALE_COMPONENT_SUBTYPE,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['components'] }),
  });
}

export interface SaveAndDeployInput {
  componentId: string;
  /** Component handle — used to derive Secret/ConfigMap names. */
  handle: string;
  envId: string;
  envName: string;
  /** The env's release id (also the `app_environment_id`). */
  releaseId: string;
  authMethod: TailscaleAuthMethod;
  authKey: string;
  clientSecret: string;
  mappings: TailscalePortMapping[];
}

/**
 * Persist a Tailscale env config and deploy. Orchestrates, in order: upsert the
 * auth Secret, upsert the port-mappings ConfigMap, push the BYOI endpoints YAML,
 * mount any newly-created Secret/ConfigMap onto the proxy container, then deploy
 * the proxy image. Mirrors Devant's Save & Deploy.
 */
export function useSaveAndDeployTailscale(projectId: string) {
  const orgUuid = useOrgUuid();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveAndDeployInput) => {
      if (!orgUuid) throw new Error('Organization is not available.');
      const { componentId, handle, envId, envName, releaseId, authMethod, authKey, clientSecret, mappings } = input;
      const secretName = tailscaleSecretName(handle, envName);
      const configMapName = tailscaleConfigMapName(handle, envName);

      // 1. Auth Secret — upsert only when a new credential was entered.
      const existingSecrets = await getSecrets(orgUuid, projectId, envId);
      const existingSecret = existingSecrets.find((s) => s.name === secretName);
      const credential = authMethod === 'authKey' ? authKey.trim() : clientSecret.trim();
      let newSecretId: string | null = null;
      if (credential) {
        const data = authMethod === 'authKey' ? { [TS_AUTH_KEY]: credential } : { [OAUTH_CLIENT_SECRET]: credential };
        const base = {
          name: secretName,
          metadata: { isDefaultConfig: true },
          environment_id: envId,
          organization_id: orgUuid,
          project_id: projectId,
          app_environment_id: releaseId,
          isBase64: false,
          save_type: 'Save',
          secret_type: 'Opaque',
          config_type: 'VariableList',
          data,
        };
        if (existingSecret) await updateSecret(orgUuid, projectId, existingSecret.ID, { ...base, version: existingSecret.version });
        else newSecretId = (await createSecret(orgUuid, projectId, base)).ID;
      }

      // 2. Port-mappings ConfigMap — upsert.
      const existingConfigMaps = await getConfigMaps(orgUuid, projectId, envId);
      const existingConfigMap = existingConfigMaps.find((c) => c.name === configMapName);
      const configData = {
        name: configMapName,
        metadata: { isDefaultConfig: true },
        environment_id: envId,
        organization_id: orgUuid,
        project_id: projectId,
        app_environment_id: releaseId,
        config_type: 'File',
        isBase64: false,
        data: { 'config.yaml': buildPortMappingsYaml(mappings) },
      };
      let newConfigMapId: string | null = null;
      if (existingConfigMap) await updateConfigMapData(orgUuid, projectId, existingConfigMap.ID, configData);
      else newConfigMapId = (await createConfigMap(orgUuid, projectId, configData)).ID;

      // 3. BYOI endpoints YAML.
      await updateByoiEndpointsYaml(orgUuid, projectId, componentId, releaseId, buildEndpointsYaml(mappings));

      // 4. Mount any newly-created Secret/ConfigMap onto the proxy's main container.
      if (newSecretId || newConfigMapId) {
        const release = await getReleaseById(orgUuid, projectId, componentId, releaseId);
        const container = release.containers.find((c) => MAIN_CONTAINER_TYPES.has(c.type ?? '')) ?? release.containers[0];
        if (container) {
          if (newSecretId) {
            await mountConfig(orgUuid, projectId, componentId, { app_environment_id: releaseId, container_id: container.ID, secret_id: newSecretId, configmap_id: null, mount_type: 'ENVFile', mount_permissions: '0000', mount_path: '', config_key: '' });
          }
          if (newConfigMapId) {
            await mountConfig(orgUuid, projectId, componentId, { app_environment_id: releaseId, container_id: container.ID, configmap_id: newConfigMapId, secret_id: null, mount_type: 'File', mount_path: '/config.yaml', config_key: 'config.yaml', mount_permissions: '0644' });
          }
        }
      }

      // 5. Deploy the proxy image.
      return deployByoiImage(componentId, releaseId, TAILSCALE_IMAGE);
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: [ROOT, 'secrets', orgUuid, projectId, input.envId] });
      qc.invalidateQueries({ queryKey: [ROOT, 'configmaps', orgUuid, projectId, input.envId] });
      qc.invalidateQueries({ queryKey: [ROOT, 'byoiEndpoints', orgUuid, projectId, input.componentId, input.releaseId] });
      qc.invalidateQueries({ queryKey: ['componentDeployment'] });
    },
  });
}

/** Re-deploy the proxy image without configuration changes. */
export function useRedeployTailscale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ componentId, releaseId }: { componentId: string; releaseId: string }) => deployByoiImage(componentId, releaseId, TAILSCALE_IMAGE),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['componentDeployment'] }),
  });
}
