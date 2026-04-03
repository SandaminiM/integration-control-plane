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

import { authenticatedFetch } from '../auth/tokenManager';
import type { AlertComponentType } from '../constants/alerts';
import type { AlertHistoryResponse, AlertRule, AlertRuleCountUsage } from '../types/alerts';

function buildQueryString(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

export async function getAlertRulesCount(
  baseUrl: string,
  componentId: string,
  environmentId: string,
  componentType: AlertComponentType
): Promise<AlertRuleCountUsage> {
  const qs = buildQueryString({ componentId, environmentId, componentType });
  const res = await authenticatedFetch(
    `${baseUrl}/component/alerts/rules/count?${qs}`
  );
  if (!res.ok) throw new Error(`Failed to fetch alert rules count: ${res.status}`);
  return res.json() as Promise<AlertRuleCountUsage>;
}

export async function getAlertRules(
  baseUrl: string,
  componentId: string,
  environmentId: string,
  componentType: AlertComponentType
): Promise<AlertRule[]> {
  const qs = buildQueryString({ componentId, environmentId, componentType });
  const res = await authenticatedFetch(
    `${baseUrl}/component/alerts/rules?${qs}`
  );
  if (!res.ok) throw new Error(`Failed to fetch alert rules: ${res.status}`);
  return res.json() as Promise<AlertRule[]>;
}

export async function createAlertRule(baseUrl: string, alertRule: AlertRule): Promise<Response> {
  const res = await authenticatedFetch(`${baseUrl}/component/alerts/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alertRule),
  });
  if (!res.ok) throw new Error(`Failed to create alert rule: ${res.status}`);
  return res;
}

export async function updateAlertRule(baseUrl: string, alertRule: AlertRule): Promise<Response> {
  const res = await authenticatedFetch(
    `${baseUrl}/component/alerts/rules/${alertRule.id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertRule),
    }
  );
  if (!res.ok) throw new Error(`Failed to update alert rule: ${res.status}`);
  return res;
}

export async function deleteAlertRule(baseUrl: string, alertRule: AlertRule): Promise<Response> {
  const res = await authenticatedFetch(
    `${baseUrl}/component/alerts/rules/${alertRule.id}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        componentId: alertRule.componentId,
        versionId: alertRule.versionId,
        environmentId: alertRule.environmentId,
      }),
    }
  );
  if (!res.ok) throw new Error(`Failed to delete alert rule: ${res.status}`);
  return res;
}

export async function getAlertHistory(
  baseUrl: string,
  componentId: string,
  environmentId: string,
  startTime: string,
  endTime: string,
  limit = 100,
  versionIdList: string[] = [],
  alertTypes: string[] = [],
  searchPhrase = ''
): Promise<AlertHistoryResponse> {
  const res = await authenticatedFetch(`${baseUrl}/component/alerts/history/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      componentId,
      environmentId,
      versionIdList,
      alertTypes,
      searchPhrase,
      startTime,
      endTime,
      limit,
      sort: 'desc',
    }),
  });
  if (!res.ok) throw new Error(`Failed to fetch alert history: ${res.status}`);
  return res.json() as Promise<AlertHistoryResponse>;
}
