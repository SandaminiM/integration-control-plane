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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  createDatabase,
  createDbCredential,
  createServer,
  deleteDbCredential,
  deleteServer,
  getAvailability,
  getDbCredential,
  getServer,
  getServerAdminUser,
  getServerCaCertificate,
  getServerLogs,
  getServerMetrics,
  getServicePlans,
  listDbCredentials,
  listServerBackups,
  listServerDatabases,
  listServers,
  setDatabaseMarketplace,
  setServerPoweredState,
  updateAllowedIps,
  updateDbCredential,
  updateMaintenanceWindow,
} from '#api/platformServices';
import { IS_WIP } from '../features';
import { useOrgUuid } from './useOrgUuid';
import { deriveProviders, deriveRegions } from '../utils/platformServices';
import type { AllowedIpsPayload, CloudProvider, CloudRegion, CreateServerPayload, CredentialPayload, DatabaseServer, LogsRequest, MaintenanceWindow, MetricPeriod, ServicePlan, ServiceType } from '../types/platformServices';

const ROOT_KEY = 'platformServices';

/** True only when the managed-databases feature is available (wip build + config flag on). */
export function isPlatformServicesEnabled(): boolean {
  return IS_WIP && !!window.API_CONFIG?.enablePlatformServicesFeature && !!window.API_CONFIG?.platformServicesApiBaseUrl;
}

/** Org entitlement: whether another service can be provisioned, plus the count limit + reason. */
export function useServiceAvailability() {
  const orgUuid = useOrgUuid();
  return useQuery({
    queryKey: [ROOT_KEY, 'availability', orgUuid],
    queryFn: () => getAvailability(orgUuid!),
    enabled: isPlatformServicesEnabled() && !!orgUuid,
    staleTime: 60 * 1000,
    retry: false,
  });
}

/** All database servers in the org. Polls every 15s so provisioning progress is reflected. */
export function useDatabaseServers() {
  const orgUuid = useOrgUuid();
  return useQuery({
    queryKey: [ROOT_KEY, 'servers', orgUuid],
    queryFn: () => listServers(orgUuid!),
    enabled: isPlatformServicesEnabled() && !!orgUuid,
    refetchInterval: 15_000,
    retry: false,
  });
}

/** A single server. Polls fast (10s) while provisioning/resuming, slow (60s) otherwise. */
export function useDatabaseServer(serverId: string) {
  return useQuery({
    queryKey: [ROOT_KEY, 'server', serverId],
    queryFn: () => getServer(serverId),
    enabled: isPlatformServicesEnabled() && !!serverId,
    refetchInterval: (query) => (['CREATING', 'RESUMING'].includes((query.state.data as DatabaseServer | undefined)?.status ?? '') ? 10_000 : 60_000),
    retry: false,
  });
}

export interface ServicePlansResult {
  plans: ServicePlan[];
  providers: CloudProvider[];
  regions: CloudRegion[];
}

/** Service plans for an engine, with the offered providers/regions derived for the wizard. */
export function useServicePlans(type: ServiceType) {
  return useQuery({
    queryKey: [ROOT_KEY, 'servicePlans', type],
    queryFn: () => getServicePlans(type),
    enabled: isPlatformServicesEnabled(),
    staleTime: 30 * 60 * 1000,
    select: (plans): ServicePlansResult => ({ plans, providers: deriveProviders(plans), regions: deriveRegions(plans) }),
  });
}

export function useCreateServer() {
  const qc = useQueryClient();
  const orgUuid = useOrgUuid();
  return useMutation({
    mutationFn: (payload: CreateServerPayload) => createServer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ROOT_KEY, 'servers', orgUuid] });
      qc.invalidateQueries({ queryKey: [ROOT_KEY, 'availability', orgUuid] });
    },
  });
}

export function useDeleteServer() {
  const qc = useQueryClient();
  const orgUuid = useOrgUuid();
  return useMutation({
    mutationFn: (serverId: string) => deleteServer(serverId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [ROOT_KEY, 'servers', orgUuid] });
      qc.invalidateQueries({ queryKey: [ROOT_KEY, 'availability', orgUuid] });
    },
  });
}

// --- server detail (management page) ---

/** Power a server on/off; refreshes the server detail on success. */
export function useSetServerPoweredState(serverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (powered: boolean) => setServerPoweredState(serverId, powered),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROOT_KEY, 'server', serverId] }),
  });
}

