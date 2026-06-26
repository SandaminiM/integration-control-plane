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
 * Tailscale VPN — a BYOI (bring-your-own-image) proxy component
 * (`componentSubType: 'tailscale'`) that bridges the data plane to a private
 * network. Per environment it carries an auth secret (Tailscale auth key OR
 * OAuth client secret), a port-mappings ConfigMap, and BYOI endpoints. These
 * types mirror Devant's devops + project GraphQL wire shapes; the hook layer
 * orchestrates the Save & Deploy sequence over the atomic api functions.
 */

export type TailscaleAuthMethod = 'authKey' | 'clientSecret';

/** One proxy port → private device mapping (a row in the editor). */
export interface TailscalePortMapping {
  /** Endpoint display name. */
  name: string;
  /** Port exposed on the proxy. */
  port: number;
  /** Private Tailscale device IP. */
  ip: string;
  /** Port on that device. */
  targetPort: number;
}

// ── devops wire shapes ──────────────────────────────────────────────────────

export interface DevopsSecret {
  ID: string;
  name: string;
  environment_id: string;
  app_environment_id: string;
  keys: string[];
  version: number;
  config_type: string;
  secret_type: string;
}

export interface DevopsConfigMap {
  ID: string;
  name: string;
  environment_id: string;
  app_environment_id: string;
  version: number;
  config_type: string;
}

export interface DevopsConfigMapDetails extends DevopsConfigMap {
  data: Record<string, string>;
}

export interface DevopsConfigMount {
  ID: string;
  configmap_id: string | null;
  secret_id: string | null;
  container_id: string;
  app_environment_id: string;
  mount_path: string;
  config_key: string;
  mount_type: string;
  mount_permissions: string | null;
}

export interface DevopsVolume {
  ID: string;
  name: string;
}

export interface DevopsVolumeMount {
  ID: string;
  app_volume_id: string;
  mountPath: string;
  readOnly: boolean;
}

export interface ReleaseContainer {
  ID: string;
  name: string;
  type?: string;
}

export interface ReleaseNamespace {
  ID: string;
  name: string;
}

/** Subset of the devops release (app-environment) record we consume. */
export interface ReleaseDetails {
  ID: string;
  containers: ReleaseContainer[];
  environment?: { namespaces?: ReleaseNamespace[] };
}

/** BYOI endpoints file payload (base64 YAML under `endpointYaml.data`). */
export interface ByoiEndpointFileContents {
  endpointYaml?: { data?: string };
}

// ── request payloads ────────────────────────────────────────────────────────

export interface CreateByoiComponentInput {
  projectId: string;
  /** Component handle (kebab-case). */
  name: string;
  displayName: string;
  description: string;
  /** Always `'byoiService'` for Tailscale. */
  componentType: string;
  port: number | null;
  imageUrl: string;
  registryId: string;
  /** `'tailscale'`. */
  componentSubType: string;
}

export interface CreateByoiComponentResult {
  id: string;
  projectId: string;
  handle: string;
}

export interface SecretWriteData {
  name: string;
  metadata: Record<string, unknown>;
  environment_id: string;
  organization_id: string;
  project_id: string;
  app_environment_id?: string;
  isBase64: boolean;
  save_type: string;
  secret_type: string;
  config_type: string;
  data: Record<string, string>;
  version?: number;
}

export interface ConfigMapWriteData {
  name: string;
  metadata: Record<string, unknown>;
  environment_id: string;
  organization_id: string;
  project_id: string;
  app_environment_id?: string;
  config_type: string;
  isBase64: boolean;
  data: Record<string, string>;
}

export interface ConfigMountWriteData {
  app_environment_id: string;
  container_id: string;
  configmap_id: string | null;
  secret_id: string | null;
  mount_path?: string;
  config_key?: string;
  mount_type: string;
  mount_permissions: string;
  deploy_changes?: boolean;
}

export interface VolumeWriteData {
  name: string;
  organization_id: string;
  project_id: string;
  app_environment_id: string;
  environment_id: string;
  metadata: Record<string, unknown>;
  type: string;
  volume: { emptyDir: { medium: string } };
}

export interface VolumeMountWriteData {
  app_volume_id: string;
  mountPath: string;
  readOnly: boolean;
}
