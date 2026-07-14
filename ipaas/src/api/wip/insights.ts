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

import { authenticatedFetch } from '../../auth/tokenManager';
import { gql } from './graphql';
import type {
  InsightsEnvironment,
  ComponentInsights,
  InsightsApiRef,
  InsightsAutomationRef,
  InsightsRange,
  ProjectComponentStat,
  ProjectInsightsRaw,
  ProjectTaskStats,
  ApiInsightsRaw,
  AutomationInsightsRaw,
  AutomationDurationStat,
  TaskExecutionDetail,
} from '../../types/insights';

// The insights query endpoint lives on the org's own systemapis gateway
// (resolved per-call from a CloudDataPlane host — see useInsightsQueryUrl in
// hooks/useInsights.ts), not a static configured host, so this takes the
// resolved URL directly rather than going through the httpClients registry.
async function postInsightsQuery<T>(queryApiUrl: string, query: string, variables: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await authenticatedFetch(queryApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Environment metadata (externalEnvId/internalEnvId/sandboxEnvId — needed to
// build a query's `environmentIds`) comes from the main project GraphQL API's
// `insightsEnvironments` query, confirmed against devant-insights-01.har —
// not the analytics query-api itself.
export async function fetchInsightsEnvironments(orgUuid: string, projectId: string): Promise<InsightsEnvironment[]> {
  try {
    const data = await gql<{ insightsEnvironments: InsightsEnvironment[] }>(
      `query insightsEnvironments($orgId: String!, $projectId: String) {
        insightsEnvironments(orgUuid: $orgId, projectId: $projectId) {
          id externalEnvId internalEnvId sandboxEnvId choreoEnvId name type region
        }
      }`,
      { orgId: orgUuid, projectId },
    );
    return data.insightsEnvironments ?? [];
  } catch {
    return [];
  }
}

// `choreoEnvId` matters: deployed devant sends it in every insights call
// (devant-insights-02.har) and automation execution stats return zeros
// without it — the repo copy of devant is older and lacks it.
function getEnvironmentIds(env: InsightsEnvironment): string[] {
  const { id, externalEnvId, sandboxEnvId, internalEnvId, choreoEnvId, type, name, region } = env;
  const ids = [id, externalEnvId, sandboxEnvId, internalEnvId, choreoEnvId].filter(Boolean) as string[];
  if (type === 'CHOREO') {
    if (name === 'Development' && region === 'US') ids.push('dev-us-east-azure', 'Dev-Internal', 'sandbox-dev');
    else if (name === 'Development' && region === 'EU') ids.push('dev-eu-north-azure', 'Dev-Internal-EU-North', 'sandbox-dev-eu-north');
    else if (name === 'Production' && region === 'US') ids.push('Production and Sandbox', 'Prod-Internal', 'sandbox-prod');
    else if (name === 'Production' && region === 'EU') ids.push('prod-eu-north-azure', 'Prod-Internal-EU-North', 'sandbox-prod-eu-north');
  }
  return [...new Set(ids)];
}

// devant's own insights calls (captured via HAR) send `TimeFilter.from/to` as
// full ISO-8601 with an offset, e.g. "2026-07-12T23:32:27.000+05:30" — not the
// space-separated "YYYY-MM-DD HH:mm:ss" this used to emit. `toISOString()`
// represents the identical instant (UTC, 'Z' suffix), which is the same
// standard format, just a different — and confirmed-working — offset.
function formatForInsights(date: Date): string {
  return date.toISOString();
}

export async function fetchComponentInsights(orgUuid: string, insightsEnv: InsightsEnvironment, apiId: string, queryApiUrl: string): Promise<ComponentInsights | null> {
  const now = new Date();
  const from = new Date(now);
  from.setUTCMonth(now.getUTCMonth() - 6);

  const result = await postInsightsQuery<{
    data?: {
      getTotalTrafficByAPI: number;
      getOverallLatencyByAPI?: { response: number };
      getTotalErrorsByAPI?: { proxy: number };
    };
  }>(
    queryApiUrl,
    `query componentInsights($dataFilter: DataFilter!, $filter: TimeFilter!, $apiId: ID!) {
      getTotalTrafficByAPI(filter: $filter, dataFilter: $dataFilter, apiId: $apiId)
      getOverallLatencyByAPI(filter: $filter, dataFilter: $dataFilter, apiId: $apiId) { response }
      getTotalErrorsByAPI(filter: $filter, dataFilter: $dataFilter, apiId: $apiId) { proxy }
    }`,
    {
      filter: { from: formatForInsights(from), to: formatForInsights(now) },
      dataFilter: { orgId: orgUuid, environmentIds: getEnvironmentIds(insightsEnv), tenant: 'carbon.super' },
      apiId,
    },
  );

  const data = result?.data;
  if (!data) return null;

  const total = data.getTotalTrafficByAPI || 0;
  const errors = data.getTotalErrorsByAPI?.proxy || 0;
  const latency = data.getOverallLatencyByAPI?.response || 0;

  return {
    requestCount: total,
    errorCount: errors,
    errorRate: total > 0 ? Math.round((errors / total) * 100) : 0,
    latency,
  };
}

// ---------- Project-level insights ----------
// KPI totals and the requests/errors trend are derived from per-component,
// apiId-scoped queries and summed client-side. The org-level
// getTotalTraffic/getSuccessSummary resolvers count ALL project gateway
// traffic (internal/system calls included), which visibly disagreed with the
// per-integration table beneath them (e.g. 230 vs a table summing 8).

const RANGE_TO_TIME: Record<InsightsRange, { ms: number; labelGranularity: 'hour' | 'day' | 'week'; queryGranularity: string }> = {
  '24h': { ms: 24 * 3_600_000, labelGranularity: 'hour', queryGranularity: '1h' },
  '7d': { ms: 7 * 86_400_000, labelGranularity: 'day', queryGranularity: '1d' },
  '30d': { ms: 30 * 86_400_000, labelGranularity: 'day', queryGranularity: '1d' },
  '3mo': { ms: 90 * 86_400_000, labelGranularity: 'week', queryGranularity: '1w' },
};

function rangeToTimeFilter(range: InsightsRange) {
  const conf = RANGE_TO_TIME[range];
  const to = new Date();
  const from = new Date(to.getTime() - conf.ms);
  return { from: formatForInsights(from), to: formatForInsights(to), labelGranularity: conf.labelGranularity, queryGranularity: conf.queryGranularity };
}

function bucketLabel(ts: number, labelGranularity: 'hour' | 'day' | 'week'): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  if (labelGranularity === 'hour') return `${String(d.getUTCHours()).padStart(2, '0')}:00`;
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

// The API summaries and the automation execution trend are bucketed
// independently by the backend (e.g. 1d API buckets vs 12h automation buckets
// over a 7d window — see devant-insights-02.har), so raw timestamps rarely
// align. Truncating every timestamp to the label granularity before merging
// puts both series into the same buckets.
function truncateTs(ts: number, labelGranularity: 'hour' | 'day' | 'week'): number {
  const d = new Date(ts);
  d.setUTCMinutes(0, 0, 0);
  if (labelGranularity !== 'hour') d.setUTCHours(0);
  if (labelGranularity === 'week') d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.getTime();
}

function buildTrend(
  successSummary: { timeSpan: string; requestCount: number }[],
  errorSummary: { timeSpan: string; errorCount: number }[],
  automationTrend: { timestamp: string; totalCount: number; failureCount: number }[],
  labelGranularity: 'hour' | 'day' | 'week',
): ProjectInsightsRaw['trend'] {
  const buckets = new Map<number, { apiRequests: number; automationRuns: number; automationErrors: number; errors: number }>();
  const add = (timeSpan: string, patch: Partial<{ apiRequests: number; automationRuns: number; automationErrors: number; errors: number }>) => {
    const ts = new Date(timeSpan).getTime();
    if (Number.isNaN(ts)) return;
    const key = truncateTs(ts, labelGranularity);
    const b = buckets.get(key) ?? { apiRequests: 0, automationRuns: 0, automationErrors: 0, errors: 0 };
    b.apiRequests += patch.apiRequests ?? 0;
    b.automationRuns += patch.automationRuns ?? 0;
    b.automationErrors += patch.automationErrors ?? 0;
    b.errors += patch.errors ?? 0;
    buckets.set(key, b);
  };
  successSummary.forEach((p) => add(p.timeSpan, { apiRequests: p.requestCount || 0 }));
  errorSummary.forEach((p) => add(p.timeSpan, { errors: p.errorCount || 0 }));
  automationTrend.forEach((p) => add(p.timestamp, { automationRuns: p.totalCount || 0, automationErrors: p.failureCount || 0 }));

  return [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([ts, v]) => ({ label: bucketLabel(ts, labelGranularity), ...v }));
}

// The project's real API ids/names as the insights backend itself sees them
// (`listAllAPI`, project-scoped). A component's own `apiId` field is
// frequently stale or unset (e.g. never (re)published), so this is the
// authoritative source used to resolve which apiId to query per component —
// matched by handler (devant's `name` here is the component slug, not the
// display name) or by the component's own apiId when that happens to match.
async function fetchAllProjectApis(queryApiUrl: string, dataFilter: Record<string, unknown>): Promise<{ id: string; name: string; displayName: string; version?: string }[]> {
  const result = await postInsightsQuery<{ data?: { listAllAPI?: { id: string; name: string; displayName: string; version?: string }[] } }>(
    queryApiUrl,
    `query ($dataFilter: DataFilter!) {
      listAllAPI(dataFilter: $dataFilter) { id name displayName version provider }
    }`,
    { dataFilter },
  );
  return result?.data?.listAllAPI ?? [];
}

// Resolves the analytics API record (id + version) for a component. Version
// matters: deployed devant scopes getAPIUsageOverTime/ByApp with
// `apiIdVersionPairs: [{ id, version }]` (devant-insights-02.har), not apiIds
// alone, so the version must travel with the id.
function resolveApi(ref: InsightsApiRef, projectApis: { id: string; name: string; displayName: string; version?: string }[]): { id: string; version: string } {
  const byId = ref.apiId ? projectApis.find((a) => a.id === ref.apiId) : undefined;
  if (byId) return { id: byId.id, version: byId.version ?? '' };
  const match = projectApis.find((a) => a.name === ref.handler || a.name === ref.name || a.displayName === ref.name || a.displayName === ref.handler);
  if (match) return { id: match.id, version: match.version ?? '' };
  return { id: ref.apiId ?? '', version: '' };
}

// Automations have no APIM traffic — devant's own insights backend exposes
// dedicated, project-scoped automation queries instead of anything client-side
// needing to chase a component's deployment/release to find its executions.
// Mirrors devant's `GetProjectInsightsOverview` (devant-insights-02.har):
// stats KPIs, the execution trend (the automation curve in the traffic chart),
// per-component durations, and the per-automation summary table — one call.
// `interval: null` matches the captured request; the backend picks the bucket
// size itself (e.g. 12h buckets over a 7d window), and `buildTrend` re-buckets
// to the display granularity anyway.
async function fetchProjectAutomationOverview(
  queryApiUrl: string,
  dataFilter: Record<string, unknown>,
  time: { from: string; to: string },
): Promise<{
  stats: ProjectTaskStats | null;
  trend: { timestamp: string; totalCount: number; successCount: number; failureCount: number }[];
  summary: { automationName: string; totalExecutions: number; failureCount: number; errorRate: number; lastRunRelative?: string; lastExecutionStatus?: string }[];
  duration: { componentId: string; averageDurationMs: number }[];
}> {
  const result = await postInsightsQuery<{
    data?: {
      getTaskExecutionStats?: ProjectTaskStats;
      getAutomationExecutionTrend?: { timestamp: string; totalCount: number; successCount: number; failureCount: number }[];
      getAutomationSummaryTable?: { automationName: string; totalExecutions: number; failureCount: number; errorRate: number; lastRunRelative?: string; lastExecutionStatus?: string }[];
      getAutomationExecutionDuration?: { componentId: string; averageDurationMs: number }[];
    };
  }>(
    queryApiUrl,
    `query GetProjectInsightsOverview($dataFilter: DataFilter!, $timeFilter: TimeFilter!, $automationFilter: AutomationFilter, $interval: String) {
      getTaskExecutionStats(dataFilter: $dataFilter, timeFilter: $timeFilter, automationFilter: $automationFilter) {
        totalExecutions successfulJobs failedJobs timeoutJobs errorCount errorRatePercent successRatePercent
      }
      getAutomationExecutionTrend(dataFilter: $dataFilter, timeFilter: $timeFilter, automationFilter: $automationFilter, interval: $interval) {
        timestamp totalCount successCount failureCount
      }
      getAutomationSummaryTable(dataFilter: $dataFilter, timeFilter: $timeFilter, automationFilter: $automationFilter) {
        automationName totalExecutions failureCount errorRate executionFrequency lastRun lastRunRelative lastExecutionStatus
      }
      getAutomationExecutionDuration(dataFilter: $dataFilter, timeFilter: $timeFilter, automationFilter: $automationFilter) {
        componentId averageDurationMs
      }
    }`,
    { dataFilter, timeFilter: { from: time.from, to: time.to }, automationFilter: null, interval: null },
  );

  return {
    stats: result?.data?.getTaskExecutionStats ?? null,
    trend: result?.data?.getAutomationExecutionTrend ?? [],
    summary: result?.data?.getAutomationSummaryTable ?? [],
    duration: result?.data?.getAutomationExecutionDuration ?? [],
  };
}

export async function fetchProjectInsights(orgUuid: string, projectId: string, insightsEnv: InsightsEnvironment, apis: InsightsApiRef[], automations: InsightsAutomationRef[], range: InsightsRange, queryApiUrl: string): Promise<ProjectInsightsRaw> {
  const time = rangeToTimeFilter(range);
  const dataFilter = { orgId: orgUuid, environmentIds: getEnvironmentIds(insightsEnv), tenant: 'carbon.super', projectId };

  const [projectApis, automationOverview] = await Promise.all([fetchAllProjectApis(queryApiUrl, dataFilter), fetchProjectAutomationOverview(queryApiUrl, dataFilter, time)]);

  // Per-API table rows need a per-component breakdown; resolve each
  // component's real apiId (+version) against `listAllAPI` rather than
  // trusting its own (often stale/empty) `apiId` field.
  const resolved = apis.map((a) => ({ ref: a, api: resolveApi(a, projectApis) }));
  const perApi = await Promise.all(resolved.map(async ({ ref, api }) => ({ ref, ins: api.id ? await fetchComponentInsights(orgUuid, insightsEnv, api.id, queryApiUrl) : null })));
  const apiStats: ProjectComponentStat[] = perApi.map(({ ref, ins }) => ({
    id: ref.id,
    name: ref.name,
    handler: ref.handler,
    type: ref.kind,
    requestCount: ins?.requestCount ?? 0,
    errorCount: ins?.errorCount ?? 0,
    errorRate: ins?.errorRate ?? 0,
    latency: ins?.latency ?? 0,
  }));

  // Summary rows are matched by name against the component slug OR display
  // name — the backend's `automationName` is the component handler.
  const summaryByName = new Map(automationOverview.summary.map((r) => [r.automationName?.toLowerCase(), r]));
  const durationById = new Map(automationOverview.duration.map((r) => [r.componentId, r]));
  const autoStats: ProjectComponentStat[] = automations.map((a) => {
    const summary = summaryByName.get(a.name.toLowerCase()) ?? summaryByName.get(a.handler.toLowerCase());
    const duration = durationById.get(a.id);
    if (!summary && !duration) return { id: a.id, name: a.name, handler: a.handler, type: a.kind, requestCount: null, errorCount: null, errorRate: null, latency: null, last: null };
    return {
      id: a.id,
      name: a.name,
      handler: a.handler,
      type: a.kind,
      requestCount: summary?.totalExecutions ?? 0,
      errorCount: summary?.failureCount ?? 0,
      errorRate: summary ? Math.round(summary.errorRate) : 0,
      latency: duration ? Math.round(duration.averageDurationMs) : null,
      last: summary?.lastRunRelative ?? null,
    };
  });

  // KPI totals = sums over the project's own integration components, so the
  // headline numbers always agree with the table beneath them.
  const totalRequests = apiStats.reduce((s, a) => s + (a.requestCount ?? 0), 0);
  const totalErrors = apiStats.reduce((s, a) => s + (a.errorCount ?? 0), 0);
  const weightedLatency = apiStats.reduce((s, a) => s + (a.latency ?? 0) * (a.requestCount ?? 0), 0);
  const avgLatency = totalRequests > 0 ? Math.round(weightedLatency / totalRequests) : 0;

  const scopedApis = resolved.map(({ api }) => api).filter((a) => a.id);
  const uniqueApiIds = [...new Set(scopedApis.map((a) => a.id))];
  const [successSummary, errorTrends] = await Promise.all([fetchUsageTrendForApis(queryApiUrl, dataFilter, scopedApis, time), Promise.all(uniqueApiIds.map((id) => fetchErrorsByCategory(queryApiUrl, dataFilter, id, time)))]);
  const errBuckets = new Map<string, number>();
  errorTrends.flat().forEach((p) => errBuckets.set(p.timeSpan, (errBuckets.get(p.timeSpan) ?? 0) + (p.auth || 0) + (p.targetConnectivity || 0) + (p.throttled || 0) + (p.other || 0)));
  const errorSummary = [...errBuckets.entries()].map(([timeSpan, errorCount]) => ({ timeSpan, errorCount }));

  const trend = buildTrend(successSummary, errorSummary, automationOverview.trend, time.labelGranularity);

  return { totalRequests, totalErrors, avgLatency, trend, components: [...apiStats, ...autoStats], taskStats: automationOverview.stats };
}

// Project-level latency trend for the trend card's "Latency" mode — getLatency
// has no multi-API form, so query each API in parallel and average p95/median
// per time bucket across APIs.
export async function fetchProjectLatencyTrend(orgUuid: string, projectId: string, insightsEnv: InsightsEnvironment, apis: InsightsApiRef[], range: InsightsRange, queryApiUrl: string): Promise<{ label: string; p95: number; median: number }[]> {
  const time = rangeToTimeFilter(range);
  const dataFilter = { orgId: orgUuid, environmentIds: getEnvironmentIds(insightsEnv), tenant: 'carbon.super', projectId };
  const projectApis = await fetchAllProjectApis(queryApiUrl, dataFilter);
  const ids = [...new Set(apis.map((a) => resolveApi(a, projectApis).id).filter(Boolean))];
  if (ids.length === 0) return [];
  const perApi = await Promise.all(ids.map((id) => fetchLatencyByCategory(queryApiUrl, dataFilter, id, time)));
  const buckets = new Map<number, { p95: number; median: number; n: number }>();
  perApi.flat().forEach((p) => {
    const ts = new Date(p.timeSpan).getTime();
    if (Number.isNaN(ts)) return;
    const key = truncateTs(ts, time.labelGranularity);
    const b = buckets.get(key) ?? { p95: 0, median: 0, n: 0 };
    b.p95 += p.response || 0;
    b.median += p.responseMedian || 0;
    b.n += 1;
    buckets.set(key, b);
  });
  return [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([ts, v]) => ({ label: bucketLabel(ts, time.labelGranularity), p95: Math.round(v.p95 / v.n), median: Math.round(v.median / v.n) }));
}

// ---------- Automation (integration-level) insights ----------
// Mirrors devant's `GetIntegrationInsightsOverview` (devant-insights-02.har):
// the same project-scoped dataFilter plus `AutomationFilter.componentIDs`
// narrows stats/durations/executions to one automation component. This replaces
// the earlier client-side derivation from useTaskExecutions, which depended on
// resolving a releaseId through the deployment API and silently showed nothing
// when that chain broke.
export async function fetchAutomationInsights(orgUuid: string, projectId: string, insightsEnv: InsightsEnvironment, componentId: string, range: InsightsRange, queryApiUrl: string): Promise<AutomationInsightsRaw> {
  const time = rangeToTimeFilter(range);
  const dataFilter = { orgId: orgUuid, environmentIds: getEnvironmentIds(insightsEnv), tenant: 'carbon.super', projectId };

  const result = await postInsightsQuery<{
    data?: {
      getTaskExecutionStats?: ProjectTaskStats;
      getAutomationExecutionDuration?: AutomationDurationStat[];
      getTaskExecutionDetails?: TaskExecutionDetail[];
    };
  }>(
    queryApiUrl,
    `query GetIntegrationInsightsOverview($dataFilter: DataFilter!, $timeFilter: TimeFilter!, $automationFilter: AutomationFilter!) {
      getTaskExecutionStats(dataFilter: $dataFilter, timeFilter: $timeFilter, automationFilter: $automationFilter) {
        totalExecutions successfulJobs failedJobs timeoutJobs errorCount errorRatePercent successRatePercent
      }
      getAutomationExecutionDuration(dataFilter: $dataFilter, timeFilter: $timeFilter, automationFilter: $automationFilter) {
        componentName componentId averageDurationMs p95DurationMs averageDurationFormatted p95DurationFormatted
      }
      getTaskExecutionDetails(dataFilter: $dataFilter, timeFilter: $timeFilter, automationFilter: $automationFilter) {
        jobId jobName startTime endTime durationSeconds status durationFormatted revision attemptCount versionId
      }
    }`,
    { dataFilter, timeFilter: { from: time.from, to: time.to }, automationFilter: { componentIDs: [componentId] } },
  );

  return {
    stats: result?.data?.getTaskExecutionStats ?? null,
    durations: result?.data?.getAutomationExecutionDuration ?? [],
    executions: result?.data?.getTaskExecutionDetails ?? [],
  };
}

// ---------- API (integration-level) insights ----------
// apiId-scoped queries ported from choreo-apim-analytics-portal
// (`src/api/traffic|latency|errors/Query.ts`), which hits the same
// analyticsqueryapi endpoint as everything above — this is the real
// "filter by integration" mechanism Devant's own Insights page provides
// (it renders that package for the project page rather than using its own
// data/insights/query.ts, which has no apiId scoping at all).
//
// Granularity values here follow devant-insights-01.har's confirmed-working
// '1h'/'1d'/'1w' convention (shared with the project-view queries above),
// not the analytics-portal's own display-string GRANULARITY enum
// ('Hours'/'Days'/...) — both frontends feed the same filter field, and the
// HAR is the one with verified real traffic. If one of these specific
// queries comes back empty, a granularity-format mismatch is the first
// thing to check; `postInsightsQuery` degrading to `null` means that shows
// up as one empty widget, not a page crash.

interface TimeSeriesPoint {
  timeSpan: string;
  count: number;
}

/** Some of these ported queries return a single object when scoped to one id and (per the
 * schema shape implied by an `apiId`/`backend`-keyed field sitting next to the list) may
 * return an array when the underlying resolver treats the filter as multi-id. Normalizing
 * here means both shapes resolve correctly without needing GraphQL schema introspection. */
function asArray<T>(v: T | T[] | null | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

// Per-API total requests over time — distinct from the by-app breakdown below;
// this is the API's own total, not summed from per-app numbers.
export async function fetchApiUsageOverTime(queryApiUrl: string, dataFilter: Record<string, unknown>, apiId: string, apiVersion: string, time: { from: string; to: string; queryGranularity: string }): Promise<TimeSeriesPoint[]> {
  const result = await postInsightsQuery<{
    data?: { getAPIUsageOverTime?: { apiId: string; usage?: TimeSeriesPoint[] } | { apiId: string; usage?: TimeSeriesPoint[] }[] };
  }>(
    queryApiUrl,
    `query ($dataFilter: DataFilter!, $timeFilter: TimeFilter!, $apiUsageOvertimeFilter: APIUsageOverTimeFilter!) {
      getAPIUsageOverTime(timeFilter: $timeFilter, apiUsageOvertimeFilter: $apiUsageOvertimeFilter, dataFilter: $dataFilter) {
        apiId
        usage { timeSpan count }
      }
    }`,
    { timeFilter: { from: time.from, to: time.to }, apiUsageOvertimeFilter: { apiIds: [apiId], appIds: [], granularity: time.queryGranularity, trafficType: 'ALL', apiIdVersionPairs: apiVersion ? [{ id: apiId, version: apiVersion }] : [] }, dataFilter },
  );
  const entries = asArray(result?.data?.getAPIUsageOverTime);
  // Strict match only — the entries[0] fallback showed ANOTHER API's traffic
  // whenever id resolution missed, which is worse than an empty chart.
  return entries.find((e) => e.apiId === apiId)?.usage ?? [];
}

// Requests-over-time summed across the project's own APIs — replaces the
// org-level getSuccessSummary for the project trend chart. Response entries
// are strictly filtered to the requested apiIds before summing.
async function fetchUsageTrendForApis(queryApiUrl: string, dataFilter: Record<string, unknown>, apis: { id: string; version: string }[], time: { from: string; to: string; queryGranularity: string }): Promise<{ timeSpan: string; requestCount: number }[]> {
  if (apis.length === 0) return [];
  const result = await postInsightsQuery<{
    data?: { getAPIUsageOverTime?: { apiId: string; usage?: TimeSeriesPoint[] } | { apiId: string; usage?: TimeSeriesPoint[] }[] };
  }>(
    queryApiUrl,
    `query ($dataFilter: DataFilter!, $timeFilter: TimeFilter!, $apiUsageOvertimeFilter: APIUsageOverTimeFilter!) {
      getAPIUsageOverTime(timeFilter: $timeFilter, apiUsageOvertimeFilter: $apiUsageOvertimeFilter, dataFilter: $dataFilter) {
        apiId
        usage { timeSpan count }
      }
    }`,
    {
      timeFilter: { from: time.from, to: time.to },
      apiUsageOvertimeFilter: { apiIds: apis.map((a) => a.id), appIds: [], granularity: time.queryGranularity, trafficType: 'ALL', apiIdVersionPairs: apis.filter((a) => a.version).map((a) => ({ id: a.id, version: a.version })) },
      dataFilter,
    },
  );
  const wanted = new Set(apis.map((a) => a.id));
  const buckets = new Map<string, number>();
  for (const e of asArray(result?.data?.getAPIUsageOverTime)) {
    if (!wanted.has(e.apiId)) continue;
    for (const p of e.usage ?? []) buckets.set(p.timeSpan, (buckets.get(p.timeSpan) ?? 0) + (p.count || 0));
  }
  return [...buckets.entries()].map(([timeSpan, requestCount]) => ({ timeSpan, requestCount }));
}

// Per-application breakdown of a single API's traffic over time.
export async function fetchApiUsageByApp(
  queryApiUrl: string,
  dataFilter: Record<string, unknown>,
  apiId: string,
  apiVersion: string,
  time: { from: string; to: string; queryGranularity: string },
): Promise<{ applicationName: string; usage: TimeSeriesPoint[] }[]> {
  const result = await postInsightsQuery<{
    data?: { getAPIUsageByAppOverTime?: { usage?: { applicationId: string; applicationName: string; usage?: TimeSeriesPoint[] }[] } };
  }>(
    queryApiUrl,
    `query ($dataFilter: DataFilter!, $timeFilter: TimeFilter!, $apiUsageOvertimeFilter: APIUsageOverTimeFilter!) {
      getAPIUsageByAppOverTime(timeFilter: $timeFilter, apiUsageOvertimeFilter: $apiUsageOvertimeFilter, dataFilter: $dataFilter) {
        usage { applicationId applicationName usage { timeSpan count } }
      }
    }`,
    { timeFilter: { from: time.from, to: time.to }, apiUsageOvertimeFilter: { apiIds: [apiId], appIds: [], granularity: time.queryGranularity, trafficType: 'ALL', apiIdVersionPairs: apiVersion ? [{ id: apiId, version: apiVersion }] : [] }, dataFilter },
  );
  return (result?.data?.getAPIUsageByAppOverTime?.usage ?? []).map((u) => ({ applicationName: u.applicationName, usage: u.usage ?? [] }));
}

// Per-backend breakdown of a single API's traffic over time — "Usage by Backend".
export async function fetchUsageByBackend(queryApiUrl: string, dataFilter: Record<string, unknown>, apiId: string, time: { from: string; to: string; queryGranularity: string }): Promise<{ backend: string; usage: TimeSeriesPoint[] }[]> {
  const result = await postInsightsQuery<{
    data?: { getAPIUsageByBackendOverTime?: { usage?: { backend: string; usage?: TimeSeriesPoint[] }[] } };
  }>(
    queryApiUrl,
    `query ($dataFilter: DataFilter!, $timeFilter: TimeFilter!, $apiUsageByBackendOverTimeFilter: APIUsageByBackendOverTimeFilter!) {
      getAPIUsageByBackendOverTime(timeFilter: $timeFilter, apiUsageByBackendOverTimeFilter: $apiUsageByBackendOverTimeFilter, dataFilter: $dataFilter) {
        usage { backend usage { timeSpan count } }
      }
    }`,
    { timeFilter: { from: time.from, to: time.to }, apiUsageByBackendOverTimeFilter: { apiIds: [apiId], granularity: time.queryGranularity }, dataFilter },
  );
  return (result?.data?.getAPIUsageByBackendOverTime?.usage ?? []).map((u) => ({ backend: u.backend, usage: u.usage ?? [] }));
}

// Per-resource-path breakdown — "Resource Usage" table.
export async function fetchResourceUsage(queryApiUrl: string, dataFilter: Record<string, unknown>, apiId: string, time: { from: string; to: string }): Promise<{ apiResourceTemplate: string; apiMethod: string; count: number }[]> {
  const result = await postInsightsQuery<{
    data?: { getResourceUsage?: { usage?: { apiId: string; apiResourceTemplate: string; apiMethod: string; count: number }[] } };
  }>(
    queryApiUrl,
    `query ($dataFilter: DataFilter!, $timeFilter: TimeFilter!, $resourceUsageFilter: ResourceUsageFilter!) {
      getResourceUsage(timeFilter: $timeFilter, resourceUsageFilter: $resourceUsageFilter, dataFilter: $dataFilter) {
        usage { apiId apiResourceTemplate apiMethod count }
      }
    }`,
    {
      timeFilter: { from: time.from, to: time.to },
      resourceUsageFilter: { apiIds: [apiId], appIds: [], trafficType: 'ALL', searchFilter: { searchText: '', apiIds: [] }, paginationFilter: { limit: 20, offset: 0, sortBy: 'count', sortOrder: 'desc' } },
      dataFilter,
    },
  );
  return (result?.data?.getResourceUsage?.usage ?? []).filter((u) => u.apiId === apiId);
}

// p95 (`response`) vs median (`responseMedian`) latency over time — "Latency by Category".
export async function fetchLatencyByCategory(
  queryApiUrl: string,
  dataFilter: Record<string, unknown>,
  apiId: string,
  time: { from: string; to: string; queryGranularity: string },
): Promise<{ timeSpan: string; response: number; backend: number; requestMediation: number; responseMediation: number; responseMedian: number; backendMedian: number; requestMediationMedian: number; responseMediationMedian: number }[]> {
  const result = await postInsightsQuery<{
    data?: {
      getLatency?: { summary?: { timeSpan: string; response: number; backend: number; requestMediation: number; responseMediation: number; responseMedian: number; backendMedian: number; requestMediationMedian: number; responseMediationMedian: number }[] };
    };
  }>(
    queryApiUrl,
    `query ($dataFilter: DataFilter!, $timeFilter: TimeFilter!, $latencyFilter: LatencyFilter!) {
      getLatency(timeFilter: $timeFilter, latencyFilter: $latencyFilter, dataFilter: $dataFilter) {
        summary { timeSpan response backend requestMediation responseMediation responseMedian backendMedian requestMediationMedian responseMediationMedian }
      }
    }`,
    { timeFilter: { from: time.from, to: time.to }, latencyFilter: { apiId, granularity: time.queryGranularity }, dataFilter },
  );
  return result?.data?.getLatency?.summary ?? [];
}

// Project-wide slowest-API ranking — real, shown as project context alongside a single API's page.
export async function fetchTopSlowestApis(queryApiUrl: string, dataFilter: Record<string, unknown>, time: { from: string; to: string }): Promise<{ apiId: string; latency: number }[]> {
  const result = await postInsightsQuery<{ data?: { topSlowestAPIs?: { apiId: string; latency: number }[] } }>(
    queryApiUrl,
    `query ($dataFilter: DataFilter!, $timeFilter: TimeFilter!, $limit: Int!) {
      topSlowestAPIs(filter: $timeFilter, dataFilter: $dataFilter, limit: $limit) { apiId latency }
    }`,
    { timeFilter: { from: time.from, to: time.to }, dataFilter, limit: 10 },
  );
  return result?.data?.topSlowestAPIs ?? [];
}

// Error counts by category (auth/targetConnectivity/throttled/other) over time — "Errors Over Time".
export async function fetchErrorsByCategory(
  queryApiUrl: string,
  dataFilter: Record<string, unknown>,
  apiId: string,
  time: { from: string; to: string; queryGranularity: string },
): Promise<{ timeSpan: string; auth: number; targetConnectivity: number; throttled: number; other: number }[]> {
  const result = await postInsightsQuery<{
    data?: { getErrorsByCategory?: { errors?: { timeSpan: string; auth: number; targetConnectivity: number; throttled: number; other: number }[] } };
  }>(
    queryApiUrl,
    `query ($dataFilter: DataFilter!, $timeFilter: TimeFilter!, $errorsByCategoryFilter: ErrorsByCategoryFilter!) {
      getErrorsByCategory(timeFilter: $timeFilter, errorsByCategoryFilter: $errorsByCategoryFilter, dataFilter: $dataFilter) {
        errors { timeSpan auth targetConnectivity throttled other }
      }
    }`,
    { timeFilter: { from: time.from, to: time.to }, dataFilter, errorsByCategoryFilter: { apiId, categories: [], granularity: time.queryGranularity } },
  );
  return result?.data?.getErrorsByCategory?.errors ?? [];
}

// Status-code counts, split Proxy vs Target — real 2-row × status-code matrix ("Errors by Status Code").
export async function fetchErrorsByStatusCode(
  queryApiUrl: string,
  dataFilter: Record<string, unknown>,
  apiId: string,
  apiAliases: string[],
  time: { from: string; to: string },
): Promise<{ proxy: { statusCode: string; count: number }[]; target: { statusCode: string; count: number }[] }> {
  const query = `query ($dataFilter: DataFilter!, $timeFilter: TimeFilter!, $errorCountByStatusCodeFilter: ErrorCountByStatusCodeFilter!) {
    getErrorsByStatusCode(timeFilter: $timeFilter, errorCountByStatusCodeFilter: $errorCountByStatusCodeFilter, dataFilter: $dataFilter) {
      errors { apiId errorCountByCode { statusCode count } }
    }
  }`;
  type Resp = { data?: { getErrorsByStatusCode?: { errors?: { apiId: string; errorCountByCode?: { statusCode: string; count: number }[] }[] } } };
  const paginationFilter = { limit: 20, offset: 0, sortBy: 'count', sortOrder: 'desc' };
  // Response apiId may be the uuid OR a "name - version" composite (same
  // backend quirk as getErrorsDetails), so match every alias — and never fall
  // back to errors[0], which belongs to a different API.
  const accepted = new Set([apiId, ...apiAliases].filter(Boolean));
  const extract = (res: Resp | null) => {
    const errors = res?.data?.getErrorsByStatusCode?.errors ?? [];
    return errors.find((e) => accepted.has(e.apiId))?.errorCountByCode ?? [];
  };
  const [proxyRes, targetRes] = await Promise.all([
    postInsightsQuery<Resp>(queryApiUrl, query, { timeFilter: { from: time.from, to: time.to }, dataFilter, errorCountByStatusCodeFilter: { apiId, errorType: 'PROXY', paginationFilter } }),
    postInsightsQuery<Resp>(queryApiUrl, query, { timeFilter: { from: time.from, to: time.to }, dataFilter, errorCountByStatusCodeFilter: { apiId, errorType: 'TARGET', paginationFilter } }),
  ]);
  return { proxy: extract(proxyRes), target: extract(targetRes) };
}

// Per-application error breakdown — "Errors by Category" table (Application/Reason/Count).
// The response's `apiId` is NOT the uuid — devant-insights-02.har shows the
// backend returns a "name - version" composite there (e.g. "hello-world-service
// - v1.0"), so rows are matched against every known alias for the API instead
// of the uuid alone (a bare uuid match silently emptied the table).
export async function fetchErrorsDetails(queryApiUrl: string, dataFilter: Record<string, unknown>, apiId: string, apiAliases: string[], time: { from: string; to: string }): Promise<{ applicationName: string; reason: string; count: number }[]> {
  const result = await postInsightsQuery<{ data?: { getErrorsDetails?: { usage?: { apiId: string; applicationName: string; reason: string; count: number }[] } } }>(
    queryApiUrl,
    `query ($dataFilter: DataFilter!, $timeFilter: TimeFilter!, $errorsDetailsFilter: ErrorsDetailsFilter!) {
      getErrorsDetails(timeFilter: $timeFilter, errorsDetailsFilter: $errorsDetailsFilter, dataFilter: $dataFilter) {
        usage { apiId applicationName reason count }
      }
    }`,
    { timeFilter: { from: time.from, to: time.to }, dataFilter, errorsDetailsFilter: { apiId, paginationFilter: { limit: 20, offset: 0, sortBy: 'count', sortOrder: 'desc' } } },
  );
  const accepted = new Set([apiId, ...apiAliases].filter(Boolean));
  return (result?.data?.getErrorsDetails?.usage ?? []).filter((u) => accepted.has(u.apiId));
}

// Shared time-range → query-time-filter conversion, exported for the API-view hook
// (mirrors `rangeToTimeFilter` above, which stays project-view-internal).
export function apiRangeToTimeFilter(range: InsightsRange) {
  return rangeToTimeFilter(range);
}

// Merges the base bundle's three time-series (requests/errors/latency, each
// independently bucketed by the backend) into one aligned trend for the
// Overview/Traffic chart. Buckets are matched by timestamp, same technique
// as the project view's `buildTrend`.
function buildApiOverviewTrend(
  usage: { timeSpan: string; count: number }[],
  errors: { timeSpan: string; auth: number; targetConnectivity: number; throttled: number; other: number }[],
  latency: { timeSpan: string; response: number }[],
  labelGranularity: 'hour' | 'day' | 'week',
): ApiInsightsRaw['overviewTrend'] {
  const buckets = new Map<number, { requests: number; errors: number; latency: number }>();
  const get = (ts: number) => buckets.get(ts) ?? { requests: 0, errors: 0, latency: 0 };
  usage.forEach((p) => {
    const ts = new Date(p.timeSpan).getTime();
    if (Number.isNaN(ts)) return;
    buckets.set(ts, { ...get(ts), requests: p.count || 0 });
  });
  errors.forEach((p) => {
    const ts = new Date(p.timeSpan).getTime();
    if (Number.isNaN(ts)) return;
    buckets.set(ts, { ...get(ts), errors: (p.auth || 0) + (p.targetConnectivity || 0) + (p.throttled || 0) + (p.other || 0) });
  });
  latency.forEach((p) => {
    const ts = new Date(p.timeSpan).getTime();
    if (Number.isNaN(ts)) return;
    buckets.set(ts, { ...get(ts), latency: Math.round(p.response || 0) });
  });
  return [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([ts, v]) => ({ label: bucketLabel(ts, labelGranularity), requests: v.requests, errors: v.errors, latency: v.latency }));
}

function statusCodeKind(code: string): 'limited' | 'down' | null {
  const digit = code?.trim()[0];
  if (digit === '4') return 'limited';
  if (digit === '5') return 'down';
  return null;
}

export async function fetchApiInsights(orgUuid: string, projectId: string, insightsEnv: InsightsEnvironment, apiRef: InsightsApiRef, range: InsightsRange, tab: 'overview' | 'traffic' | 'latency' | 'errors', queryApiUrl: string): Promise<ApiInsightsRaw> {
  const time = rangeToTimeFilter(range);
  const dataFilter = { orgId: orgUuid, environmentIds: getEnvironmentIds(insightsEnv), tenant: 'carbon.super', projectId };

  // Same real-apiId resolution `fetchProjectInsights` uses: the component's own
  // `apiId` is frequently stale/unset, so `listAllAPI` (project-scoped) is the
  // authoritative source, matched by handler/display name.
  const projectApis = await fetchAllProjectApis(queryApiUrl, dataFilter);
  const { id: apiId, version: apiVersion } = resolveApi(apiRef, projectApis);
  const apiMeta = projectApis.find((a) => a.id === apiId);
  const apiAliases = apiMeta ? [apiMeta.version ? `${apiMeta.name} - ${apiMeta.version}` : '', apiMeta.name, apiMeta.displayName].filter(Boolean) : [];
  if (!apiId) {
    return {
      totalRequests: 0,
      totalErrors: 0,
      latencyP95: 0,
      latencyMedian: 0,
      overviewTrend: [],
      availability: [],
      byApplication: [],
      byBackend: [],
      resources: [],
      latencyTrend: [],
      topSlowest: [],
      errorsTrend: [],
      statusCodeHeatmap: { rows: [], cols: [], cells: [], max: 1 },
      errorsByCategory: [],
    };
  }

  // Base bundle — always fetched: the KPI row (shown on every tab) and the
  // Overview/Traffic trend + Availability donut all come from it, and it
  // doubles as the Errors-tab trend (errorsTrend) and Latency-tab trend
  // (latencyTrend), so no per-tab duplicate queries for those two charts.
  const [usage, errorsByCategory, latencySummary, statusCodes] = await Promise.all([
    fetchApiUsageOverTime(queryApiUrl, dataFilter, apiId, apiVersion, time),
    fetchErrorsByCategory(queryApiUrl, dataFilter, apiId, time),
    fetchLatencyByCategory(queryApiUrl, dataFilter, apiId, time),
    fetchErrorsByStatusCode(queryApiUrl, dataFilter, apiId, apiAliases, time),
  ]);

  const totalRequests = usage.reduce((s, p) => s + (p.count || 0), 0);
  const totalErrors = errorsByCategory.reduce((s, p) => s + (p.auth || 0) + (p.targetConnectivity || 0) + (p.throttled || 0) + (p.other || 0), 0);
  const latestLatency = latencySummary[latencySummary.length - 1];
  const latencyP95 = latestLatency?.response ?? 0;
  const latencyMedian = latestLatency?.responseMedian ?? 0;

  const allStatusCounts = [...statusCodes.proxy, ...statusCodes.target];
  const limited = allStatusCounts.filter((c) => statusCodeKind(c.statusCode) === 'limited').reduce((s, c) => s + c.count, 0);
  const down = allStatusCounts.filter((c) => statusCodeKind(c.statusCode) === 'down').reduce((s, c) => s + c.count, 0);
  const availableCount = Math.max(0, totalRequests - limited - down);
  const availTotal = Math.max(1, availableCount + limited + down);
  const availability: ApiInsightsRaw['availability'] = (
    [
      { kind: 'available', label: 'Available', value: Math.round((availableCount / availTotal) * 1000) / 10 },
      { kind: 'limited', label: 'Limited', value: Math.round((limited / availTotal) * 1000) / 10 },
      { kind: 'down', label: 'Down', value: Math.round((down / availTotal) * 1000) / 10 },
    ] satisfies ApiInsightsRaw['availability']
  ).filter((s) => s.value > 0);

  const overviewTrend = buildApiOverviewTrend(usage, errorsByCategory, latencySummary, time.labelGranularity);
  const errorsTrend: ApiInsightsRaw['errorsTrend'] = errorsByCategory.map((p) => ({
    label: bucketLabel(new Date(p.timeSpan).getTime(), time.labelGranularity),
    auth: p.auth || 0,
    targetConnectivity: p.targetConnectivity || 0,
    throttled: p.throttled || 0,
    other: p.other || 0,
  }));
  const latencyTrend: ApiInsightsRaw['latencyTrend'] = latencySummary.map((p) => ({
    label: bucketLabel(new Date(p.timeSpan).getTime(), time.labelGranularity),
    p95: Math.round(p.response || 0),
    median: Math.round(p.responseMedian || 0),
    backendP95: Math.round(p.backend || 0),
    backendMedian: Math.round(p.backendMedian || 0),
    requestMedP95: Math.round(p.requestMediation || 0),
    requestMedMedian: Math.round(p.requestMediationMedian || 0),
    responseMedP95: Math.round(p.responseMediation || 0),
    responseMedMedian: Math.round(p.responseMediationMedian || 0),
  }));

  const codeList = [...new Set([...statusCodes.proxy, ...statusCodes.target].map((c) => c.statusCode))].sort();
  const proxyByCode = new Map(statusCodes.proxy.map((c) => [c.statusCode, c.count]));
  const targetByCode = new Map(statusCodes.target.map((c) => [c.statusCode, c.count]));
  const statusCodeHeatmap: ApiInsightsRaw['statusCodeHeatmap'] = {
    rows: ['Proxy', 'Target'],
    cols: codeList,
    cells: codeList.flatMap((code, ci) => [
      { row: 0, col: ci, value: proxyByCode.get(code) ?? 0 },
      { row: 1, col: ci, value: targetByCode.get(code) ?? 0 },
    ]),
    max: Math.max(1, ...[...proxyByCode.values(), ...targetByCode.values()]),
  };

  const base: Omit<ApiInsightsRaw, 'byApplication' | 'byBackend' | 'resources' | 'topSlowest' | 'errorsByCategory'> = {
    totalRequests,
    totalErrors,
    latencyP95,
    latencyMedian,
    overviewTrend,
    availability,
    latencyTrend,
    errorsTrend,
    statusCodeHeatmap,
  };

  if (tab === 'traffic') {
    const [byApp, byBackend, resources] = await Promise.all([fetchApiUsageByApp(queryApiUrl, dataFilter, apiId, apiVersion, time), fetchUsageByBackend(queryApiUrl, dataFilter, apiId, time), fetchResourceUsage(queryApiUrl, dataFilter, apiId, time)]);
    return {
      ...base,
      byApplication: byApp.map((a) => ({ label: a.applicationName, value: a.usage.reduce((s, p) => s + (p.count || 0), 0) })),
      byBackend: byBackend.map((b) => ({ label: b.backend, value: b.usage.reduce((s, p) => s + (p.count || 0), 0) })),
      resources: resources.map((r) => ({ path: r.apiResourceTemplate, method: r.apiMethod, count: r.count, share: totalRequests > 0 ? `${((r.count / totalRequests) * 100).toFixed(1)}%` : '0%' })),
      topSlowest: [],
      errorsByCategory: [],
    };
  }

  if (tab === 'latency') {
    const topSlowestRaw = await fetchTopSlowestApis(queryApiUrl, dataFilter, time);
    return { ...base, byApplication: [], byBackend: [], resources: [], topSlowest: topSlowestRaw.map((s) => ({ name: s.apiId, latencyMs: Math.round(s.latency) })), errorsByCategory: [] };
  }

  if (tab === 'errors') {
    const details = await fetchErrorsDetails(queryApiUrl, dataFilter, apiId, apiAliases, time);
    return { ...base, byApplication: [], byBackend: [], resources: [], topSlowest: [], errorsByCategory: details.map((d) => ({ app: d.applicationName, reason: d.reason, count: d.count })) };
  }

  return { ...base, byApplication: [], byBackend: [], resources: [], topSlowest: [], errorsByCategory: [] };
}
