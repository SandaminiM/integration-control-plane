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
import type { CreateServerPayload, DatabaseServer, OrgServiceAvailability, ServicePlan, ServiceType } from '../../types/platformServices';

const ni = (name: string): never => {
  throw new Error(`[cloud] platformServices.${name}: not implemented`);
};

export const getAvailability = (_orgUuid: string): Promise<OrgServiceAvailability> => ni('getAvailability');
export const listServers = (_orgUuid: string): Promise<DatabaseServer[]> => ni('listServers');
export const getServer = (_serverId: string): Promise<DatabaseServer> => ni('getServer');
export const deleteServer = (_serverId: string): Promise<void> => ni('deleteServer');
export const getServicePlans = (_type: ServiceType): Promise<ServicePlan[]> => ni('getServicePlans');
export const createServer = (_payload: CreateServerPayload): Promise<DatabaseServer> => ni('createServer');
