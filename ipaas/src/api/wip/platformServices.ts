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
import type { CreateServerPayload, DatabaseServer, OrgServiceAvailability, ServicePlan, ServiceType } from '../../types/platformServices';

/** Whether the org may provision another managed service, plus its service-count limit. */
export function getAvailability(orgUuid: string): Promise<OrgServiceAvailability> {
  return platformServicesClient.get<OrgServiceAvailability>(`/organization-availability?organization_id=${encodeURIComponent(orgUuid)}`);
}

/** All managed database servers in the org (both regular and vector-enabled). */
export function listServers(orgUuid: string): Promise<DatabaseServer[]> {
  return platformServicesClient.get<DatabaseServer[]>(`/db-servers?organization_id=${encodeURIComponent(orgUuid)}`);
}

/** A single server's details. */
export function getServer(serverId: string): Promise<DatabaseServer> {
  return platformServicesClient.get<DatabaseServer>(`/db-servers/${encodeURIComponent(serverId)}`);
}

export function deleteServer(serverId: string): Promise<void> {
  return platformServicesClient.delete(`/db-servers/${encodeURIComponent(serverId)}`);
}

/** Service plans (with per-region pricing) offered for a database engine. */
export function getServicePlans(type: ServiceType): Promise<ServicePlan[]> {
  return platformServicesClient.get<ServicePlan[]>(`/db-service-plans?type=${encodeURIComponent(type)}`);
}

/** Provision a new server. May be rejected (403) when the org isn't entitled. */
export function createServer(payload: CreateServerPayload): Promise<DatabaseServer> {
  return platformServicesClient.post<DatabaseServer>('/db-servers', payload);
}
