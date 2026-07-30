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

import { SUBSCRIPTION_KEY_HEADER, TOKEN_PLACEHOLDER } from '../constants/apiConsumption';
import type { Consumer } from '../types/consumers';
import { formatDate } from './time';

/** Consumer applications carry an optional display name; fall back to the handle. */
export function consumerDisplayName(consumer: Consumer): string {
  return consumer.application.displayName || consumer.application.id;
}

/** Row subtitle for a consumer: credential kind, subscription status, subscribed date. */
export function consumerSummary(consumer: Consumer): string {
  const { status, createdAt } = consumer.subscription;
  const created = formatDate(createdAt);
  return [SUBSCRIPTION_KEY_HEADER, status, created && `subscribed ${created}`].filter(Boolean).join(' · ');
}

/** Test-call snippet for an exposed API, authenticated with a subscription token. */
export function subscriptionCurl(url: string, token: string): string {
  return `curl '${url}' \\\n  -H '${SUBSCRIPTION_KEY_HEADER}: ${token || TOKEN_PLACEHOLDER}'`;
}
