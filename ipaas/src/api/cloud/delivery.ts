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
 * BFF closes that gap, every function throws via ni() (per the
 * src/api/AGENTS.md stub contract) so an unsupported metric read or config
 * write can never be mistaken for a successful one.
 *
 * awaits: cio-query-api (DORA metrics) / cio-incident-configurator (config)
 */

// TODO: implement using cloud APIs
const ni = (name: string): never => {
  throw new Error(`[cloud] delivery.${name}: not implemented`);
};

// DORA metrics (cio-query-api)
export const fetchDeploymentFrequencySummary = (..._args: unknown[]): never => ni('fetchDeploymentFrequencySummary');
export const fetchChangeLeadTimeSummary = (..._args: unknown[]): never => ni('fetchChangeLeadTimeSummary');
export const fetchFailureRateSummary = (..._args: unknown[]): never => ni('fetchFailureRateSummary');
export const fetchRecoveryTimeSummary = (..._args: unknown[]): never => ni('fetchRecoveryTimeSummary');
export const fetchDeployments = (..._args: unknown[]): never => ni('fetchDeployments');
export const fetchChangeLeadTimes = (..._args: unknown[]): never => ni('fetchChangeLeadTimes');
export const fetchFailureRates = (..._args: unknown[]): never => ni('fetchFailureRates');
export const fetchRecoveryTimes = (..._args: unknown[]): never => ni('fetchRecoveryTimes');
export const fetchTopPerformingProjects = (..._args: unknown[]): never => ni('fetchTopPerformingProjects');
export const fetchDeliveryInsights = (..._args: unknown[]): never => ni('fetchDeliveryInsights');

// Incident-source configuration (cio-incident-configurator)
export const fetchDeliveryConfigurations = (..._args: unknown[]): never => ni('fetchDeliveryConfigurations');
export const fetchDeliveryDataPlanes = (..._args: unknown[]): never => ni('fetchDeliveryDataPlanes');
export const addDeliveryConfiguration = (..._args: unknown[]): never => ni('addDeliveryConfiguration');
export const updateDeliverySelectorCriteria = (..._args: unknown[]): never => ni('updateDeliverySelectorCriteria');
export const updateDeliveryRejectorCriteria = (..._args: unknown[]): never => ni('updateDeliveryRejectorCriteria');
