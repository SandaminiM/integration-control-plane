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

// Generic devops config primitives (Secret/ConfigMap/ConfigMount/Release) now
// live in `types/devopsConfigs.ts` — shared with the Configs & Secrets surface.

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
