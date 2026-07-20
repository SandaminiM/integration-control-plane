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

import type { JSX } from 'react';
import { Activity, AlertTriangle, Clock, Gauge, Globe, Layers, Timer, XCircle, Zap } from '@wso2/oxygen-ui-icons-react';
import type { ApiInsightsTab, AvailabilityKind, InsightsApiRef, InsightsRange, IntegrationKind } from '../types/insights';
import type { IntegrationType } from '../types/integration';

// Pastel set validated with the dataviz palette checker: lightness band,
// chroma floor and adjacent-pair CVD pass; low surface contrast relieved by
// legends/tooltips. Single source for every insights chart color.
export const INSIGHTS_CHART_COLORS = {
  orange: '#E8964A',
  blue: '#7986CB',
  red: '#E57373',
  green: '#81C784',
  amber: '#D9A63F',
  purple: '#9575CD',
} as const;

/** Project-view roles (ProjectInsights trend charts). */
export const PROJECT_CHART = {
  api: INSIGHTS_CHART_COLORS.orange,
  auto: INSIGHTS_CHART_COLORS.blue,
  error: INSIGHTS_CHART_COLORS.red,
  success: INSIGHTS_CHART_COLORS.green,
  failure: INSIGHTS_CHART_COLORS.red,
  timeout: INSIGHTS_CHART_COLORS.amber,
} as const;

/** API-view roles (ApiInsightsView charts). */
export const API_CHART = {
  requests: INSIGHTS_CHART_COLORS.orange,
  errors: INSIGHTS_CHART_COLORS.red,
  latency: INSIGHTS_CHART_COLORS.blue,
  p95: INSIGHTS_CHART_COLORS.orange,
  median: INSIGHTS_CHART_COLORS.blue,
  auth: INSIGHTS_CHART_COLORS.red,
  target: INSIGHTS_CHART_COLORS.purple,
  throttled: INSIGHTS_CHART_COLORS.amber,
  other: INSIGHTS_CHART_COLORS.blue,
} as const;

export const AVAILABILITY_COLOR: Record<AvailabilityKind, string> = {
  available: INSIGHTS_CHART_COLORS.green,
  limited: INSIGHTS_CHART_COLORS.amber,
  down: INSIGHTS_CHART_COLORS.red,
};

export const OUTCOME_COLOR: Record<'success' | 'failure' | 'timeout', string> = {
  success: INSIGHTS_CHART_COLORS.green,
  failure: INSIGHTS_CHART_COLORS.red,
  timeout: INSIGHTS_CHART_COLORS.amber,
};

/**
 * Icon + accent color for every StatCard KPI rendered across the three
 * insights views (project, api, automation). Merged into one map so each
 * view just looks up by KPI key.
 */
export const KPI_ICONS: Record<string, { icon: JSX.Element; color: 'primary' | 'error' | 'info' | 'warning' | 'success' | 'secondary' }> = {
  activeIntegrations: { icon: <Layers size={24} />, color: 'primary' },
  totalInvocations: { icon: <Zap size={24} />, color: 'info' },
  successRate: { icon: <Gauge size={24} />, color: 'success' },
  errors: { icon: <AlertTriangle size={24} />, color: 'error' },
  traffic: { icon: <Globe size={24} />, color: 'primary' },
  executions: { icon: <Zap size={24} />, color: 'info' },
  errorRequests: { icon: <AlertTriangle size={24} />, color: 'error' },
  failedExecutions: { icon: <XCircle size={24} />, color: 'error' },
  total: { icon: <Zap size={24} />, color: 'primary' },
  failed: { icon: <XCircle size={24} />, color: 'error' },
  errorRate: { icon: <AlertTriangle size={24} />, color: 'error' },
  avgDuration: { icon: <Clock size={24} />, color: 'info' },
  p95Duration: { icon: <Timer size={24} />, color: 'info' },
  latency: { icon: <Activity size={24} />, color: 'info' },
  errorCount: { icon: <XCircle size={24} />, color: 'error' },
};

export const DEPLOYMENT_STATUS_CHIP: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  ACTIVE: { label: 'Active', color: 'success' },
  IN_PROGRESS: { label: 'In Progress', color: 'warning' },
  ERROR: { label: 'Error', color: 'error' },
  SUSPENDED: { label: 'Suspended', color: 'default' },
  NOT_DEPLOYED: { label: 'Not Deployed', color: 'default' },
  UNKNOWN: { label: 'Unknown', color: 'default' },
};

