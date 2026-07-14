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

// ---------- Delivery (DORA) insights ----------
// Backed by Devant's CIO dashboard services (devant-delivery-01.har):
// GraphQL metrics via `cio-query-api/1.0.0/query` (org derived from the
// bearer token, optional projectId narrows to one project) and the
// `cio-incident-configurator/1.0.0` REST API for the Change Failure Rate /
// Mean Time to Recovery incident-source configuration.

export type PerfLevel = 'Elite' | 'High' | 'Medium' | 'Low';

export type DeliveryGranularity = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type DeliveryRange = '1M' | '3M' | '6M' | '1Y';

/** Allowed granularities per range — first entry is the default (mirrors Devant's TimeSelector). */
export const RANGE_GRANULARITIES: Record<DeliveryRange, DeliveryGranularity[]> = {
  '1M': ['DAILY', 'WEEKLY'],
  '3M': ['WEEKLY', 'MONTHLY'],
  '6M': ['WEEKLY', 'MONTHLY'],
  '1Y': ['MONTHLY'],
};

export const GRANULARITY_LABELS: Record<DeliveryGranularity, string> = {
  DAILY: 'View by Day',
  WEEKLY: 'View by Week',
  MONTHLY: 'View by Month',
};

export interface DeploymentFrequencySummaryData {
  totalDeployments: number;
  dataPoints: number;
  relativeChangeInDeployment: number | null;
  perfLevel?: string;
}

export interface ChangeLeadTimeSummaryData {
  /** minutes */
  avgLeadTime: number;
  perfLevel?: string;
}

export interface FailureRateSummaryData {
  /** fraction 0..1 */
  failureRate: number;
  perfLevel?: string;
}

export interface RecoveryTimeSummaryData {
  /** minutes */
  avgRecoveryTime: number;
  perfLevel?: string;
}

export interface DeploymentPoint {
  timestamp: string;
  count: number;
}

export interface LeadTimePoint {
  timestamp: string;
  /** minutes */
  leadTime: number;
}

export interface FailureRatePoint {
  timestamp: string;
  /** fraction 0..1 */
  failureRate: number;
}

export interface RecoveryTimePoint {
  timestamp: string;
  /** minutes */
  recoveryTime: number;
}

export interface ProjectPerformance {
  projectId: string;
  deployments: number;
  /** minutes; 1e9 = sentinel for "no data" */
  leadTime: number;
  /** minutes; 1e9 = sentinel for "no data" */
  recoveryTime: number;
  /** fraction 0..1 */
  failureRate: number;
  score: number;
}

/** Formatted table row for Top Performing Projects (project details joined client-side). */
export interface ProjectDoraRow {
  id: string;
  name: string;
  handler: string;
  deployments: number;
  failureRate: string;
  recoveryTime: string;
  leadTime: string;
  owner: string;
}

export interface DeliveryInsightsRaw {
  deploymentFrequency: DeploymentFrequencySummaryData | null;
  leadTimeSummary: ChangeLeadTimeSummaryData | null;
  failureRateSummary: FailureRateSummaryData | null;
  recoveryTimeSummary: RecoveryTimeSummaryData | null;
  deployments: DeploymentPoint[];
  leadTimes: LeadTimePoint[];
  failureRates: FailureRatePoint[];
  recoveryTimes: RecoveryTimePoint[];
  /** org level only — empty for project scope */
  topProjects: ProjectPerformance[];
}

// ---------- Incident-source configuration (cio-incident-configurator) ----------

export interface DeliveryDataPlane {
  label: string;
  id: string;
  isShared?: boolean;
}

export interface DeliveryGithubRepository {
  orgName: string;
  repoName: string;
}

export interface DeliveryConfigurations {
  repositories: DeliveryGithubRepository[];
  selectorCriteria: string;
  rejectorCriteria: string;
  environmentId: string;
}
