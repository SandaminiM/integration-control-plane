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

// ---------------------------------------------------------------------------
// Server detail (management page)
// ---------------------------------------------------------------------------

export interface ConnectionParams {
  host: string;
  port: string;
  user: string;
  database: string;
  ssl_required?: boolean;
  password_reset?: boolean;
}

export interface ServerNode {
  name: string;
  role: string;
  state: string;
}

export interface MaintenanceWindow {
  day: string;
  time: string;
}

/** `PUT /db-servers/{id}/allowed-ips` — either open access or a restricted CIDR list. */
export interface AllowedIpsPayload {
  mode: 'allow_all' | 'restricted';
  allow_list?: { cidr: string; description?: string }[];
}

/** Plan block on the detail response — the list summary plus backup cadence. */
export interface ServicePlanDetailInfo extends ServicePlanInfo {
  backup_interval_hours: number;
  backup_retention_days: number;
}

/** Full server as returned by `GET /db-servers/{id}` (superset of the list row). */
export interface DatabaseServerDetail extends DatabaseServer {
  connection_params: ConnectionParams;
  service_plan: ServicePlanDetailInfo;
  nodes: ServerNode[];
  maintenance?: MaintenanceWindow;
  service_version?: string;
  allowed_ips?: { mode: string; allow_list?: { cidr: string; description?: string }[] };
}

/** `PUT /db-servers/{id}/power` — powers the service on or off. */
export type PowerAction = 'power_on' | 'power_off';

/** `GET /db-servers/{id}/admin-user` — the default user + its current password. */
export interface AdminUser {
  username: string;
  password: string;
}

/** `GET /db-servers/{id}/ca-certificate`. */
export interface CaCertificate {
  certificate: string;
}

// --- Metrics (POST /db-servers/{id}/metrics) — Google-Charts-style datatable per metric ---

export type MetricPeriod = 'hour' | 'day' | 'week' | 'month';

export interface MetricColumn {
  label: string;
  type: string;
}

export interface MetricRow {
  date: string;
  values: number[];
}

export interface MetricSeries {
  data: { cols: MetricColumn[]; rows: MetricRow[] };
}

export interface ServerMetricsResponse {
  metrics: Record<string, MetricSeries>;
}

// --- Databases (GET /db-servers/{id}/databases) ---

/** A single logical database hosted on the server. `status` is `READY` or `NOT_FOUND_IN_SERVER`. */
export interface DatabaseInfo {
  name: string;
  status: string;
  display_on_marketplace: boolean;
}

// --- Database credentials (GET/POST/PUT/DELETE /db-servers/{id}/credentials) ---

/** A registered database credential. `username` is only returned by the by-id fetch. */
export interface DbCredential {
  id: string;
  database_name: string;
  display_name: string;
  is_super_admin: boolean;
  privilege_levels: string[];
  applicable_environments: string[];
  username?: string;
}

/** Request body for registering/updating a credential (super-admin omits username/password/privileges). */
export interface CredentialPayload {
  database: string;
  display_name: string;
  applicable_environments: string[];
  is_super_admin?: boolean;
  username?: string;
  password?: string;
  privilege_levels?: string[];
}

/** A titled, user-facing create-server error (with an optional upgrade affordance). */
export interface CreateError {
  title: string;
  message: string;
  /** Entitlement failure — surface an Upgrade action when a billing console is configured. */
  upgrade?: boolean;
}

/** Editable form model behind the credential dialog (flattened into a CredentialPayload on submit). */
export interface CredentialFormValues {
  displayName: string;
  username: string;
  password: string;
  privileges: string[];
  environments: string[];
  isSuperAdmin: boolean;
}

// --- Logs (POST /db-servers/{id}/logs) ---

/** Cursor-paginated log query. Omit `offset` for the most recent page. */
export interface LogsRequest {
  offset?: string;
  limit: number;
  sort_order: 'asc' | 'desc';
}

export interface LogEntry {
  time: string;
  hostname: string;
  unit: string;
  msg: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  /** Cursor for the next (older) page. */
  offset: string;
  /** Offset of the oldest log available — paging is exhausted once reached. */
  first_log_offset: string;
}

// --- Backups (GET /db-servers/{id}/backups) ---

export interface BackupInfo {
  backup_name: string;
  backup_time: string;
  data_size: number;
}

export interface BackupsResponse {
  backups: BackupInfo[];
}
