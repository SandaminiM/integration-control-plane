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

import type { CloudProvider, CloudRegion, ServerStatus, ServiceType } from '../types/platformServices';

/** Service name: starts with a letter, alphanumeric + hyphens, max 64 chars. Mirrors Devant. */
export const SERVICE_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9-]{0,63}$/;
export const SERVICE_NAME_ERROR = 'Service name must consist of alphanumeric characters and hyphens, must begin with a letter, and cannot exceed 64 characters.';

/** Choreo Cache (Redis) creation is currently unavailable — the card is shown disabled. */
export const ENABLE_REDIS_CREATION = false;

/** Cloud providers a free (non-subscribed) org may NOT select — only DigitalOcean is free-tier. */
export const FREE_TIER_DISABLED_PROVIDERS: CloudProvider[] = ['aws', 'azure', 'gcp'];

export interface ServiceTypeOption {
  id: ServiceType;
  name: string;
  description: string;
  disabled?: boolean;
}

/** Selectable database engines (Step 1). Redis shown but disabled while unavailable. */
export const SERVICE_TYPES: ServiceTypeOption[] = [
  { id: 'postgres', name: 'PostgreSQL', description: 'A highly performant, fully-managed object-relational database management system' },
  { id: 'mysql', name: 'MySQL', description: "A fully-managed offering of the world's most popular relational database management system" },
  {
    id: 'redis',
    name: 'Choreo Cache',
    description: ENABLE_REDIS_CREATION ? 'A managed in-memory NoSQL database compatible with legacy Redis® OSS' : 'Choreo Caches are currently unavailable. Please select another service.',
    disabled: !ENABLE_REDIS_CREATION,
  },
];

/** Cloud providers in display order — DigitalOcean & GCP first (they carry the hobbyist plans). */
export const CLOUD_PROVIDERS: { id: CloudProvider; name: string }[] = [
  { id: 'digitalocean', name: 'DigitalOcean' },
  { id: 'gcp', name: 'GCP' },
  { id: 'aws', name: 'AWS' },
  { id: 'azure', name: 'Azure' },
];

export const CLOUD_REGIONS: { id: CloudRegion; name: string }[] = [
  { id: 'us', name: 'United States' },
  { id: 'eu', name: 'Europe' },
  { id: 'aus', name: 'Australia' },
];

const TYPE_LABELS: Record<ServiceType, string> = { postgres: 'PostgreSQL', mysql: 'MySQL', redis: 'Choreo Cache', kafka: 'Kafka' };
const PROVIDER_LABELS: Record<CloudProvider, string> = { aws: 'Amazon Web Services', azure: 'Microsoft Azure', gcp: 'Google Cloud Platform', digitalocean: 'Digital Ocean' };
const REGION_LABELS: Record<CloudRegion, string> = { us: 'United States', eu: 'Europe', aus: 'Australia', africa: 'Africa' };
const STATUS_LABELS: Record<ServerStatus, string> = {
  CREATING: 'Creating',
  ACTIVE: 'Active',
  POWERED_OFF: 'Powered Off',
  RESUMING: 'Resuming',
  DELETING: 'Deleting',
  DELETED: 'Deleted',
  ERROR: 'Error',
};

/** oxygen-ui Chip colors keyed by server status. */
export const STATUS_COLORS: Record<ServerStatus, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
  CREATING: 'info',
  ACTIVE: 'success',
  POWERED_OFF: 'warning',
  RESUMING: 'info',
  DELETING: 'warning',
  DELETED: 'error',
  ERROR: 'error',
};

export const serviceTypeLabel = (type: ServiceType): string => TYPE_LABELS[type] ?? 'Unknown';
export const providerLabel = (provider: CloudProvider): string => PROVIDER_LABELS[provider] ?? 'Unknown';
export const regionLabel = (region: CloudRegion): string => REGION_LABELS[region] ?? 'Unknown';
export const statusLabel = (status: ServerStatus): string => STATUS_LABELS[status] ?? 'Error';

/** Whether a server row is clickable — terminal/erroring servers have no detail page. */
export const isServerAccessible = (status: ServerStatus): boolean => !['ERROR', 'DELETED', 'DELETING'].includes(status);
