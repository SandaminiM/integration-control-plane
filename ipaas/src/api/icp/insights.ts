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

// TODO: implement using icp APIs
const ni = (name: string): never => {
  throw new Error(`[icp] insights.${name}: not implemented`);
};

export const fetchInsightsEnvironments = (..._args: unknown[]): never => ni('fetchInsightsEnvironments');
export const fetchComponentInsights = (..._args: unknown[]): never => ni('fetchComponentInsights');
export const fetchProjectInsights = (..._args: unknown[]): never => ni('fetchProjectInsights');
export const fetchApiUsageOverTime = (..._args: unknown[]): never => ni('fetchApiUsageOverTime');
export const fetchApiUsageByApp = (..._args: unknown[]): never => ni('fetchApiUsageByApp');
export const fetchUsageByBackend = (..._args: unknown[]): never => ni('fetchUsageByBackend');
export const fetchResourceUsage = (..._args: unknown[]): never => ni('fetchResourceUsage');
export const fetchLatencyByCategory = (..._args: unknown[]): never => ni('fetchLatencyByCategory');
export const fetchTopSlowestApis = (..._args: unknown[]): never => ni('fetchTopSlowestApis');
export const fetchErrorsByCategory = (..._args: unknown[]): never => ni('fetchErrorsByCategory');
export const fetchErrorsByStatusCode = (..._args: unknown[]): never => ni('fetchErrorsByStatusCode');
export const fetchErrorsDetails = (..._args: unknown[]): never => ni('fetchErrorsDetails');
export const apiRangeToTimeFilter = (..._args: unknown[]): never => ni('apiRangeToTimeFilter');
export const fetchApiInsights = (..._args: unknown[]): never => ni('fetchApiInsights');
export const fetchAutomationInsights = (..._args: unknown[]): never => ni('fetchAutomationInsights');
