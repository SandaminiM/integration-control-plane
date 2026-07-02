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
 * Types for the admin "Databases" feature (managed database servers). A trimmed,
 * hand-authored subset of Devant's OpenAPI-generated platform-services schema —
 * only the fields the UI reads. Extended per phase (Phase 1 covers list/delete).
 */

export type ServiceType = 'postgres' | 'mysql' | 'redis' | 'kafka';

export type ServerStatus = 'CREATING' | 'ACTIVE' | 'POWERED_OFF' | 'RESUMING' | 'DELETING' | 'DELETED' | 'ERROR';

export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'digitalocean';

export type CloudRegion = 'us' | 'eu' | 'africa' | 'aus';

/** Plan summary embedded in each list row (name + hardware specs + pricing). */
export interface ServicePlanInfo {
  name: string;
  node_count: number;
  node_cpu_count: number;
  node_ram_gb: number;
  storage_gb: number;
  monthly_price_usd: string;
  hourly_price_usd: string;
}

/** A managed database server as returned by the list endpoint. */
export interface DatabaseServer {
  id: string;
  created_at: string;
  project_id?: string;
  name: string;
  service_plan_id: string;
  service_plan: ServicePlanInfo;
  cloud_provider: CloudProvider;
  cloud_region: CloudRegion;
  status: ServerStatus;
  type: ServiceType;
  display_on_marketplace: boolean;
  is_vector_enabled?: boolean;
}

/** Why the org can (or can't) provision another service — drives create gating + upgrade messaging. */
export type AvailabilityReason = 'AVAILABLE' | 'FREE_SUB_MAX_COUNT_EXCEEDED' | 'PAID_SUB_MAX_COUNT_EXCEEDED' | 'UNKNOWN' | 'ORGANIZATION_NOT_IN_ALLOW_LIST' | 'FREE_TRIAL_OPERATION_RATE_LIMIT_EXCEEDED' | 'FREE_TRIAL_EXPIRED';

export interface OrgServiceAvailability {
  is_available: boolean;
  service_count_limit: number;
  reason: AvailabilityReason;
}

/** One provider+region availability of a plan, with its hardware spec and pricing. */
export interface ServicePlanRegion {
  cloud_provider: CloudProvider;
  cloud_region: CloudRegion;
  node_cpu_count: number;
  node_ram_gb: number;
  storage_gb: number;
  monthly_price_usd: string;
  hourly_price_usd: string;
}

/** A service plan as returned by `GET /db-service-plans?type=` (name + specs + per-region pricing). */
export interface ServicePlan {
  id: string;
  name: string;
  description: string;
  type: ServiceType;
  node_count: number;
  backup_retention_days: number;
  backup_interval_hours: number;
  free_trial_available: boolean;
  regions: ServicePlanRegion[];
}

/** Request body for `POST /db-servers`. `project_id` is optional (omitted for org-level servers). */
export interface CreateServerPayload {
  name: string;
  cloud_provider: CloudProvider;
  cloud_region: CloudRegion;
  service_plan_id: string;
  is_vector_enabled: boolean;
  project_id?: string;
}

/** Error envelope returned by the platform-services API (e.g. a 403 "service not allowed"). */
export interface ServiceError {
  message: string;
  description: string;
  correlation_id: string;
}
