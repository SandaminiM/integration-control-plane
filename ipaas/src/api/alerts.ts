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

// baseUrl is passed by callers that derive it from choreoAlertingApiUrl(gatewayHost). A static named client
// is deferred until the component-level refactor removes alertingBaseUrl prop-drilling (see memory).
import { createHttpClient } from './http';
import type { AlertComponentType } from '../constants/alerts';
import type { AlertHistoryResponse, AlertRule, AlertRuleCountUsage } from '../types/alerts';

function buildQueryString(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

export async function getAlertRulesCount(baseUrl: string, componentId: string, environmentId: string, componentType: AlertComponentType): Promise<AlertRuleCountUsage> {
  const qs = buildQueryString({ componentId, environmentId, componentType });
  return createHttpClient(() => baseUrl).get<AlertRuleCountUsage>(`/component/alerts/rules/count?${qs}`);
}

export async function getAlertRules(baseUrl: string, componentId: string, environmentId: string, componentType: AlertComponentType): Promise<AlertRule[]> {
  const qs = buildQueryString({ componentId, environmentId, componentType });
  return createHttpClient(() => baseUrl).get<AlertRule[]>(`/component/alerts/rules?${qs}`);
}

export async function createAlertRule(baseUrl: string, alertRule: AlertRule): Promise<void> {
  await createHttpClient(() => baseUrl).post(`/component/alerts/rules`, alertRule);
}

export async function updateAlertRule(baseUrl: string, alertRule: AlertRule): Promise<void> {
  await createHttpClient(() => baseUrl).put(`/component/alerts/rules/${alertRule.id}`, alertRule);
}

export async function deleteAlertRule(baseUrl: string, alertRule: AlertRule): Promise<void> {
  await createHttpClient(() => baseUrl).delete(`/component/alerts/rules/${alertRule.id}`, {
    componentId: alertRule.componentId,
    versionId: alertRule.versionId,
    environmentId: alertRule.environmentId,
  });
}

export async function getAlertHistory(baseUrl: string, componentId: string, environmentId: string, startTime: string, endTime: string, limit = 100, versionIdList: string[] = [], alertTypes: string[] = [], searchPhrase = ''): Promise<AlertHistoryResponse> {
  return createHttpClient(() => baseUrl).post<AlertHistoryResponse>(`/component/alerts/history/search`, {
    componentId,
    environmentId,
    versionIdList,
    alertTypes,
    searchPhrase,
    startTime,
    endTime,
    limit,
    sort: 'desc',
  });
}
