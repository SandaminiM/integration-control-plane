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

import { choreoClient } from './httpClients';
import { HttpError } from '../../types/http';
import type {
  DeliveryConfigurations,
  DeliveryDataPlane,
  DeliveryGranularity,
  DeliveryInsightsRaw,
  DeploymentFrequencySummaryData,
  ChangeLeadTimeSummaryData,
  FailureRateSummaryData,
  RecoveryTimeSummaryData,
  DeploymentPoint,
  LeadTimePoint,
  FailureRatePoint,
  RecoveryTimePoint,
  ProjectPerformance,
} from '../../types/delivery';

// Devant's CIO dashboard services (see devant-delivery-01.har). Both live on
// the shared platform gateway; the query API scopes to the org via the bearer
// token — no orgId argument exists on those queries.
const QUERY_PATH = '/cio-query-api/1.0.0/query';
const CONFIGURATOR_BASE = '/cio-incident-configurator/1.0.0';

// The backend expects arguments inlined into the query string (Devant builds
// them the same way — see choreo-console's data/api/cio-dashboard.ts).
async function cioQuery<T>(query: string): Promise<T | null> {
  try {
    const res = await choreoClient.post<{ data?: T }>(QUERY_PATH, { query });
    return res?.data ?? null;
  } catch {
    return null;
  }
}

const projectArg = (projectId?: string) => (projectId ? `, projectId: "${projectId}"` : '');

export async function fetchDeploymentFrequencySummary(from: string, to: string, granularity: DeliveryGranularity, projectId?: string): Promise<DeploymentFrequencySummaryData | null> {
  const res = await cioQuery<{ deploymentFrequency: DeploymentFrequencySummaryData }>(
    `query { deploymentFrequency(startTime: "${from}", endTime: "${to}", granularity: ${granularity}, isProd: true${projectArg(projectId)}) { totalDeployments, dataPoints, relativeChangeInDeployment, perfLevel } }`,
  );
  return res?.deploymentFrequency ?? null;
}

export async function fetchChangeLeadTimeSummary(from: string, to: string, projectId?: string): Promise<ChangeLeadTimeSummaryData | null> {
  const res = await cioQuery<{ changeLeadTimeSummary: ChangeLeadTimeSummaryData }>(`query { changeLeadTimeSummary(startTime: "${from}", endTime: "${to}"${projectArg(projectId)}) { avgLeadTime, perfLevel } }`);
  return res?.changeLeadTimeSummary ?? null;
}

export async function fetchFailureRateSummary(from: string, to: string, projectId?: string): Promise<FailureRateSummaryData | null> {
  const res = await cioQuery<{ changeFailureRateSummary: FailureRateSummaryData }>(`query { changeFailureRateSummary(startTime: "${from}", endTime: "${to}"${projectArg(projectId)}) { failureRate, perfLevel } }`);
  return res?.changeFailureRateSummary ?? null;
}

export async function fetchRecoveryTimeSummary(from: string, to: string, projectId?: string): Promise<RecoveryTimeSummaryData | null> {
  const res = await cioQuery<{ meanTimeToRecoverySummary: RecoveryTimeSummaryData }>(`query { meanTimeToRecoverySummary(startTime: "${from}", endTime: "${to}"${projectArg(projectId)}) { avgRecoveryTime, perfLevel } }`);
  return res?.meanTimeToRecoverySummary ?? null;
}

export async function fetchDeployments(from: string, to: string, granularity: DeliveryGranularity, projectId?: string): Promise<DeploymentPoint[]> {
  const res = await cioQuery<{ deployments: DeploymentPoint[] }>(`query { deployments(startTime: "${from}", endTime: "${to}", granularity: ${granularity}, isProd: true${projectArg(projectId)}) { timestamp count } }`);
  return res?.deployments ?? [];
}

export async function fetchChangeLeadTimes(from: string, to: string, granularity: DeliveryGranularity, projectId?: string): Promise<LeadTimePoint[]> {
  const res = await cioQuery<{ changeLeadTimes: LeadTimePoint[] }>(`query { changeLeadTimes(startTime: "${from}", endTime: "${to}", granularity: ${granularity}${projectArg(projectId)}) { timestamp leadTime } }`);
  return res?.changeLeadTimes ?? [];
}

