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
 * Pure transforms backing the create-database wizard: derive which cloud providers
 * and regions are offered from the service-plan list, and filter plans by the
 * selected provider+region. No React, no I/O. Mirrors Devant's convertPlatformSvcPlans.
 */

import { CLOUD_PROVIDERS, CLOUD_REGIONS } from '../constants/platformServices';
import type { CloudProvider, CloudRegion, MetricSeries, ServicePlan, ServicePlanRegion } from '../types/platformServices';

/** Providers offered across all plans, in the canonical display order. */
export function deriveProviders(plans: ServicePlan[]): CloudProvider[] {
  const offered = new Set<CloudProvider>();
  plans.forEach((plan) => plan.regions?.forEach((r) => offered.add(r.cloud_provider)));
  return CLOUD_PROVIDERS.filter((p) => offered.has(p.id)).map((p) => p.id);
}

/** Regions offered across all plans, in the canonical display order. */
export function deriveRegions(plans: ServicePlan[]): CloudRegion[] {
  const offered = new Set<CloudRegion>();
  plans.forEach((plan) => plan.regions?.forEach((r) => offered.add(r.cloud_region)));
  return CLOUD_REGIONS.filter((r) => offered.has(r.id)).map((r) => r.id);
}

/** Does the plan offer this exact provider+region combination? */
export function isPlanAvailableInRegion(plan: ServicePlan, provider: CloudProvider, region: CloudRegion): boolean {
  return !!plan.regions?.some((r) => r.cloud_provider === provider && r.cloud_region === region);
}

/** Plans available for the selected provider+region. */
export function plansForProviderRegion(plans: ServicePlan[], provider: CloudProvider, region: CloudRegion): ServicePlan[] {
  return plans.filter((plan) => isPlanAvailableInRegion(plan, provider, region));
}

/** The provider+region-specific spec/pricing row for a plan, if the combination exists. */
export function planRegionSpec(plan: ServicePlan, provider: CloudProvider, region: CloudRegion): ServicePlanRegion | undefined {
  return plan.regions?.find((r) => r.cloud_provider === provider && r.cloud_region === region);
}

/** Human title for a metric key returned by the metrics endpoint (fallback: prettified key). */
export const METRIC_TITLES: Record<string, string> = {
  cpu_usage: 'CPU Usage (%)',
  mem_usage: 'Memory Usage (%)',
  mem_available: 'Memory Available (%)',
  disk_usage: 'Disk Usage (%)',
  load_average: 'Load Average',
  diskio_read: 'Disk Read (bytes/s)',
  diskio_writes: 'Disk Write (bytes/s)',
  net_receive: 'Network Received (bytes/s)',
  net_send: 'Network Sent (bytes/s)',
};

export function metricTitle(key: string): string {
  return METRIC_TITLES[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface MetricChart {
  /** One row per time point: `{ time, [seriesName]: value }` — the recharts data shape. */
  data: Record<string, string | number | null>[];
  /** One line per node column (cols after the leading time column). */
  lines: { dataKey: string; name: string }[];
}

/**
 * Convert a metric's Google-Charts-style `{cols, rows}` datatable into the recharts
 * `LineChart` shape: `data` rows keyed by series name + a `time` label, and one line
 * per node column. The first column is always the time axis.
 */
export function metricsToChart(series: MetricSeries): MetricChart {
  const cols = series?.data?.cols ?? [];
  const rows = series?.data?.rows ?? [];
  const seriesCols = cols.slice(1); // drop the leading time column
  const lines = seriesCols.map((c) => ({ dataKey: c.label, name: c.label }));
  const data = rows.map((r) => {
    const point: Record<string, string | number | null> = { time: formatMetricTime(r.date) };
    seriesCols.forEach((c, i) => {
      point[c.label] = r.values[i] ?? null;
    });
    return point;
  });
  return { data, lines };
}

/** Short axis label for a metric timestamp (HH:MM). */
export function formatMetricTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
