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

// Component scaling, backed by the DevOps API (shared with Devant). Config lives across three
// sub-resources of a component release; the active method is a boolean toggle (scale-to-zero vs HPA).

export const ScalingMethod = {
  HPA: 'HPA',
  ScaleToZero: 'ScaleToZero',
  None: 'None',
  Undefined: 'Undefined',
} as const;
export type ScalingMethod = (typeof ScalingMethod)[keyof typeof ScalingMethod];

/** Effective scaling state read from the component release. */
export interface ScalingState {
  method: ScalingMethod;
  scaleToZeroEnabled: boolean;
  replicas: number;
  version: string;
}

export interface HttpScaler {
  min?: number;
  max: number;
  target_pending_requests: number;
}

export interface HttpScalerWriteData {
  max: number;
  target_pending_requests: number;
}

export type MetricResource = 'cpu' | 'memory';

export interface HpaMetric {
  ID?: string;
  type: 'Resource';
  rule: { resource: { name: MetricResource; value: string; type?: 'utilization' | 'value' } };
}

export interface Hpa {
  ID: string;
  min: number;
  max: number;
  version?: string;
  app_environment_id?: string;
  metrics?: HpaMetric[];
}

export interface HpaWriteData {
  organization_id: string;
  project_id: string;
  version: string;
  app_environment_id: string;
  min: number;
  max: number;
}

export interface ScalingMethodToggle {
  scale_to_zero_enabled: boolean;
}

/** Release path segments shared by the scaling sub-resource endpoints. */
export interface ScalingPath {
  componentId: string;
  releaseId: string;
}

/* ── pods / replicas (phase 4) ─────────────────────────────────────────────── */

/** Cluster-query envelope: `{ payload: [...raw k8s objects] }`. */
export interface ClusterQueryResponse<T> {
  payload: T[];
  status?: string;
}

// Pods and their metrics come from the same data-plane query proxy the Runtime surface
// uses, so both surfaces share one shape.
export type { ClusterPod, PodMetrics } from './runtime';

/** A row in the replicas table (derived from a pod + optional metrics). */
export interface PodRow {
  name: string;
  status: string;
  isRunning: boolean;
  readyContainers: number;
  totalContainers: number;
  restarts: number;
  lastActivity?: string;
  cpu?: string;
  memory?: string;
}