export const INSIGHTS_RANGES: { value: InsightsRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '3mo', label: '3mo' },
];

export const API_TABS: { value: ApiInsightsTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'latency', label: 'Latency' },
  { value: 'errors', label: 'Errors' },
];

/** Overview chart metric → series key, legend name, color and card subtitle. */
export const METRIC_SERIES = {
  requests: { dataKey: 'requests', name: 'Requests', color: API_CHART.requests, subtitle: 'Request count over time' },
  errors: { dataKey: 'errors', name: 'Errors', color: API_CHART.errors, subtitle: 'Error count over time' },
  latency: { dataKey: 'latency', name: 'Latency (ms)', color: API_CHART.latency, subtitle: 'Latency (ms) over time' },
} as const;

/**
 * API-like integration types all publish an APIM-tracked API, so they share
 * the Integration-as-API insights view; RAG ingestion rides the automation one.
 */
export const API_LIKE_TYPES: readonly IntegrationType[] = ['integration-as-api', 'ai-agent', 'mcp-server', 'webhook'];

/** IntegrationType → the API-like insights `kind`; falls back to 'api'. */
export const TYPE_TO_KIND: Partial<Record<IntegrationType, InsightsApiRef['kind']>> = {
  'ai-agent': 'agent',
  'mcp-server': 'mcp',
  webhook: 'webhook',
  'event-integration': 'event',
  'file-integration': 'file',
};

/** Chip/label text per integration kind (project table chip + CSV). */
export const INSIGHTS_KIND_LABEL: Record<IntegrationKind, string> = {
  api: 'Integration as API',
  auto: 'Automation',
  rag: 'RAG Ingestion',
  agent: 'AI Agent',
  mcp: 'MCP Server',
  webhook: 'Webhook',
  event: 'Event Integration',
  file: 'File Integration',
};

/** Row description text per integration kind (project table sub-text) — note
 * the slightly different casing ('API integration' / 'RAG ingestion'). */
export const INSIGHTS_KIND_DESC: Record<IntegrationKind, string> = {
  api: 'API integration',
  auto: 'Automation',
  rag: 'RAG ingestion',
  agent: 'AI Agent',
  mcp: 'MCP Server',
  webhook: 'Webhook',
  event: 'Event integration',
  file: 'File integration',
};

/** Short plural labels for the Active Integrations card type-mix. */
export const KIND_SHORT: Record<IntegrationKind, string> = {
  api: 'APIs',
  auto: 'Automations',
  rag: 'RAG Ingestions',
  agent: 'AI Agents',
  mcp: 'MCP Servers',
  webhook: 'Webhooks',
  event: 'Event Integrations',
  file: 'File Integrations',
};

/** Dot color per integration kind for the Active Integrations card type-mix. */
export const KIND_DOT: Record<IntegrationKind, string> = {
  api: INSIGHTS_CHART_COLORS.blue,
  auto: INSIGHTS_CHART_COLORS.green,
  rag: INSIGHTS_CHART_COLORS.amber,
  agent: INSIGHTS_CHART_COLORS.purple,
  mcp: INSIGHTS_CHART_COLORS.orange,
  webhook: INSIGHTS_CHART_COLORS.red,
  event: INSIGHTS_CHART_COLORS.orange,
  file: INSIGHTS_CHART_COLORS.amber,
};

/** The four "Activity over time" charts: group key, card title, native unit, bar color. */
export const ACTIVITY_META: { key: 'services' | 'agents' | 'events' | 'automations'; title: string; unit: string; color: string }[] = [
  { key: 'services', title: 'Services', unit: 'requests', color: INSIGHTS_CHART_COLORS.blue },
  { key: 'automations', title: 'Automations', unit: 'runs', color: INSIGHTS_CHART_COLORS.green },
  { key: 'agents', title: 'AI Agents', unit: 'invocations', color: INSIGHTS_CHART_COLORS.purple },
  { key: 'events', title: 'Event Handlers', unit: 'events processed', color: INSIGHTS_CHART_COLORS.orange },
];

/** Native unit per integration kind, used by the "Top integrations by volume" rows. */
export const UNIT_BY_KIND: Record<IntegrationKind, string> = {
  api: 'requests',
  webhook: 'requests',
  mcp: 'requests',
  agent: 'invocations',
  event: 'events',
  file: 'events',
  auto: 'runs',
  rag: 'runs',
};
