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
  namespace?: string;
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

// The proxy filters on searchScope.namespace, which is the org's K8s namespace
// (e.g. wc-019ecb37-a8449032). The BFF only
// surfaces it as metadata on a WorkflowRun (build.namespace) or a Project
// (project.namespaceName). Resolve it from there and memoize — runtime logs
// poll on an interval, and the value is stable for the lookup target.
const namespaceCache = new Map<string, Promise<string | undefined>>();

async function resolveNamespace(opts: { componentId?: string; projectId?: string }): Promise<string | undefined> {
  const key = opts.componentId ? `c:${opts.componentId}` : opts.projectId ? `p:${opts.projectId}` : '';
  if (!key) return undefined;
  let pending = namespaceCache.get(key);
  if (!pending) {
    pending = (async () => {
      // Prefer a build's namespace (matches how the obs-proxy indexes build/
      // runtime logs); fall back to the project's namespaceName when the target
      // has no builds yet. projectName is optional on the builds route.
      if (opts.componentId) {
        const ns = await bff
          .get<ListResponse<{ namespace?: string }>>(`/components/${seg(opts.componentId)}/builds`)
          .then((r) => items(r)[0]?.namespace)
          .catch(() => undefined);
        if (ns) return ns;
      }
      if (opts.projectId) {
        return bff
          .get<{ namespaceName?: string }>(`/projects/${seg(opts.projectId)}`)
          .then((p) => p?.namespaceName)
          .catch(() => undefined);
      }
      return undefined;
    })();
    namespaceCache.set(key, pending);
  }
  const namespace = await pending;
  // Don't cache an empty result — let a later call retry once builds exist.
  if (!namespace) namespaceCache.delete(key);
  return namespace;
}

export async function fetchLogs(req: LogsRequest, _logsApiUrl: string): Promise<LogRow[]> {
  // A single entry means a specific integration was selected; multiple entries
  // mean "all in project", which the project scope already covers.
  const selectedComponent = req.componentIdList.length === 1 ? req.componentIdList[0] : undefined;
  const namespace = await resolveNamespace({ componentId: selectedComponent, projectId: req.projectId });
  return queryObsLogs({
    searchScope: {
      ...(namespace ? { namespace } : {}),
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
  // ComponentLogsRequest carries no project field; the scope filters on
  // component + environment within the org namespace.
  const namespace = await resolveNamespace({ componentId: req.componentId });
  return queryObsLogs({
    searchScope: {
      ...(namespace ? { namespace } : {}),
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
