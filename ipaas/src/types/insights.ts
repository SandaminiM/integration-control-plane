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

export interface InsightsEnvironment {
  id: string;
  externalEnvId: string;
  internalEnvId: string;
  sandboxEnvId: string;
  /** Choreo runtime env id — automation execution records are keyed on this (see devant HARs) */
  choreoEnvId?: string;
  name: string;
  region: string;
  type: string;
}

export interface ComponentInsights {
  requestCount: number;
  errorCount: number;
  errorRate: number;
  latency: number;
}

// ---------- Project-level insights ----------

export type InsightsRange = '24h' | '7d' | '30d' | '3mo';

export interface ProjectInsightsKpi {
  key: string;
  label: string;
  value: string;
  sub: string;
  /** render the value itself in the error color */
  danger?: boolean;
  /** per-kind active-integration counts, rendered as dot+count inside the Active Integrations card */
  typeMix?: { kind: IntegrationKind; count: number }[];
}

export interface ProjectActivityPoint {
  label: string;
  services: number;
  agents: number;
  events: number;
  automations: number;
}

/** One integration-type series in the merged Activity chart. */
export interface ActivitySeriesMeta {
  key: IntegrationKind;
  label: string;
  color: string;
}

/** One time bucket of the merged Activity chart — a `label` plus a per-kind count
 * keyed by IntegrationKind (all eight keys present). */
export type ActivityChartPoint = { label: string } & Record<IntegrationKind, number>;

/** Merged "Activity over time" model: every integration type's counts in one
 * series set, plotted together ("All") or filtered to a single type. */
export interface ProjectActivityData {
  points: ActivityChartPoint[];
  series: ActivitySeriesMeta[];
}

export interface ProjectTrendPoint {
  label: string;
  apiRequests: number;
  automationRuns: number;
  automationErrors: number;
  errors: number;
}

/** One bucket of the errors-over-time series feeding the Top-failing card chart. */
export interface ProjectErrorPoint {
  label: string;
  errors: number;
}

export type IntegrationKind = 'api' | 'auto' | 'rag' | 'agent' | 'mcp' | 'webhook' | 'event' | 'file';

export interface ProjectIntegrationRow {
  id: string;
  name: string;
  /** Component handler — used to link to the integration's own insights page. */
  handler: string;
  desc: string;
  type: IntegrationKind;
  successCount: string;
  errorCount: string;
  /** '—' for automations */
  latency: string;
  last: string;
  /** component no longer exists; row derived from analytics backend records */
  deleted?: boolean;
}

export interface ProjectVolumeRow {
  id: string;
  name: string;
  handler: string;
  type: IntegrationKind;
  /** formatted volume count */
  volume: string;
  /** native unit — requests/runs/invocations/events */
  unit: string;
  /** 0..100 share of total volume */
  share: number;
  /** bar color for this kind */
  color: string;
}

export interface ProjectFailingRow {
  id: string;
  name: string;
  handler: string;
  type: IntegrationKind;
  /** native unit — requests/runs/invocations/events */
  unit: string;
  /** error percentage */
  errorRate: number;
  /** formatted error count */
  errorCount: string;
}

export interface ProjectLatencyMetric {
  label: string;
  value: string;
}

export interface ProjectLatencyRow {
  key: string;
  label: string;
  /** what the latency represents — e.g. "Response time" / "Run duration" */
  sub: string;
  color: string;
  metrics: ProjectLatencyMetric[];
}

export interface ProjectInsightsData {
  kpis: ProjectInsightsKpi[];
  trend: ProjectTrendPoint[];
  activityChart: ProjectActivityData;
  topByVolume: ProjectVolumeRow[];
  topFailing: ProjectFailingRow[];
  latencyRows: ProjectLatencyRow[];
  integrations: ProjectIntegrationRow[];
}

// Raw numeric aggregate returned by the API layer (fetchProjectInsights).
// The hook's toProjectInsightsData() formats it into ProjectInsightsData so
// the real and mock paths share one formatter.

export interface ProjectComponentStat {
  id: string;
  name: string;
  handler: string;
  type: IntegrationKind;
  /** null for automations — no APIM traffic */
  requestCount: number | null;
  errorCount: number | null;
  errorRate: number | null;
  latency: number | null;
  /** human-readable last-run time (automations only — from getAutomationSummaryTable) */
  last?: string | null;
  /** component no longer exists; row derived from analytics backend records */
  deleted?: boolean;
}