/** Reveal the admin user's password on demand (query is disabled until `enabled`). */
export function useServerAdminUser(serverId: string, enabled: boolean) {
  return useQuery({
    queryKey: [ROOT_KEY, 'adminUser', serverId],
    queryFn: () => getServerAdminUser(serverId),
    enabled: isPlatformServicesEnabled() && !!serverId && enabled,
    retry: false,
  });
}

/** Lazy imperative fetch of the CA certificate (for the Download button). */
export function useFetchServerCaCertificate(serverId: string) {
  const qc = useQueryClient();
  return () => qc.fetchQuery({ queryKey: [ROOT_KEY, 'caCert', serverId], queryFn: () => getServerCaCertificate(serverId) });
}

/** Time-series metrics for the given period. */
export function useServerMetrics(serverId: string, period: MetricPeriod) {
  return useQuery({
    queryKey: [ROOT_KEY, 'metrics', serverId, period],
    queryFn: () => getServerMetrics(serverId, period),
    enabled: isPlatformServicesEnabled() && !!serverId,
    retry: false,
  });
}

/** The logical databases hosted on the server. */
export function useServerDatabases(serverId: string) {
  return useQuery({
    queryKey: [ROOT_KEY, 'databases', serverId],
    queryFn: () => listServerDatabases(serverId),
    enabled: isPlatformServicesEnabled() && !!serverId,
    retry: false,
  });
}

/** Create a logical database, then refresh the database list. */
export function useCreateDatabase(serverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createDatabase(serverId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROOT_KEY, 'databases', serverId] }),
  });
}

/** Add/remove a database from the Marketplace, then refresh the database list. */
export function useSetDatabaseMarketplace(serverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, display }: { name: string; display: boolean }) => setDatabaseMarketplace(serverId, name, display),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROOT_KEY, 'databases', serverId] }),
  });
}

/** All credentials registered on the server (grouped by database in the UI). */
export function useDbCredentials(serverId: string) {
  return useQuery({
    queryKey: [ROOT_KEY, 'credentials', serverId],
    queryFn: () => listDbCredentials(serverId),
    enabled: isPlatformServicesEnabled() && !!serverId,
    retry: false,
  });
}

/** A single credential (with username), for prefilling the edit dialog. */
export function useDbCredential(serverId: string, credentialId: string | null) {
  return useQuery({
    queryKey: [ROOT_KEY, 'credential', serverId, credentialId],
    queryFn: () => getDbCredential(serverId, credentialId!),
    enabled: isPlatformServicesEnabled() && !!serverId && !!credentialId,
    retry: false,
  });
}

function useInvalidateCredentials(serverId: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [ROOT_KEY, 'credentials', serverId] });
}

export function useCreateDbCredential(serverId: string) {
  const invalidate = useInvalidateCredentials(serverId);
  return useMutation({
    mutationFn: (payload: CredentialPayload) => createDbCredential(serverId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateDbCredential(serverId: string) {
  const invalidate = useInvalidateCredentials(serverId);
  return useMutation({
    mutationFn: ({ credentialId, payload }: { credentialId: string; payload: CredentialPayload }) => updateDbCredential(serverId, credentialId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteDbCredential(serverId: string) {
  const invalidate = useInvalidateCredentials(serverId);
  return useMutation({
    mutationFn: (credentialId: string) => deleteDbCredential(serverId, credentialId),
    onSuccess: invalidate,
  });
}

/** Update the maintenance window, then refresh the server detail. */
export function useUpdateMaintenanceWindow(serverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MaintenanceWindow) => updateMaintenanceWindow(serverId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROOT_KEY, 'server', serverId] }),
  });
}

/** Update the allowed-IP policy, then refresh the server detail. */
export function useUpdateAllowedIps(serverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AllowedIpsPayload) => updateAllowedIps(serverId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROOT_KEY, 'server', serverId] }),
  });
}

/** The server's automatic backups. */
export function useServerBackups(serverId: string) {
  return useQuery({
    queryKey: [ROOT_KEY, 'backups', serverId],
    queryFn: () => listServerBackups(serverId),
    enabled: isPlatformServicesEnabled() && !!serverId,
    retry: false,
  });
}

/** Imperative log fetch — the Logs tab manages cursor paging + accumulation itself. */
export function useFetchServerLogs(serverId: string) {
  return useCallback((request: LogsRequest) => getServerLogs(serverId, request), [serverId]);
}
