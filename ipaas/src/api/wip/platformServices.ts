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
  KafkaAcl,
  KafkaTopic,
  KafkaTopicCreatePayload,
  KafkaTopicUpdatePayload,
  KafkaUser,
  KafkaUserConfigs,
  LogsRequest,
  LogsResponse,
  MaintenanceWindow,
  MetricPeriod,
  OrgServiceAvailability,
  PowerAction,
  ServerMetricsResponse,
  ServerVariant,
  ServicePlan,
  ServiceType,
} from '../../types/platformServices';

const server = (id: string, variant: ServerVariant = 'db-servers'): string => `/${variant}/${encodeURIComponent(id)}`;

/** Whether the org may provision another managed service, plus its service-count limit. */
export function getAvailability(orgUuid: string): Promise<OrgServiceAvailability> {
  return platformServicesClient.get<OrgServiceAvailability>(`/organization-availability?organization_id=${encodeURIComponent(orgUuid)}`);
}

/** All managed database servers in the org (both regular and vector-enabled). */
export function listServers(orgUuid: string, variant: ServerVariant = 'db-servers'): Promise<DatabaseServer[]> {
  return platformServicesClient.get<DatabaseServer[]>(`/${variant}?organization_id=${encodeURIComponent(orgUuid)}`);
}

/** A single server's full details (connection params, plan, nodes, maintenance). */
export function getServer(serverId: string, variant: ServerVariant = 'db-servers'): Promise<DatabaseServerDetail> {
  return platformServicesClient.get<DatabaseServerDetail>(server(serverId, variant));
}

export function deleteServer(serverId: string, variant: ServerVariant = 'db-servers'): Promise<void> {
  return platformServicesClient.delete(server(serverId, variant));
}

/** Power the service on or off. */
export function setServerPoweredState(serverId: string, powered: boolean, variant: ServerVariant = 'db-servers'): Promise<void> {
  const action: PowerAction = powered ? 'power_on' : 'power_off';
  return platformServicesClient.put(`${server(serverId, variant)}/power`, { action });
}

/** The default admin user and its current password (revealed on demand). */
export function getServerAdminUser(serverId: string): Promise<AdminUser> {
  return platformServicesClient.get<AdminUser>(`${server(serverId)}/admin-user`);
}

/** The server's CA certificate (for download). */
export function getServerCaCertificate(serverId: string, variant: ServerVariant = 'db-servers'): Promise<CaCertificate> {
  return platformServicesClient.get<CaCertificate>(`${server(serverId, variant)}/ca-certificate`);
}

/** Time-series metrics (CPU, memory, disk, …) for the given period. */
export function getServerMetrics(serverId: string, period: MetricPeriod, variant: ServerVariant = 'db-servers'): Promise<ServerMetricsResponse> {
  return platformServicesClient.post<ServerMetricsResponse>(`${server(serverId, variant)}/metrics`, { period });
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
export function updateMaintenanceWindow(serverId: string, payload: MaintenanceWindow, variant: ServerVariant = 'db-servers'): Promise<void> {
  return platformServicesClient.put(`${server(serverId, variant)}/maintenance`, payload);
}

/** Update the allowed-IP policy (open access, or a restricted CIDR list). */
export function updateAllowedIps(serverId: string, payload: AllowedIpsPayload, variant: ServerVariant = 'db-servers'): Promise<void> {
  return platformServicesClient.put(`${server(serverId, variant)}/allowed-ips`, payload);
}

/** A cursor-paginated page of the server's logs. */
export function getServerLogs(serverId: string, request: LogsRequest, variant: ServerVariant = 'db-servers'): Promise<LogsResponse> {
  return platformServicesClient.post<LogsResponse>(`${server(serverId, variant)}/logs`, request);
}

/** The server's available automatic backups. */
export function listServerBackups(serverId: string, variant: ServerVariant = 'db-servers'): Promise<BackupsResponse> {
  return platformServicesClient.get<BackupsResponse>(`${server(serverId, variant)}/backups`);
}

/** Service plans (with per-region pricing) offered for a database engine. */
export function getServicePlans(type: ServiceType): Promise<ServicePlan[]> {
  return platformServicesClient.get<ServicePlan[]>(`/db-service-plans?type=${encodeURIComponent(type)}`);
}

/** Provision a new server. May be rejected (403) when the org isn't entitled. */
export function createServer(payload: CreateServerPayload, variant: ServerVariant = 'db-servers'): Promise<DatabaseServer> {
  return platformServicesClient.post<DatabaseServer>(`/${variant}`, payload);
}

// --- Kafka (message brokers only) ---

const kafka = (brokerId: string): string => `${server(brokerId, 'brokers')}/kafka`;

export function listKafkaTopics(brokerId: string): Promise<KafkaTopic[]> {
  return platformServicesClient.get<KafkaTopic[]>(`${kafka(brokerId)}/topics`);
}

export function createKafkaTopic(brokerId: string, payload: KafkaTopicCreatePayload): Promise<void> {
  return platformServicesClient.post(`${kafka(brokerId)}/topics`, payload);
}

export function getKafkaTopic(brokerId: string, topicName: string): Promise<KafkaTopic> {
  return platformServicesClient.get<KafkaTopic>(`${kafka(brokerId)}/topics/${encodeURIComponent(topicName)}`);
}

export function updateKafkaTopic(brokerId: string, topicName: string, payload: KafkaTopicUpdatePayload): Promise<void> {
  return platformServicesClient.put(`${kafka(brokerId)}/topics/${encodeURIComponent(topicName)}`, payload);
}

export function deleteKafkaTopic(brokerId: string, topicName: string): Promise<void> {
  return platformServicesClient.delete(`${kafka(brokerId)}/topics/${encodeURIComponent(topicName)}`);
}

/** Topic-setting constraints and descriptions (org-independent). */
export function getKafkaUserConfigs(): Promise<KafkaUserConfigs> {
  return platformServicesClient.get<KafkaUserConfigs>('/brokers/kafka-user-configs');
}

export function listKafkaUsers(brokerId: string): Promise<KafkaUser[]> {
  return platformServicesClient.get<KafkaUser[]>(`${kafka(brokerId)}/users`);
}

export function createKafkaUser(brokerId: string, username: string): Promise<void> {
  return platformServicesClient.post(`${kafka(brokerId)}/users`, { username });
}

export function deleteKafkaUser(brokerId: string, username: string): Promise<void> {
  return platformServicesClient.delete(`${kafka(brokerId)}/users/${encodeURIComponent(username)}`);
}

export function resetKafkaUserCredentials(brokerId: string, username: string): Promise<void> {
  return platformServicesClient.post(`${kafka(brokerId)}/users/${encodeURIComponent(username)}/reset-credentials`, {});
}

export function listKafkaAcls(brokerId: string): Promise<{ acls: KafkaAcl[] }> {
  return platformServicesClient.get<{ acls: KafkaAcl[] }>(`${kafka(brokerId)}/acls`);
}

export function createKafkaAcl(brokerId: string, payload: Omit<KafkaAcl, 'id'>): Promise<void> {
  return platformServicesClient.post(`${kafka(brokerId)}/acls`, payload);
}

export function deleteKafkaAcl(brokerId: string, aclId: string): Promise<void> {
  return platformServicesClient.delete(`${kafka(brokerId)}/acls/${encodeURIComponent(aclId)}`);
}
