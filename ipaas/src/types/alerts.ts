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

import type { GqlEnvironment } from '../api/queries';

export const AlertTypes = {
  LATENCY: 'Latency',
  LATENCY_99TH_PERCENTILE: '99th Percentile',
  LATENCY_95TH_PERCENTILE: '95th Percentile',
  LATENCY_90TH_PERCENTILE: '90th Percentile',
  LATENCY_50TH_PERCENTILE: '50th Percentile',
  TRAFFIC: 'Traffic',
  STATUS_CODE: 'Status Code',
  STATUS_CODE_400: '400: Bad Request',
  STATUS_CODE_401: '401: Unauthorized',
  STATUS_CODE_403: '403: Forbidden',
  STATUS_CODE_404: '404: Not Found',
  STATUS_CODE_429: '429: Too Many Requests',
  STATUS_CODE_500: '500: Internal Server Error',
  STATUS_CODE_502: '502: Bad Gateway',
  STATUS_CODE_503: '503: Service Unavailable',
  STATUS_CODE_4XX: 'Any: 4xx',
  STATUS_CODE_5XX: 'Any: 5xx',
  RESOURCES: 'Resources',
  RESOURCES_CPU: 'CPU',
  RESOURCES_MEMORY: 'Memory',
  LOGS: 'Logs',
  BUILD: 'Build Failure',
} as const;
export type AlertTypes = (typeof AlertTypes)[keyof typeof AlertTypes];

export const AlertTypeConstants = {
  LATENCY: 'latency',
  LATENCY_99TH_PERCENTILE: '99th_percentile',
  LATENCY_95TH_PERCENTILE: '95th_percentile',
  LATENCY_90TH_PERCENTILE: '90th_percentile',
  LATENCY_50TH_PERCENTILE: '50th_percentile',
  TRAFFIC: 'traffic',
  STATUS_CODE: 'status_code',
  STATUS_CODE_400: '400_bad_request',
  STATUS_CODE_401: '401_unauthorized',
  STATUS_CODE_403: '403_forbidden',
  STATUS_CODE_404: '404_not_found',
  STATUS_CODE_429: '429_too_many_requests',
  STATUS_CODE_500: '500_internal_server_error',
  STATUS_CODE_502: '502_bad_gateway',
  STATUS_CODE_503: '503_service_unavailable',
  STATUS_CODE_4XX: 'any_4xx',
  STATUS_CODE_5XX: 'any_5xx',
  RESOURCES: 'resources',
  RESOURCES_CPU: 'cpu_usage',
  RESOURCES_MEMORY: 'memory_usage',
  LOGS: 'logs',
  BUILD: 'build',
} as const;
export type AlertTypeConstants = (typeof AlertTypeConstants)[keyof typeof AlertTypeConstants];

export interface AlertTypeOption {
  label: AlertTypes;
  value: AlertTypeConstants;
}

export const AlertComponentType = {
  SERVICE: 'service',
  API_PROXY: 'apiproxy',
} as const;
export type AlertComponentType = (typeof AlertComponentType)[keyof typeof AlertComponentType];

export interface AlertRule {
  projectId: string;
  componentId: string;
  environmentId: string;
  versionId: string;
  componentType: AlertComponentType;
  projectName: string;
  environmentName: string;
  versionName?: string;
  id?: string;
  type: AlertTypeConstants;
  metric?: AlertTypeConstants | null;
  statusCode?: string | null;
  threshold?: number | null;
  period?: number | null;
  interval?: number | null;
  count?: number | null;
  searchPhrase?: string | null;
  logType?: string | null;
  emails: string[];
  enabled: boolean;
  createdTimestamp?: string;
  updatedTimestamp?: string;
}

export interface AlertRuleCountUsage {
  count: number;
  max: number;
  remaining: number;
}

export interface AlertRuleFormProps {
  environment: GqlEnvironment;
  componentId: string;
  projectId: string;
  versionId: string;
  versionName: string;
  isProxy: boolean;
  hasPublicOrOrgVisibility: boolean;
  projectName: string;
  environmentName: string;
  selectedAlertRule?: AlertRule;
  isEditAlertRule: boolean;
  goBackToAlertRules: () => void;
  setSelectedAlertTypeEnvVersion: (alertType: string, environmentId: string) => void;
  setIsAlertRuleHalfConfigured: (isHalfConfigured: boolean) => void;
  buildAlertRules?: AlertRule[];
  alertingBaseUrl: string;
  onNotify?: (message: string, severity: 'success' | 'error') => void;
}

export interface AlertHistoryRecord {
  id: string;
  type: AlertTypeConstants;
  metric?: string;
  environmentId: string;
  environmentName: string;
  componentId: string;
  timestamp: string;
  message: string;
}

export interface AlertHistoryColumn {
  name: string;
  type: string;
}

export interface AlertHistoryResponse {
  columns: AlertHistoryColumn[];
  rows: unknown[][];
}
