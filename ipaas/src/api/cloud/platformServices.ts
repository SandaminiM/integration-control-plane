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

// Managed databases are a wip-only feature (IS_WIP-gated). Signatures mirror
// Contracts.PlatformServicesApi so _check.ts catches any drift.
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
  ServerMetricsResponse,
  ServicePlan,
  ServiceType,
} from '../../types/platformServices';

const ni = (name: string): never => {
  throw new Error(`[cloud] platformServices.${name}: not implemented`);
};

export const getAvailability = (_orgUuid: string): Promise<OrgServiceAvailability> => ni('getAvailability');
export const listServers = (_orgUuid: string): Promise<DatabaseServer[]> => ni('listServers');
export const getServer = (_serverId: string): Promise<DatabaseServerDetail> => ni('getServer');
export const deleteServer = (_serverId: string): Promise<void> => ni('deleteServer');
export const getServicePlans = (_type: ServiceType): Promise<ServicePlan[]> => ni('getServicePlans');
export const createServer = (_payload: CreateServerPayload): Promise<DatabaseServer> => ni('createServer');
export const setServerPoweredState = (_serverId: string, _powered: boolean): Promise<void> => ni('setServerPoweredState');
export const getServerAdminUser = (_serverId: string): Promise<AdminUser> => ni('getServerAdminUser');
export const getServerCaCertificate = (_serverId: string): Promise<CaCertificate> => ni('getServerCaCertificate');
export const getServerMetrics = (_serverId: string, _period: MetricPeriod): Promise<ServerMetricsResponse> => ni('getServerMetrics');
export const listServerDatabases = (_serverId: string): Promise<DatabaseInfo[]> => ni('listServerDatabases');
export const getServerLogs = (_serverId: string, _request: LogsRequest): Promise<LogsResponse> => ni('getServerLogs');
export const listServerBackups = (_serverId: string): Promise<BackupsResponse> => ni('listServerBackups');
export const createDatabase = (_serverId: string, _name: string): Promise<DatabaseInfo> => ni('createDatabase');
export const setDatabaseMarketplace = (_serverId: string, _name: string, _displayOnMarketplace: boolean): Promise<void> => ni('setDatabaseMarketplace');
export const listDbCredentials = (_serverId: string, _dbName?: string): Promise<DbCredential[]> => ni('listDbCredentials');
export const getDbCredential = (_serverId: string, _credentialId: string): Promise<DbCredential> => ni('getDbCredential');
export const createDbCredential = (_serverId: string, _payload: CredentialPayload): Promise<DbCredential> => ni('createDbCredential');
export const updateDbCredential = (_serverId: string, _credentialId: string, _payload: CredentialPayload): Promise<DbCredential> => ni('updateDbCredential');
export const deleteDbCredential = (_serverId: string, _credentialId: string): Promise<void> => ni('deleteDbCredential');
export const updateMaintenanceWindow = (_serverId: string, _payload: MaintenanceWindow): Promise<void> => ni('updateMaintenanceWindow');
export const updateAllowedIps = (_serverId: string, _payload: AllowedIpsPayload): Promise<void> => ni('updateAllowedIps');
