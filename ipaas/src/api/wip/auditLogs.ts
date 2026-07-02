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

import { choreoClient, withScopeRetry } from './httpClients';
import type { AuditLogEntry, AuditLogsRequest } from '../../types/auditLogs';

/**
 * Query the org's audit events. The API wraps the results in `{ list }`.
 * Wrapped in `withScopeRetry` because APIM rejects the first call with a scope-validation
 * 403 (code 900910) until the token is refreshed with the org-bound scopes (same as run-pod).
 */
export async function fetchAuditLogs(orgUuid: string, request: AuditLogsRequest): Promise<AuditLogEntry[]> {
  const res = await withScopeRetry(() => choreoClient.post<{ list: AuditLogEntry[] }>(`/audit-logging/1.0.0/orgs/${encodeURIComponent(orgUuid)}/audit-logs`, request));
  return res?.list ?? [];
}
