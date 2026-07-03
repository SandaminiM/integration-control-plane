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

/** Types for the org-level Audit Logs admin feature. Mirrors Devant's audit-logging contract. */

export type AuditLogOutcome = 'succeeded' | 'failed';
export type AuditLogSort = 'asc' | 'desc';

/** One audit event as returned by `POST /audit-logging/.../audit-logs` (wrapped in `{ list }`). */
export interface AuditLogEntry {
  orgUuid: string;
  /** Event time as a Unix epoch (milliseconds); may arrive as a string or number. */
  timestamp: string | number;
  userIdpId?: string;
  eventLoggedTime?: string;
  action?: string;
  entityType?: string;
  outcome?: AuditLogOutcome;
  /** Flexible metadata bag (project/component/environment ids, emails, etc.). */
  info?: Record<string, string>;
  message?: string;
}

/** Request body for the audit-logs query. Empty arrays mean "no filter on that facet". */
export interface AuditLogsRequest {
  outcomes: AuditLogOutcome[];
  searchText: string;
  userIdpIds: string[];
  projectIds: string[];
  startTime: string;
  endTime: string;
  limit: number;
  sort: AuditLogSort;
}
