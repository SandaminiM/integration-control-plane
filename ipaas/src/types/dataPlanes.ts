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

/** Install-time metadata attached to a Private Data Plane cluster. */
export interface PDPInstallationConfig {
  clusterId?: string;
  containerRegistryCredentialId?: string;
  isPersonalPDP?: boolean;
}

/**
 * A data plane cluster (runtime) where integrations run. Covers both WSO2-managed
 * Cloud Data Planes and self-hosted Private Data Planes; `pdpInstallationConfig`
 * is present only on the latter.
 */
export interface Cluster {
  id: string;
  name: string;
  projectID?: string;
  organizationID?: string;
  createdOn?: string;
  createdByUser?: string;
  whitelistIPs?: string[];
  lastConnected?: string;
  lastDisconnected?: string;
  lastIP?: string;
  labels?: Record<string, string | boolean>;
  nodeSelectors?: { key: string; value: string }[];
  upgradeInProgress?: boolean;
  provisioningStatus?: string;
  provisioningPercentage?: string;
  isActive: boolean;
  internalGatewayVirtualHost?: string;
  externalGatewayVirtualHost?: string;
  externalIngressDefaultDomain?: string;
  pdpInstallationConfig?: PDPInstallationConfig;
  stsDefaultDomain?: string | null;
}

/**
 * A Private Data Plane as tracked by the PDP manager while it is being
 * provisioned. Surfaces creation progress before a `Cluster` record exists.
 */
export interface PdpManagerPdp {
  cloud: string;
  creationProgress: number;
  creationStatus: string;
  createdAt: string;
  name: string;
  pdpSize: string;
  tenantType: string;
}
