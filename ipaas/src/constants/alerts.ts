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

export const ALERTS_CREATE_NEW_RULE_BUTTON_TEXT = 'Create Alert Rule';

export const ALERTS_CREATE_NEW_RULE_TITLE = 'Create New {alertType} Alert Rule';
export const ALERTS_EDIT_RULE_TITLE = 'Edit {alertType} Alert Rule';
export const ALERTS_CREATE_NEW_RULE_BACK_BUTTON_TEXT = 'Back to Alert Rules';
export const ALERT_CREATE_NEW_RULE_ADVANCED_TITLE = 'Advanced Configurations';

export const AlertRulePeriod = {
  FIVE_MINUTES: '5 minutes',
  TEN_MINUTES: '10 minutes',
  FIFTEEN_MINUTES: '15 minutes',
  THIRTY_MINUTES: '30 minutes',
  ONE_HOUR: '60 minutes',
} as const;
export type AlertRulePeriod = (typeof AlertRulePeriod)[keyof typeof AlertRulePeriod];

export const AlertRulePeriodConstants = {
  FIVE_MINUTES: 5,
  TEN_MINUTES: 10,
  FIFTEEN_MINUTES: 15,
  THIRTY_MINUTES: 30,
  ONE_HOUR: 60,
} as const;
export type AlertRulePeriodConstants = (typeof AlertRulePeriodConstants)[keyof typeof AlertRulePeriodConstants];

export interface AlertRulePeriodOption {
  label: string;
  value: AlertRulePeriodConstants;
}

export const AlertMainTypes = {
  LATENCY: 'LATENCY',
  TRAFFIC: 'TRAFFIC',
  STATUS_CODE: 'STATUS_CODE',
  RESOURCES: 'RESOURCES',
  LOGS: 'LOGS',
  BUILD: 'BUILD',
} as const;
export type AlertMainTypes = (typeof AlertMainTypes)[keyof typeof AlertMainTypes];

export const MAX_EMAIL_COUNT = 5;

export const TOOLTIP_PERIOD = 'The duration which the metric value must remain above the threshold';
export const TOOLTIP_THRESHOLD = 'The value which the metric must remain above during the period';
export const TOOLTIP_INTERVAL = 'Frequency at which the occurrences of the metric must exceed the count.';
export const TOOLTIP_COUNT = 'The number of occurrences of the metric value must exceed during the interval';

export const NOTIFICATION_BUILD_ALERT_EXIST = 'Select a different deployment track to create a new build failure alert or ' + 'edit the existing build failure alert using alert rules list.';

export const NOTIFICATION_BUILD_ALERT_EXIST_TITLE = 'Build failure alert already exists for this deployment track.';

export const ALERT_RULE_THRESHOLD_MIN = 1;
export const ALERT_RULE_THRESHOLD_MAX = 1000000;
export const ALERT_RULE_LOG_SEARCH_PHRASE_MAX_LENGTH = 200;
