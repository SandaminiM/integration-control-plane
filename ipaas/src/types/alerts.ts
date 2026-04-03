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
import type { AlertComponentType, AlertTypeConstants, AlertTypes } from '../constants/alerts';

export interface AlertTypeOption {
  label: AlertTypes;
  value: AlertTypeConstants;
}


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