/** Project-wide automation execution stats (getTaskExecutionStats). */
export interface ProjectTaskStats {
  totalExecutions: number;
  successfulJobs: number;
  failedJobs: number;
  timeoutJobs: number;
  errorRatePercent: number;
  successRatePercent: number;
}

export interface ProjectInsightsRaw {
  totalRequests: number;
  totalErrors: number;
  /** request-weighted average latency (ms) */
  avgLatency: number;
  /** project-level gateway traffic, KPI card */
  totalTraffic: number;
  /** project-level error request count, KPI card */
  totalTrafficErrors: number;
  /** project-mean automation duration (ms) */
  autoAvgDurationMs: number;
  /** worst automation p95 duration (ms) */
  autoP95DurationMs: number;
  trend: { label: string; apiRequests: number; automationRuns: number; automationErrors: number; errors: number }[];
  /** per-integration-type activity series (Services/AI Agents/Event Handlers/Automations), one entry per time bucket */
  activity: ProjectActivityPoint[];
  /** Services activity split by service sub-type, aligned bucket-for-bucket with
   * `activity` — feeds the Services chart's sub-type filter. */
  serviceActivity: { label: string; api: number; mcp: number; webhook: number }[];
  /** Event Handlers activity split by sub-type (event / file), aligned
   * bucket-for-bucket with `activity` — feeds the Events chart's sub-type filter. */
  eventActivity: { label: string; event: number; file: number }[];
  /** Automations activity split by sub-type (auto / rag), aligned bucket-for-bucket
   * with `activity` — feeds the Automations chart's sub-type filter. */
  automationActivity: { label: string; auto: number; rag: number }[];
  /** request-weighted average latency (ms) per service sub-type — feeds the
   * Latency & duration rows. */
  serviceLatencyByKind: { api: number; agent: number; mcp: number; webhook: number };
  /** execution duration (ms) per automation sub-type — feeds the Automations and
   * RAG Ingestions Latency & duration rows. */
  autoDurationByKind: { auto: { avgMs: number; p95Ms: number }; rag: { avgMs: number; p95Ms: number } };
  components: ProjectComponentStat[];
  /** null when the automation overview query failed/was empty */
  taskStats: ProjectTaskStats | null;
}

export interface OrgInsightsRaw {
  totalTraffic: number;
  totalErrors: number;
  avgLatency: number;
  trend: { label: string; apiRequests: number; errors: number }[];
}

/** Inputs the API layer needs per component to query APIM insights.
 * `handler` (the component slug) is used to resolve the real apiId against
 * `listAllAPI` when the component's own `apiId` is stale or unset. */
export interface InsightsApiRef {
  id: string;
  name: string;
  handler: string;
  apiId: string;
  /** Which API-like integration flavor this component is — drives the table chip/desc. */
  kind: 'api' | 'agent' | 'mcp' | 'webhook' | 'event' | 'file';
}

/** Inputs the API layer needs per automation component. Matched against the
 * insights backend's project-scoped automation summary by name/id. */
export interface InsightsAutomationRef {
  id: string;
  name: string;
  handler: string;
  /** 'rag' = RAG Ingestion component — treated exactly like an automation for insights */
  kind: 'auto' | 'rag';
}

// ---------- Shared: heatmap ----------

export interface HeatmapCell {
  row: number;
  col: number;
  value: number;
}

export interface HeatmapData {
  rows: string[];
  cols: string[];
  cells: HeatmapCell[];
  /** Scale reference for cell opacity/color — the max cell value (or a caller-chosen ceiling). */
  max: number;
}

// ---------- Automation (integration-level) insights ----------
// Backed by the insights backend's dedicated automation queries (see
// devant-insights-02.har: `GetIntegrationInsightsOverview` — getTaskExecutionStats,
// getAutomationExecutionDuration, getTaskExecutionDetails, all scoped via
// `AutomationFilter.componentIDs`), same analyticsqueryapi endpoint as the rest.

/** One finished job run (getTaskExecutionDetails). */
export interface TaskExecutionDetail {
  jobId: string;
  jobName: string;
  /** ISO-8601 */
  startTime: string;
  endTime: string;
  durationSeconds: number;
  status: string;
  durationFormatted: string;
  revision: string;
  attemptCount: number;
  versionId: string;
}

/** Per-component duration aggregate (getAutomationExecutionDuration). */
export interface AutomationDurationStat {
  componentId: string;
  componentName: string;
  averageDurationMs: number;
  p95DurationMs: number;
  averageDurationFormatted: string;
  p95DurationFormatted: string;
}

