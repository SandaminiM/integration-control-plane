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

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchProjectInsights, fetchProjectLatencyTrend } from '#api/insights';
import { useInsightsQueryUrl } from './useInsights';
import type { InsightsApiRef, InsightsAutomationRef, InsightsEnvironment, InsightsRange, IntegrationStatus, ProjectComponentStat, ProjectHealthSlice, ProjectInsightsData, ProjectInsightsRaw } from '../types/insights';

const fmt = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`);

function statusFor(stat: ProjectComponentStat): IntegrationStatus {
  if (stat.errorRate == null) return 'Healthy';
  if (stat.errorRate >= 10) return 'Down';
  if (stat.errorRate >= 3) return 'Degraded';
  return 'Healthy';
}

// ---------- shared formatter (real + mock feed into this) ----------

export function toProjectInsightsData(raw: ProjectInsightsRaw): ProjectInsightsData {
  const errorRate = raw.totalRequests > 0 ? (raw.totalErrors / raw.totalRequests) * 100 : 0;
  const apiCount = raw.components.filter((c) => c.type === 'api').length;
  const agentCount = raw.components.filter((c) => c.type === 'agent').length;
  const mcpCount = raw.components.filter((c) => c.type === 'mcp').length;
  const webhookCount = raw.components.filter((c) => c.type === 'webhook').length;

  // Health combines API traffic with automation executions (getTaskExecutionStats)
  // so a project with only automations still gets a real health split — plus the
  // timeout slice, which only automations produce.
  const stats = raw.taskStats;
  const autoCount = raw.components.filter((c) => c.type === 'auto').length;
  const ragCount = raw.components.filter((c) => c.type === 'rag').length;
  const okCount = Math.max(0, raw.totalRequests - raw.totalErrors) + (stats?.successfulJobs ?? 0);
  const failCount = raw.totalErrors + (stats?.failedJobs ?? 0);
  const timeoutCount = stats?.timeoutJobs ?? 0;
  const grandTotal = okCount + failCount + timeoutCount;
  const pct = (n: number) => (grandTotal > 0 ? Number(((n / grandTotal) * 100).toFixed(1)) : 0);
  const success = pct(okCount);

  return {
    kpis: [
      {
        key: 'requests',
        label: 'Total API Requests',
        value: fmt(raw.totalRequests),
        sub: `${apiCount} Integrations as API${agentCount > 0 ? ` · ${agentCount} AI Agents` : ''}${mcpCount > 0 ? ` · ${mcpCount} MCP Servers` : ''}${webhookCount > 0 ? ` · ${webhookCount} Webhooks` : ''}`,
        delta: '',
        deltaGood: true,
      },
      { key: 'executions', label: 'Total Executions', value: fmt(stats?.totalExecutions ?? 0), sub: `${autoCount} Automations${ragCount > 0 ? ` · ${ragCount} RAG ingestions` : ''}`, delta: '', deltaGood: true },
      { key: 'errors', label: 'Total Errors', value: fmt(raw.totalErrors), sub: 'Across all APIs', delta: '', deltaGood: false, danger: true },
      { key: 'errorRate', label: 'Error Rate', value: `${errorRate.toFixed(1)}%`, sub: 'Across all traffic', delta: '', deltaGood: true, danger: true },
    ],
    trend: raw.trend.map((p) => ({ label: p.label, apiRequests: p.apiRequests, automationRuns: p.automationRuns, automationErrors: p.automationErrors, errors: p.errors })),
    health: (
      [
        { kind: 'success', label: 'Successful', value: success, sub: `${fmt(okCount)} requests/runs` },
        { kind: 'failure', label: 'Failed', value: pct(failCount), sub: `${fmt(failCount)} requests/runs` },
        { kind: 'timeout', label: 'Timed Out', value: pct(timeoutCount), sub: `${fmt(timeoutCount)} runs` },
      ] satisfies ProjectHealthSlice[]
    ).filter((s) => s.value > 0),
    healthCenter: `${success.toFixed(1)}%`,
    integrations: raw.components.map((c) => ({
      id: c.id,
      name: c.name,
      handler: c.handler,
      desc: c.type === 'api' ? 'API integration' : c.type === 'agent' ? 'AI Agent' : c.type === 'mcp' ? 'MCP Server' : c.type === 'webhook' ? 'Webhook' : c.type === 'rag' ? 'RAG ingestion' : 'Automation',
      type: c.type,
      volume: c.requestCount != null ? `${fmt(c.requestCount)} ${c.type === 'auto' || c.type === 'rag' ? 'runs' : 'req'}` : '—',
      errorRate: c.errorRate != null ? `${c.errorRate}%` : null,
      latency: c.latency != null ? `${c.latency} ms` : '—',
      last: c.last ?? '—',
      status: statusFor(c),
    })),
  };
}

// ---------- real data ----------

export function useProjectInsights(orgUuid: string, projectId: string, insightsEnv: InsightsEnvironment | null, apis: InsightsApiRef[], automations: InsightsAutomationRef[], range: InsightsRange) {
  const apiKey = apis.map((a) => a.apiId).join(',');
  const autoKey = automations.map((a) => a.id).join(',');
  const hasIntegrations = apis.length > 0 || automations.length > 0;
  const queryApiUrl = useInsightsQueryUrl(orgUuid);
  const enabled = !!orgUuid && !!insightsEnv && hasIntegrations && !!queryApiUrl;

  const query = useQuery({
    queryKey: ['projectInsights', orgUuid, projectId, insightsEnv?.id ?? null, range, apiKey, autoKey, queryApiUrl],
    queryFn: () => fetchProjectInsights(orgUuid, projectId, insightsEnv!, apis, automations, range, queryApiUrl!),
    enabled,
    staleTime: 60_000,
  });

  // The integration *list* must reflect what's actually in the project even
  // when the live query hasn't run yet or never can (disabled — no matching
  // insights environment — loading, or errored): every known api/automation
  // gets a placeholder row with base/zero KPI values, which the query's real
  // per-component stats then override by id once it resolves. Without this,
  // a project with real components but no working insights query would show
  // an empty table instead of the components with zeroed-out metrics.
  const raw = useMemo<ProjectInsightsRaw>(() => {
    if (query.data) return query.data;
    return {
      totalRequests: 0,
      totalErrors: 0,
      avgLatency: 0,
      trend: [],
      components: [
        ...apis.map((a): ProjectComponentStat => ({ id: a.id, name: a.name, handler: a.handler, type: a.kind, requestCount: 0, errorCount: 0, errorRate: 0, latency: 0 })),
        ...automations.map((a): ProjectComponentStat => ({ id: a.id, name: a.name, handler: a.handler, type: a.kind, requestCount: null, errorCount: null, errorRate: null, latency: null })),
      ],
      taskStats: null,
    };
  }, [query.data, apis, automations]);

  const data = useMemo(() => toProjectInsightsData(raw), [raw]);
  return { data, isLoading: query.isLoading, isError: query.isError, enabled, hasIntegrations };
}

// Lazy latency trend for the project trend card's "Latency" mode — only
// fetched while that mode is selected.
export function useProjectLatencyTrend(orgUuid: string, projectId: string, insightsEnv: InsightsEnvironment | null, apis: InsightsApiRef[], range: InsightsRange, active: boolean) {
  const queryApiUrl = useInsightsQueryUrl(orgUuid);
  const enabled = active && !!orgUuid && !!insightsEnv && apis.length > 0 && !!queryApiUrl;
  const apiKey = apis.map((a) => a.apiId).join(',');
  const query = useQuery({
    queryKey: ['projectLatencyTrend', orgUuid, projectId, insightsEnv?.id ?? null, range, apiKey, queryApiUrl],
    queryFn: () => fetchProjectLatencyTrend(orgUuid, projectId, insightsEnv!, apis, range, queryApiUrl!),
    enabled,
    staleTime: 60_000,
  });
  return { data: query.data ?? [], isLoading: enabled && query.isLoading };
}

// ---------- mock fallback (used when no env / no API components / query errors) ----------

function wave(n: number, base: number, amp: number, phase: number, jitter: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const v = base + amp * Math.sin((i / n) * Math.PI * 2 * 1.8 + phase) + amp * 0.4 * Math.sin((i / n) * Math.PI * 6 + phase);
    out.push(Math.max(0, Math.round(v + Math.sin(i * 7.3 + phase) * jitter)));
  }
  return out;
}

function seedFrom(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
  return h / 1000;
}

const MOCK_BUCKETS: Record<InsightsRange, { count: number; label: (i: number) => string }> = {
  '24h': { count: 24, label: (i) => `${String(i).padStart(2, '0')}:00` },
  '7d': { count: 7, label: (i) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7] },
  '30d': { count: 30, label: (i) => `${i + 1}` },
  '3mo': { count: 13, label: (i) => `W${i + 1}` },
};

export function useMockProjectInsights(projectId: string, range: InsightsRange, envId: string): ProjectInsightsData {
  return useMemo(() => {
    const { count, label } = MOCK_BUCKETS[range];
    const phase = seedFrom(projectId + envId) * Math.PI * 2;
    const scale = /sandbox|dev/i.test(envId) ? 0.35 : 1;
    const api = wave(count, 4200 * scale, 1400 * scale, phase + 0.4, 180);
    const errs = wave(count, 190 * scale, 120 * scale, phase + 1.1, 30);
    const autos = wave(count, 340 * scale, 160 * scale, phase + 2.2, 40);
    const autoErrs = wave(count, 30 * scale, 20 * scale, phase + 2.9, 8);

    const raw: ProjectInsightsRaw = {
      totalRequests: api.reduce((a, b) => a + b, 0),
      totalErrors: errs.reduce((a, b) => a + b, 0),
      avgLatency: 238,
      trend: api.map((_, i) => ({ label: label(i), apiRequests: api[i], automationRuns: autos[i], automationErrors: autoErrs[i], errors: errs[i] })),
      components: [
        { id: 'order-events-api', name: 'order-events-api', handler: 'order-events-api', type: 'api', requestCount: 482_000, errorCount: 5300, errorRate: 1, latency: 186 },
        { id: 'payment-gateway', name: 'payment-gateway', handler: 'payment-gateway', type: 'api', requestCount: 318_000, errorCount: 12_000, errorRate: 4, latency: 402 },
        { id: 'catalog-api', name: 'catalog-api', handler: 'catalog-api', type: 'api', requestCount: 256_000, errorCount: 1300, errorRate: 1, latency: 92 },
        { id: 'shipping-webhook', name: 'shipping-webhook', handler: 'shipping-webhook', type: 'api', requestCount: 148_000, errorCount: 3300, errorRate: 2, latency: 214 },
        { id: 'invoice-sync', name: 'invoice-sync', handler: 'invoice-sync', type: 'auto', requestCount: null, errorCount: null, errorRate: null, latency: null },
        { id: 'inventory-sync', name: 'inventory-sync', handler: 'inventory-sync', type: 'auto', requestCount: null, errorCount: null, errorRate: null, latency: null },
      ],
      taskStats: null,
    };
    return toProjectInsightsData(raw);
  }, [projectId, range, envId]);
}
