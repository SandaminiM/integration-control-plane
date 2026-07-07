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

import { platformServicesClient } from './httpClients';
import type {
  AdminUser,
  AllowedIpsPayload,
  BackupsResponse,
  CaCertificate,
  CreateServerPayload,
  CredentialPayload,
  DatabaseInfo,
  DatabaseServer,
  DatabaseServerDetail,
  DbCredential,
  LogsRequest,
  LogsResponse,
  MaintenanceWindow,
  MetricPeriod,
  OrgServiceAvailability,
  PowerAction,
  ServerMetricsResponse,
  ServicePlan,
  ServiceType,
} from '../../types/platformServices';

const server = (id: string): string => `/db-servers/${encodeURIComponent(id)}`;

/** Whether the org may provision another managed service, plus its service-count limit. */
export function getAvailability(orgUuid: string): Promise<OrgServiceAvailability> {
  return platformServicesClient.get<OrgServiceAvailability>(`/organization-availability?organization_id=${encodeURIComponent(orgUuid)}`);
}

/** All managed database servers in the org (both regular and vector-enabled). */
export function listServers(orgUuid: string): Promise<DatabaseServer[]> {
  return platformServicesClient.get<DatabaseServer[]>(`/db-servers?organization_id=${encodeURIComponent(orgUuid)}`);
}

/** A single server's full details (connection params, plan, nodes, maintenance). */
export function getServer(serverId: string): Promise<DatabaseServerDetail> {
  return platformServicesClient.get<DatabaseServerDetail>(server(serverId));
}

export function deleteServer(serverId: string): Promise<void> {
  return platformServicesClient.delete(server(serverId));
}

/** Power the service on or off. */
export function setServerPoweredState(serverId: string, powered: boolean): Promise<void> {
  const action: PowerAction = powered ? 'power_on' : 'power_off';
  return platformServicesClient.put(`${server(serverId)}/power`, { action });
}

/** The default admin user and its current password (revealed on demand). */
export function getServerAdminUser(serverId: string): Promise<AdminUser> {
  return platformServicesClient.get<AdminUser>(`${server(serverId)}/admin-user`);
}

/** The server's CA certificate (for download). */
export function getServerCaCertificate(serverId: string): Promise<CaCertificate> {
  return platformServicesClient.get<CaCertificate>(`${server(serverId)}/ca-certificate`);
}

/** Time-series metrics (CPU, memory, disk, …) for the given period. */
export function getServerMetrics(serverId: string, period: MetricPeriod): Promise<ServerMetricsResponse> {
  return platformServicesClient.post<ServerMetricsResponse>(`${server(serverId)}/metrics`, { period });
}

/** The logical databases hosted on the server. */
export function listServerDatabases(serverId: string): Promise<DatabaseInfo[]> {
  return platformServicesClient.get<DatabaseInfo[]>(`${server(serverId)}/databases`);
}

/** Create a new logical database on the server. */
export function createDatabase(serverId: string, name: string): Promise<DatabaseInfo> {
  return platformServicesClient.post<DatabaseInfo>(`${server(serverId)}/databases`, { name });
}

/** Add/remove a database from the Marketplace. */
export function setDatabaseMarketplace(serverId: string, name: string, displayOnMarketplace: boolean): Promise<void> {
  return platformServicesClient.put(`${server(serverId)}/databases/${encodeURIComponent(name)}`, { name, display_on_marketplace: displayOnMarketplace, status: 'READY' });
}

/** All registered credentials for the server (optionally scoped to one database). */
export function listDbCredentials(serverId: string, dbName?: string): Promise<DbCredential[]> {
  const query = dbName ? `?db_name=${encodeURIComponent(dbName)}` : '';
  return platformServicesClient.get<DbCredential[]>(`${server(serverId)}/credentials${query}`);
}

/** A single credential, including its `username`. */
export function getDbCredential(serverId: string, credentialId: string): Promise<DbCredential> {
  return platformServicesClient.get<DbCredential>(`${server(serverId)}/credentials/${encodeURIComponent(credentialId)}`);
}

export function createDbCredential(serverId: string, payload: CredentialPayload): Promise<DbCredential> {
  return platformServicesClient.post<DbCredential>(`${server(serverId)}/credentials`, payload);
}

export function updateDbCredential(serverId: string, credentialId: string, payload: CredentialPayload): Promise<DbCredential> {
  return platformServicesClient.put<DbCredential>(`${server(serverId)}/credentials/${encodeURIComponent(credentialId)}`, payload);
}

export function deleteDbCredential(serverId: string, credentialId: string): Promise<void> {
  return platformServicesClient.delete(`${server(serverId)}/credentials/${encodeURIComponent(credentialId)}`);
}

/** Update the weekly maintenance window (`{ day, time }`). */
export function updateMaintenanceWindow(serverId: string, payload: MaintenanceWindow): Promise<void> {
  return platformServicesClient.put(`${server(serverId)}/maintenance`, payload);
}

/** Update the allowed-IP policy (open access, or a restricted CIDR list). */
export function updateAllowedIps(serverId: string, payload: AllowedIpsPayload): Promise<void> {
  return platformServicesClient.put(`${server(serverId)}/allowed-ips`, payload);
}

/** A cursor-paginated page of the server's logs. */
export function getServerLogs(serverId: string, request: LogsRequest): Promise<LogsResponse> {
  return platformServicesClient.post<LogsResponse>(`${server(serverId)}/logs`, request);
}

/** The server's available automatic backups. */
export function listServerBackups(serverId: string): Promise<BackupsResponse> {
  return platformServicesClient.get<BackupsResponse>(`${server(serverId)}/backups`);
}

/** Service plans (with per-region pricing) offered for a database engine. */
export function getServicePlans(type: ServiceType): Promise<ServicePlan[]> {
  return platformServicesClient.get<ServicePlan[]>(`/db-service-plans?type=${encodeURIComponent(type)}`);
}

/** Provision a new server. May be rejected (403) when the org isn't entitled. */
export function createServer(payload: CreateServerPayload): Promise<DatabaseServer> {
  return platformServicesClient.post<DatabaseServer>('/db-servers', payload);
}