export interface AutomationInsightsRaw {
  stats: ProjectTaskStats | null;
  durations: AutomationDurationStat[];
  executions: TaskExecutionDetail[];
}

export interface AutomationInsightsKpi {
  key: string;
  label: string;
  value: string;
  sub: string;
}

export type ExecutionOutcome = 'success' | 'failure' | 'timeout';

export interface ExecutionScatterPoint {
  id: string;
  label: string;
  durationSec: number;
  outcome: ExecutionOutcome;
}

export interface AutomationTrendPoint {
  label: string;
  success: number;
  failure: number;
  timeout: number;
}

export interface AutomationInsightsData {
  kpis: AutomationInsightsKpi[];
  scatter: ExecutionScatterPoint[];
  heatmap: HeatmapData;
  trend: AutomationTrendPoint[];
}

// ---------- API (integration-level) insights ----------
// Backed by the same `analyticsqueryapi` endpoint as the project view, using
// apiId-scoped queries ported from choreo-apim-analytics-portal (the "filter
// by integration" Devant's own Insights page provides via that package).

export interface ApiInsightsKpi {
  key: string;
  label: string;
  value: string;
  sub: string;
  danger?: boolean;
}

export interface ApiTrendPoint {
  label: string;
  requests: number;
  errors: number;
  /** p95 latency (ms) for this bucket — omitted where the source query has no per-bucket latency. */
  latency?: number;
}

export type AvailabilityKind = 'available' | 'limited' | 'down';

export interface AvailabilitySlice {
  kind: AvailabilityKind;
  label: string;
  /** percentage share, e.g. 96.2 */
  value: number;
}

export interface ApiOverviewData {
  trend: ApiTrendPoint[];
  availability: AvailabilitySlice[];
}

export interface NamedValue {
  label: string;
  value: number;
}

export interface ResourceUsageRow {
  path: string;
  method: string;
  count: number;
  share: string;
}

export interface ApiTrafficData {
  trend: ApiTrendPoint[];
  byApplication: NamedValue[];
  byBackend: NamedValue[];
  resources: ResourceUsageRow[];
}

/** One bucket of getLatency — all four Devant latency categories, p95 + median each. */
export interface LatencyTrendPoint {
  label: string;
  p95: number;
  median: number;
  backendP95: number;
  backendMedian: number;
  requestMedP95: number;
  requestMedMedian: number;
  responseMedP95: number;
  responseMedMedian: number;
}

export interface SlowestApiRow {
  name: string;
  latencyMs: number;
}

export interface ApiLatencyData {
  trend: LatencyTrendPoint[];
}

export interface ErrorCategoryPoint {
  label: string;
  auth: number;
  targetConnectivity: number;
  throttled: number;
  other: number;
}

export interface ErrorCategoryRow {
  app: string;
  reason: string;
  count: number;
}

export interface ApiErrorsData {
  trend: ErrorCategoryPoint[];
  statusCodeHeatmap: HeatmapData;
  byCategory: ErrorCategoryRow[];
}

export type ApiInsightsTab = 'overview' | 'traffic' | 'latency' | 'errors';

export interface ApiInsightsData {
  kpis: ApiInsightsKpi[];
  overview: ApiOverviewData;
  traffic: ApiTrafficData;
  latency: ApiLatencyData;
  errors: ApiErrorsData;
}

// Raw numeric aggregate returned by the API layer (fetchApiInsights). The
// hook's toApiInsightsData() formats it into ApiInsightsData, same split as
// ProjectInsightsRaw/toProjectInsightsData for the project view. Tab-specific
// arrays (byApplication/byBackend/resources/topSlowest/byCategory) are only
// populated when that tab was the active one at fetch time — empty otherwise,
// until the user switches to it and the query re-fetches with that tab active.
export interface ApiInsightsRaw {
  totalRequests: number;
  totalErrors: number;
  latencyP95: number;
  latencyMedian: number;
  /** requests + errors + p95 latency, one point per bucket */
  overviewTrend: ApiTrendPoint[];
  availability: AvailabilitySlice[];
  byApplication: NamedValue[];
  byBackend: NamedValue[];
  resources: ResourceUsageRow[];
  latencyTrend: LatencyTrendPoint[];
  errorsTrend: ErrorCategoryPoint[];
  statusCodeHeatmap: HeatmapData;
  errorsByCategory: ErrorCategoryRow[];
}
