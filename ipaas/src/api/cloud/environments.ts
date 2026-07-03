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

/** Cloud (OpenChoreo) environment / dataplane API. Calls the ipaas-service BFF. */

import type { Environment, CloudDataPlane, EnvironmentInput, Logger, UpdateLogLevelInput } from '../../types/environment';
import { toHandler } from '../../utils/string';
import { bff, items, q, seg, type ListResponse, type MessageResponse } from './_client';

// _orgUuid is kept for devant contract parity; cloud derives the org from the token.

// OpenChoreo Environments are K8s resources: `name` is an RFC 1123 slug and the
// identity used in every path (`/environments/{name}`) and in a pipeline's
// promotion refs, while the human label lives in `displayName`. The frontend
// Environment carries `id` (slug) and `name` (label) and expresses "production"
// as `critical`, so we translate between the two shapes at the boundary.
interface BffEnvironment {
  // The BFF serves the RFC 1123 slug as `id` and the human label as `name`, and
  // flags production via `critical` with the dataplane in `dpId`. The
  // slug/displayName/isProduction/dataPlaneRef aliases are tolerated as fallbacks.
  id?: string;
  uid?: string;
  name: string;
  displayName?: string;
  description?: string;
  dataPlaneRef?: string;
  dpId?: string;
  isProduction?: boolean;
  critical?: boolean;
  createdAt?: string;
}

// `id` must be the slug used in every path (`/environments/{name}`) and in the
// immutable ReleaseBinding `spec.environment` — NOT the display label, or deploys
// mismatch the binding (e.g. label "Development" vs slug "development").
const toEnvironment = (e: BffEnvironment): Environment => ({
  id: e.id ?? e.name,
  name: e.displayName || e.name,
  critical: e.critical ?? e.isProduction ?? false,
  description: e.description,
  createdAt: e.createdAt,
  dpId: e.dpId ?? e.dataPlaneRef,
});

export const fetchEnvironments = (_orgUuid: string, projectId: string): Promise<Environment[]> => bff.get<ListResponse<BffEnvironment>>(`/environments${q({ project: projectId })}`).then((r) => items(r).map(toEnvironment));

export const fetchAllEnvironments = (): Promise<Environment[]> => bff.get<ListResponse<BffEnvironment>>('/environments').then((r) => items(r).map(toEnvironment));

// CloudDataPlanes drive devant-era URL derivation (alerting, runtime logs,
// copilot region endpoints). In cloud there is one dataplane with the gateway
// host fixed at deploy time, so when the BFF returns nothing or errors we
// synthesise a single default entry — otherwise pages that gate on loadingCdps
// (Alerts, RuntimeLogsProject) hang while React Query retries.
const DEFAULT_CLOUD_DATAPLANE: CloudDataPlane = {
  id: 'default',
  external_gateway_virtual_host: '',
  internal_gateway_virtual_host: '',
  region: 'default',
  is_cilium: false,
};

export const fetchCloudDataPlanes = async (_orgUuid: string): Promise<CloudDataPlane[]> => {
  try {
    const list = items(await bff.get<ListResponse<CloudDataPlane>>('/dataplanes'));
    return list.length > 0 ? list : [DEFAULT_CLOUD_DATAPLANE];
  } catch {
    return [DEFAULT_CLOUD_DATAPLANE];
  }
};

export const fetchLoggers = (environmentId: string, componentId: string): Promise<Logger[]> => bff.get<ListResponse<Logger>>(`/components/${seg(componentId)}/loggers${q({ environment: environmentId })}`).then(items);

export const updateLogLevel = (input: UpdateLogLevelInput): Promise<{ success: boolean; message: string; commandIds: string[] }> => bff.put<{ success: boolean; message: string; commandIds: string[] }>(`/components/${seg(input.componentName)}/loggers`, input);

// Every environment must bind to a data plane. This deployment registers data
// planes cluster-scoped (ClusterDataPlane); there is no namespaced DataPlane for
// OpenChoreo's empty-ref default to resolve, so omitting the ref fails with
// "DataPlane not found". We name the conventional cluster data plane explicitly;
// the BFF maps this name onto a ClusterDataPlane ref. Name is slugged to satisfy
// the RFC 1123 metadata.name rule.
const DEFAULT_DATA_PLANE = 'default';
export const createEnvironment = (input: EnvironmentInput): Promise<Environment> =>
  bff.post<BffEnvironment>('/environments', { name: toHandler(input.name), displayName: input.name, description: input.description, isProduction: input.critical, dataPlaneRef: DEFAULT_DATA_PLANE }).then(toEnvironment);

// The BFF update accepts only displayName/description/isProduction — the slug
// (name) is the immutable identity, so a rename edits the label only.
export const updateEnvironment = (input: EnvironmentInput & { environmentId: string }): Promise<Environment> =>
  bff.put<BffEnvironment>(`/environments/${seg(input.environmentId)}`, { displayName: input.name, description: input.description, isProduction: input.critical }).then(toEnvironment);

export const deleteEnvironment = (environmentId: string): Promise<string> => bff.delete<MessageResponse>(`/environments/${seg(environmentId)}`).then((r) => r?.message ?? '');
