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
 * Cloud runtime-log API. Queries the wso2cloud observability proxy directly
 * (POST {observabilityUrl}/wso2cloud-obs/api/v1/logs/query). The devant
 * logsApiUrl argument is ignored — it is a Choreo system-API URL that does
 * not exist in the cloud deployment; the proxy base comes from config.
 *
 * In cloud, project / component / environment ids are the OpenChoreo K8s
 * resource names, so request ids map straight onto the proxy search scope.
 */

import { bff, items, obsClient, seg, type ListResponse } from './_client';
import type { LogsRequest, ComponentLogsRequest, LogRow } from '../../types/logs';

const LOGS_QUERY_PATH = '/wso2cloud-obs/api/v1/logs/query';

// Levels the proxy indexes; sent when the caller does not filter, since the
// proxy treats an empty logLevels list as "match nothing".
export const DEFAULT_LOG_LEVELS = ['INFO', 'DEBUG', 'ERROR', 'WARN'];

// Scope fields are independent label filters — any subset narrows the query
// (e.g. build logs filter on workflowRunName alone).
export interface ObsLogsScope {
  project?: string;
  component?: string;
  environment?: string;
  workflowRunName?: string;
}

export interface ObsLogsQuery {
  searchScope: ObsLogsScope;
  startTime: string;
  endTime: string;
  limit: number;
  sortOrder: 'asc' | 'desc';
  logLevels: string[];
  searchPhrase: string;
}

// Proxy log entry: timestamp/level/log plus whatever extended metadata fields
// the ingestion pipeline attached (same names as LogRow).
interface ObsLogEntry extends Partial<Omit<LogRow, 'timestamp' | 'level' | 'logLine'>> {
  timestamp?: string;
  level?: string;
  log?: string;
}

// LogRow has non-optional metadata fields the proxy may omit; fill explicit
// null/'' defaults so consumers can read them unconditionally.
const toLogRow = (e: ObsLogEntry): LogRow => ({
  timestamp: e.timestamp ?? '',
  level: e.level ?? '',
  logLine: e.log ?? '',
  class: e.class ?? null,
  logFilePath: e.logFilePath ?? null,
  appName: e.appName ?? null,
  module: e.module ?? null,
  serviceType: e.serviceType ?? null,
  app: e.app ?? null,
  deployment: e.deployment ?? null,
  artifactContainer: e.artifactContainer ?? null,
  product: e.product ?? null,
  icpRuntimeId: e.icpRuntimeId ?? null,
  logContext: e.logContext ?? null,
  componentVersion: e.componentVersion ?? '',
  componentVersionId: e.componentVersionId ?? '',
  gatewayCode: e.gatewayCode ?? null,
  statusCode: e.statusCode ?? null,
});

export async function queryObsLogs(query: ObsLogsQuery): Promise<LogRow[]> {
  const body: ObsLogsQuery = {
    ...query,
    logLevels: query.logLevels.length > 0 ? query.logLevels : DEFAULT_LOG_LEVELS,
  };
  const json = await obsClient.post<{ logs?: ObsLogEntry[] }>(LOGS_QUERY_PATH, body);
  return (json?.logs ?? []).map(toLogRow);
}

// Runtime-log queries must carry the owning project, but ComponentLogsRequest
// has no project field. The BFF surfaces it as WorkflowRun metadata
// (build.projectName), so resolve it from the component's latest build and
// memoize — runtime logs poll on an interval and the value is stable per
// component.
const projectByComponent = new Map<string, Promise<string | undefined>>();

async function resolveProject(componentId: string): Promise<string | undefined> {
  let pending = projectByComponent.get(componentId);
  if (!pending) {
    pending = bff
      .get<ListResponse<{ projectName?: string }>>(`/components/${seg(componentId)}/builds`)
      .then((r) => items(r)[0]?.projectName)
      .catch(() => undefined);
    projectByComponent.set(componentId, pending);
  }
  const project = await pending;
  // Don't cache an empty result — let a later call retry once builds exist.
  if (!project) projectByComponent.delete(componentId);
  return project;
}

export function fetchLogs(req: LogsRequest, _logsApiUrl: string): Promise<LogRow[]> {
  // A single entry means a specific integration was selected; multiple entries
  // mean "all in project", which the project scope already covers.
  const selectedComponent = req.componentIdList.length === 1 ? req.componentIdList[0] : undefined;
  return queryObsLogs({
    searchScope: {
      project: req.projectId,
      ...(selectedComponent ? { component: selectedComponent } : {}),
      environment: req.environmentId.toLowerCase(),
    },
    startTime: req.startTime,
    endTime: req.endTime,
    limit: req.limit,
    sortOrder: req.sort,
    logLevels: req.logLevels,
    searchPhrase: req.searchPhrase,
  });
}

export async function fetchComponentLogs(req: ComponentLogsRequest, _logsApiUrl: string): Promise<LogRow[]> {
  // ComponentLogsRequest carries no project field, but the proxy requires it;
  // resolve the owning project from the component's builds.
  const project = await resolveProject(req.componentId);
  return queryObsLogs({
    searchScope: {
      ...(project ? { project } : {}),
      component: req.componentId,
      environment: req.environmentId.toLowerCase(),
    },
    startTime: req.startTime,
    endTime: req.endTime,
    limit: req.limit,
    sortOrder: req.sort,
    logLevels: req.logLevels,
    searchPhrase: req.searchPhrase,
  });
}
