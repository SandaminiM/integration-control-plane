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

import type { Consumer, ConsumerStatus } from '../types/consumers';
import { formatDateTime } from './time';

/** Raw statuses meaning the credential no longer authenticates. */
const REVOKED_STATUSES = new Set(['revoked', 'inactive', 'expired', 'deleted', 'disabled']);

/** Unknown values read as `active` — a live credential must not look revoked on an unfamiliar label. */
export function normalizeConsumerStatus(raw?: string): ConsumerStatus {
  return raw && REVOKED_STATUSES.has(raw.trim().toLowerCase()) ? 'revoked' : 'active';
}

/** Row subtitle. The application's creation time is the only timestamp the platform reports. */
export function consumerSummary(consumer: Consumer): string {
  const at = consumer.application?.createdAt ?? consumer.credential.createdAt;
  const when = at ? formatDateTime(at) : '';
  return !when || when === '—' ? '' : `Created at ${when}`;
}

/** Names are unique per endpoint only, so `existing` is always that one endpoint's list. */
export function isConsumerNameTaken(name: string, existing: readonly string[]): boolean {
  const candidate = name.trim().toLowerCase();
  return candidate !== '' && existing.some((n) => n.trim().toLowerCase() === candidate);
}
