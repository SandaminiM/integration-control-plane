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

/** Raw credential statuses that mean "this credential no longer authenticates". */
const REVOKED_STATUSES = new Set(['revoked', 'inactive', 'expired', 'deleted', 'disabled']);

/**
 * Normalise a credential's raw status into the two states the UI models.
 * Unknown values read as `active`: a credential the gateway still honours must
 * never be shown as revoked just because its label is unfamiliar.
 */
export function normalizeConsumerStatus(raw?: string): ConsumerStatus {
  return raw && REVOKED_STATUSES.has(raw.trim().toLowerCase()) ? 'revoked' : 'active';
}

/** Consumer applications carry an optional display name; fall back to the handle. */
export function consumerDisplayName(consumer: Consumer): string {
  return consumer.application.displayName || consumer.application.id;
}

/**
 * Row subtitle for a consumer: how long it has been in its current state.
 * `Active since …` counts from creation, `Revoked …` from the revoke. The
 * timestamp is dropped when the server does not report one — a bare state
 * beats "since —".
 */
export function consumerSummary(consumer: Consumer): string {
  const revoked = consumer.status === 'revoked';
  const at = revoked ? consumer.revokedAt : (consumer.credential.createdAt ?? consumer.application.createdAt);
  const when = at ? formatDateTime(at) : '';
  if (!when || when === '—') return revoked ? 'Revoked' : 'Active';
  return revoked ? `Revoked ${when}` : `Active since ${when}`;
}

/**
 * Case-insensitive duplicate check for a consumer name. Names only have to be
 * unique within one endpoint of one environment, so `existing` is always the
 * list already rendered for that endpoint — the same name on a sibling endpoint
 * is fine and must stay allowed.
 */
export function isConsumerNameTaken(name: string, existing: readonly string[]): boolean {
  const candidate = name.trim().toLowerCase();
  return candidate !== '' && existing.some((n) => n.trim().toLowerCase() === candidate);
}
