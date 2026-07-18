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
  delta: string;
  /** true = green (good) chip, false = red (bad) chip */
  deltaGood: boolean;
  /** render the value itself in the error color */
  danger?: boolean;
}

export interface ProjectTrendPoint {
  label: string;
  apiRequests: number;
  automationRuns: number;
  automationErrors: number;
  errors: number;
}

export type HealthKind = 'success' | 'failure' | 'timeout';

export interface ProjectHealthSlice {
  kind: HealthKind;
  label: string;
  /** percentage share, e.g. 96.2 */
  value: number;
  sub: string;
}

export type IntegrationKind = 'api' | 'auto' | 'rag' | 'agent' | 'mcp' | 'webhook';

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

export interface ProjectInsightsData {
  kpis: ProjectInsightsKpi[];
  trend: ProjectTrendPoint[];
  health: ProjectHealthSlice[];
  healthCenter: string;
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
  trend: { label: string; apiRequests: number; automationRuns: number; automationErrors: number; errors: number }[];
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
  kind: 'api' | 'agent' | 'mcp' | 'webhook';
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
