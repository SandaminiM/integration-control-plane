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

// Pod helpers shared by the Runtime and Scaling surfaces. `ClusterPod` here is the
// minimal pod shape both surfaces satisfy.
import type { PaletteColor } from '../config/statusColors';
import type { ClusterPod } from '../types/scaling';

/** `PodInitializing` → `Pod Initializing`. */
export function humanizePodStatus(status: string): string {
  return status.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

/** Kubernetes pod phase → display status. Mirrors Devant's `getPodStatus`. */
export function getPodStatus(pod: ClusterPod): { status: string; isRunning: boolean } {
  if (pod.metadata.deletionTimestamp) return { status: 'Terminating', isRunning: false };
  const containers = pod.status?.containerStatuses ?? [];
  const waiting = containers.find((c) => c.state?.waiting?.reason)?.state?.waiting?.reason;
  if (waiting) return { status: humanizePodStatus(waiting), isRunning: false };
  if (containers.some((c) => c.state?.terminated)) return { status: 'Terminated', isRunning: false };
  const phase = pod.status?.phase ?? 'Unknown';
  return { status: phase, isRunning: phase === 'Running' };
}

/** `{running}/{total}` where a running pod is Running or Succeeded. Mirrors Devant's running count. */
export function runningPodCount(pods: ClusterPod[]): { running: number; total: number } {
  const running = pods.filter((p) => p.status?.phase === 'Running' || p.status?.phase === 'Succeeded').length;
  return { running, total: pods.length };
}

/**
 * Chip palette for a pod status. Transitional states (Pod Initializing, Pending, …) keep
 * the body text colour — `secondary` washes the label out in light mode — so only the
 * states worth spotting across the table are coloured.
 */
export function podStatusPalette(status: string, isRunning: boolean): { chip: PaletteColor; text: string } {
  if (isRunning) return { chip: 'success', text: 'success.main' };
  if (status === 'Terminating') return { chip: 'warning', text: 'warning.main' };
  return { chip: 'secondary', text: 'text.primary' };
}
