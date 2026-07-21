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

// ---------- Metrics (observability) ----------
// Backed by the org systemapis gateway's `choreoobsapi/0.3.0` service — the
// same one Devant's Metrics pages call (devant-matrics-01.har):
// component-level request/latency histograms + cpu/memory/network/disk usage
// (scoped by releaseId) and the project-level HTTP dependency graph
// (nodeList/linkList) that feeds the cell diagram's observability layer.

export type MetricsRange = '10m' | '30m' | '1h' | '24h' | '7d' | '30d';

export const METRICS_RANGES: { value: MetricsRange; label: string; minutes: number }[] = [
  { value: '10m', label: 'Past 10 minutes', minutes: 10 },
  { value: '30m', label: 'Past 30 minutes', minutes: 30 },
  { value: '1h', label: 'Past 1 hour', minutes: 60 },
  { value: '24h', label: 'Past 24 hours', minutes: 1440 },
  { value: '7d', label: 'Past 7 days', minutes: 10080 },
  { value: '30d', label: 'Past 30 days', minutes: 43200 },
];

/** Auto-refresh choices for the metrics header (seconds; 0 = off). */
export const METRICS_REFRESH_INTERVALS: { value: number; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 300, label: '5m' },
];

export interface MetricsTimePoint {
  time: string;
  value: number;
}

export interface MetricsPercentilePoint {
  time: string;
  values: number[];
}

/** GET /metrics/component/http/ response. */
export interface ComponentHttpMetricsPayload {
  data?: {
    totalRequestCountHistogram: MetricsTimePoint[];
    successfulRequestCountHistogram: MetricsTimePoint[];
    failedRequestCountHistogram: MetricsTimePoint[];
    latencyMeanHistogram: MetricsTimePoint[];
    /** e.g. ['50', '90', '99'] — indexes into latencyPercentilesHistogram values */
    latencyPercentiles: string[];
    latencyPercentilesHistogram: MetricsPercentilePoint[];
  };
}

/** GET /metrics/component/usage response. */
export interface ComponentUsageMetricsPayload {
  cpuUsage: MetricsTimePoint[];
  cpuRequests: MetricsTimePoint[];
  cpuLimits: MetricsTimePoint[];
  memory: MetricsTimePoint[];
  memoryRequests: MetricsTimePoint[];
  memoryLimits: MetricsTimePoint[];
  bytesReceived: MetricsTimePoint[];
  bytesSent: MetricsTimePoint[];
  diskIOWrites: MetricsTimePoint[];
  diskIOReads: MetricsTimePoint[];
}

/** One chart row — `label` on the x-axis, the remaining numeric keys are series. */
export interface MetricsDatum {
  label: string;
  [series: string]: string | number | undefined;
}

export interface ComponentHttpMetricsRows {
  /** total / success / failed request counts per bucket */
  requestRows: MetricsDatum[];
  /** mean / p50 / p90 / p99 latency per bucket */
  latencyRows: MetricsDatum[];
}

export interface ComponentUsageMetricsRows {
  memoryRows: MetricsDatum[];
  cpuRows: MetricsDatum[];
  receivedRows: MetricsDatum[];
  sentRows: MetricsDatum[];
  diskReadRows: MetricsDatum[];
  diskWriteRows: MetricsDatum[];
}

// ---------- Project-level HTTP dependency graph ----------
// Node/link shapes mirror Devant's ProjectLevelDiagram model. Gateway nodes
// carry no componentId; component nodes do.

export interface ProjectMetricsNode {
  nodeId: number;
  nodeType: string;
  componentId?: string;
  componentName?: string;
  apiVersion?: string;
  projectId?: string;
  ip?: string;
}

export interface ProjectMetricsLink {
  sourceNodeId: number;
  destinationNodeId: number;
  requestCount: number;
  errorCount: number;
  avgLatency: number;
  p99Latency: number;
  p90Latency: number;
  p50Latency: number;
}

export interface ProjectMetricsModel {
  nodeList?: ProjectMetricsNode[];
  linkList?: ProjectMetricsLink[];
}