export async function fetchFailureRates(from: string, to: string, granularity: DeliveryGranularity, projectId?: string): Promise<FailureRatePoint[]> {
  const res = await cioQuery<{ changeFailureRate: FailureRatePoint[] }>(`query { changeFailureRate(startTime: "${from}", endTime: "${to}", granularity: ${granularity}${projectArg(projectId)}) { failureRate, timestamp } }`);
  return res?.changeFailureRate ?? [];
}

export async function fetchRecoveryTimes(from: string, to: string, granularity: DeliveryGranularity, projectId?: string): Promise<RecoveryTimePoint[]> {
  const res = await cioQuery<{ meanTimesToRecovery: RecoveryTimePoint[] }>(`query { meanTimesToRecovery(startTime: "${from}", endTime: "${to}", granularity: ${granularity}${projectArg(projectId)}) { recoveryTime, timestamp } }`);
  return res?.meanTimesToRecovery ?? [];
}

export async function fetchTopPerformingProjects(from: string, to: string): Promise<ProjectPerformance[]> {
  const res = await cioQuery<{ topPerformingProjects: ProjectPerformance[] }>(`query { topPerformingProjects(startTime: "${from}", endTime: "${to}") { projectId, deployments, leadTime, recoveryTime, failureRate, score } }`);
  return res?.topPerformingProjects ?? [];
}

/** Everything the Delivery page needs, fetched in parallel. CFR/MTTR queries
 * only run when the incident source is `configured` — Devant gates the same way. */
export async function fetchDeliveryInsights(from: string, to: string, granularity: DeliveryGranularity, configured: boolean, projectId?: string): Promise<DeliveryInsightsRaw> {
  const [deploymentFrequency, leadTimeSummary, deployments, leadTimes, failureRateSummary, recoveryTimeSummary, failureRates, recoveryTimes, topProjects] = await Promise.all([
    fetchDeploymentFrequencySummary(from, to, granularity, projectId),
    fetchChangeLeadTimeSummary(from, to, projectId),
    fetchDeployments(from, to, granularity, projectId),
    fetchChangeLeadTimes(from, to, granularity, projectId),
    configured ? fetchFailureRateSummary(from, to, projectId) : Promise.resolve(null),
    configured ? fetchRecoveryTimeSummary(from, to, projectId) : Promise.resolve(null),
    configured ? fetchFailureRates(from, to, granularity, projectId) : Promise.resolve([]),
    configured ? fetchRecoveryTimes(from, to, granularity, projectId) : Promise.resolve([]),
    projectId ? Promise.resolve([]) : fetchTopPerformingProjects(from, to),
  ]);
  return { deploymentFrequency, leadTimeSummary, failureRateSummary, recoveryTimeSummary, deployments, leadTimes, failureRates, recoveryTimes, topProjects };
}

// ---------- Incident-source configuration ----------

/** null = not configured yet (backend answers 404 code 1003). */
export async function fetchDeliveryConfigurations(orgUuid: string): Promise<DeliveryConfigurations | null> {
  try {
    return await choreoClient.get<DeliveryConfigurations>(`${CONFIGURATOR_BASE}/configurations/github?orgId=${orgUuid}&perspective=console`);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return null;
    throw err;
  }
}

export async function fetchDeliveryDataPlanes(orgUuid: string): Promise<DeliveryDataPlane[]> {
  return (await choreoClient.get<DeliveryDataPlane[]>(`${CONFIGURATOR_BASE}/dataplanes/${orgUuid}`)) ?? [];
}

export async function addDeliveryConfiguration(orgUuid: string, dataPlaneId: string, selectorCriteria: string, rejectorCriteria: string): Promise<void> {
  await choreoClient.post(`${CONFIGURATOR_BASE}/configurations/github`, {
    organizationId: orgUuid,
    repositories: [{ orgName: 'all', repoName: 'all' }],
    environmentId: dataPlaneId,
    selectorCriteria,
    rejectorCriteria,
  });
}

export async function updateDeliverySelectorCriteria(orgUuid: string, selectorCriteria: string): Promise<void> {
  await choreoClient.put(`${CONFIGURATOR_BASE}/configurations/${orgUuid}/selectorCriteria`, { selectorCriteria });
}

export async function updateDeliveryRejectorCriteria(orgUuid: string, rejectorCriteria: string): Promise<void> {
  await choreoClient.put(`${CONFIGURATOR_BASE}/configurations/${orgUuid}/rejectorCriteria`, { rejectorCriteria });
}
