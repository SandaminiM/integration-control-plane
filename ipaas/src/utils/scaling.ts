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

import type { ClusterPod, PodMetrics, PodRow } from '../types/scaling';

/** `PodInitializing` → `Pod Initializing`. */
function humanize(status: string): string {
  return status.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

/** Kubernetes pod phase → display status. Mirrors Devant's `getPodStatus`. */
export function getPodStatus(pod: ClusterPod): { status: string; isRunning: boolean } {
  if (pod.metadata.deletionTimestamp) return { status: 'Terminating', isRunning: false };
  const containers = pod.status?.containerStatuses ?? [];
  const waiting = containers.find((c) => c.state?.waiting?.reason)?.state?.waiting?.reason;
  if (waiting) return { status: humanize(waiting), isRunning: false };
  if (containers.some((c) => c.state?.terminated)) return { status: 'Terminated', isRunning: false };
  const phase = pod.status?.phase ?? 'Unknown';
  return { status: phase, isRunning: phase === 'Running' };
}

/** Sum a pod's per-container CPU / memory usage (raw k8s quantity strings, joined for display). */
function podUsage(name: string, metrics: PodMetrics[]): { cpu?: string; memory?: string } {
  const m = metrics.find((x) => x.metadata.name === name);
  if (!m?.containers?.length) return {};
  const cpu = m.containers.map((c) => c.usage?.cpu).filter(Boolean).join(' + ') || undefined;
  const memory = m.containers.map((c) => c.usage?.memory).filter(Boolean).join(' + ') || undefined;
  return { cpu, memory };
}

export function derivePodRows(pods: ClusterPod[], metrics: PodMetrics[]): PodRow[] {
  return pods.map((pod) => {
    const { status, isRunning } = getPodStatus(pod);
    const containerStatuses = pod.status?.containerStatuses ?? [];
    const totalContainers = pod.spec?.containers?.length ?? containerStatuses.length;
    const usage = podUsage(pod.metadata.name, metrics);
    return {
      name: pod.metadata.name,
      status,
      isRunning,
      readyContainers: containerStatuses.filter((c) => c.ready).length,
      totalContainers,
      restarts: containerStatuses.reduce((sum, c) => sum + (c.restartCount ?? 0), 0),
      lastActivity: pod.status?.startTime ?? pod.metadata.creationTimestamp,
      cpu: usage.cpu,
      memory: usage.memory,
    };
  });
}

/** `{healthy}/{total}` where healthy pods are Running or Succeeded. Mirrors Devant's running count. */
export function runningPodCount(pods: ClusterPod[]): { running: number; total: number } {
  const running = pods.filter((p) => p.status?.phase === 'Running' || p.status?.phase === 'Succeeded').length;
  return { running, total: pods.length };
}

export function componentScalingBase(org: string, project: string, component: string): string {
  return `/organizations/${org}/projects/${project}/components/${component}/admin/scaling`;
}
