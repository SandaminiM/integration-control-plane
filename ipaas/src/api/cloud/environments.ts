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

import type { GqlEnvironment, CloudDataPlane, EnvironmentInput, GqlLogger, UpdateLogLevelInput } from '../../types/environment';
import { bff, items, q, seg, type ListResponse, type MessageResponse } from './_client';

// _orgUuid is kept for devant contract parity; cloud derives the org from the token.

export const fetchEnvironments = (_orgUuid: string, projectId: string): Promise<GqlEnvironment[]> =>
  bff.get<ListResponse<GqlEnvironment>>(`/environments${q({ project: projectId })}`).then(items);

export const fetchAllEnvironments = (): Promise<GqlEnvironment[]> =>
  bff.get<ListResponse<GqlEnvironment>>('/environments').then(items);

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

export const fetchLoggers = (environmentId: string, componentId: string): Promise<GqlLogger[]> =>
  bff.get<ListResponse<GqlLogger>>(`/components/${seg(componentId)}/loggers${q({ environment: environmentId })}`).then(items);

export const updateLogLevel = (input: UpdateLogLevelInput): Promise<{ success: boolean; message: string; commandIds: string[] }> =>
  bff.put<{ success: boolean; message: string; commandIds: string[] }>(`/components/${seg(input.componentName)}/loggers`, input);

export const createEnvironment = (input: EnvironmentInput): Promise<GqlEnvironment> =>
  bff.post<GqlEnvironment>('/environments', input);

export const updateEnvironment = (input: EnvironmentInput & { environmentId: string }): Promise<GqlEnvironment> =>
  bff.put<GqlEnvironment>(`/environments/${seg(input.environmentId)}`, input);

export const deleteEnvironment = (environmentId: string): Promise<string> =>
  bff.delete<MessageResponse>(`/environments/${seg(environmentId)}`).then((r) => r?.message ?? '');
