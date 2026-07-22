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
 * Delivery (DORA) insights + incident-source configuration.
 *
 * The OpenChoreo BFF exposes no delivery/DORA surface — these live on Devant's
 * platform gateway as the CIO query API and incident configurator. Until the
 * BFF closes that gap, every function returns a safe default so the Delivery
 * pages degrade to an empty/unconfigured state rather than erroring.
 *
 * awaits: cio-query-api (DORA metrics) / cio-incident-configurator (config)
 */

import type {
  ChangeLeadTimeSummaryData,
  DeliveryConfigurations,
  DeliveryDataPlane,
  DeliveryGranularity,
  DeliveryInsightsRaw,
  DeploymentFrequencySummaryData,
  DeploymentPoint,
  FailureRatePoint,
  FailureRateSummaryData,
  LeadTimePoint,
  ProjectPerformance,
  RecoveryTimePoint,
  RecoveryTimeSummaryData,
} from '../../types/delivery';

// ---------- DORA metrics (cio-query-api) ----------

export async function fetchDeploymentFrequencySummary(_from: string, _to: string, _granularity: DeliveryGranularity, _projectId?: string): Promise<DeploymentFrequencySummaryData | null> {
  return null;
}

export async function fetchChangeLeadTimeSummary(_from: string, _to: string, _projectId?: string): Promise<ChangeLeadTimeSummaryData | null> {
  return null;
}

export async function fetchFailureRateSummary(_from: string, _to: string, _projectId?: string): Promise<FailureRateSummaryData | null> {
  return null;
}

export async function fetchRecoveryTimeSummary(_from: string, _to: string, _projectId?: string): Promise<RecoveryTimeSummaryData | null> {
  return null;
}

export async function fetchDeployments(_from: string, _to: string, _granularity: DeliveryGranularity, _projectId?: string): Promise<DeploymentPoint[]> {
  return [];
}

export async function fetchChangeLeadTimes(_from: string, _to: string, _granularity: DeliveryGranularity, _projectId?: string): Promise<LeadTimePoint[]> {
  return [];
}

export async function fetchFailureRates(_from: string, _to: string, _granularity: DeliveryGranularity, _projectId?: string): Promise<FailureRatePoint[]> {
  return [];
}

export async function fetchRecoveryTimes(_from: string, _to: string, _granularity: DeliveryGranularity, _projectId?: string): Promise<RecoveryTimePoint[]> {
  return [];
}

export async function fetchTopPerformingProjects(_from: string, _to: string): Promise<ProjectPerformance[]> {
  return [];
}

/** Fully-empty insights: no summaries and no series, matching the shape the
 * Delivery page treats as "no data". */
export async function fetchDeliveryInsights(_from: string, _to: string, _granularity: DeliveryGranularity, _configured: boolean, _projectId?: string): Promise<DeliveryInsightsRaw> {
  return {
    deploymentFrequency: null,
    leadTimeSummary: null,
    failureRateSummary: null,
    recoveryTimeSummary: null,
    deployments: [],
    leadTimes: [],
    failureRates: [],
    recoveryTimes: [],
    topProjects: [],
  };
}

// ---------- Incident-source configuration (cio-incident-configurator) ----------

/** null = not configured, which gates the CFR/MTTR widgets and surfaces the
 * Configure banner. */
export async function fetchDeliveryConfigurations(_orgUuid: string): Promise<DeliveryConfigurations | null> {
  return null;
}

export async function fetchDeliveryDataPlanes(_orgUuid: string): Promise<DeliveryDataPlane[]> {
  return [];
}

export async function addDeliveryConfiguration(_orgUuid: string, _dataPlaneId: string, _selectorCriteria: string, _rejectorCriteria: string): Promise<void> {
  // no-op until the BFF exposes the incident configurator
}

export async function updateDeliverySelectorCriteria(_orgUuid: string, _selectorCriteria: string): Promise<void> {
  // no-op until the BFF exposes the incident configurator
}

export async function updateDeliveryRejectorCriteria(_orgUuid: string, _rejectorCriteria: string): Promise<void> {
  // no-op until the BFF exposes the incident configurator
}
