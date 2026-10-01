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

/** View helpers for the logs viewer: the filter chips it shows, where the retention divider goes, and how rows read. */

import type { LogRow } from '../types/logs';
import { GATEWAY_LOG_RETENTION_DAYS } from '../constants/gatewayLogs';
import { DISPLAY_FIELDS, formatValue } from './logs';

export type AppliedFilterField = 'level' | 'environment' | 'endpoint' | 'healthChecks';

/** One removable chip under the search bar. */
export interface AppliedFilter {
  id: string;
  field: AppliedFilterField;
  /** The value the chip removes; absent for a field with a single on/off state. */
  value?: string;
  label: string;
}

export interface AppliedFilterInput {
  levels: string[];
  environments: string[];
  endpoints?: string[];
  hideHealthChecks?: boolean;
  environmentNames?: Record<string, string>;
  endpointNames?: Record<string, string>;
}

export function describeAppliedFilters({ levels, environments, endpoints = [], hideHealthChecks = false, environmentNames = {}, endpointNames = {} }: AppliedFilterInput): AppliedFilter[] {
  return [
    ...levels.map((level) => ({ id: `level:${level}`, field: 'level' as const, value: level, label: `Level: ${level}` })),
    ...environments.map((env) => ({ id: `environment:${env}`, field: 'environment' as const, value: env, label: `Environment: ${environmentNames[env] ?? env}` })),
    ...endpoints.map((ep) => ({ id: `endpoint:${ep}`, field: 'endpoint' as const, value: ep, label: `Endpoint: ${endpointNames[ep] ?? ep}` })),
    ...(hideHealthChecks ? [{ id: 'healthChecks', field: 'healthChecks' as const, label: 'Health checks hidden' }] : []),
  ];
}

/** Index of the first row past `horizonMs` in display order, where the retention divider goes; -1 if none crosses it. */
export function retentionBoundaryIndex(rows: Pick<LogRow, 'timestamp'>[], sort: 'asc' | 'desc', horizonMs: number): number {
  const older = (row: Pick<LogRow, 'timestamp'>): boolean => new Date(row.timestamp).getTime() < horizonMs;
  const index = rows.findIndex((row) => (sort === 'desc' ? older(row) : !older(row)));
  return index > 0 ? index : -1;
}

/** The retention divider's wording, which names what sits on the other side of it: application rows, or nothing. */
export function retentionNote(sort: 'asc' | 'desc', withApplicationLogs: boolean): string {
  const kept = `Gateway logs are kept for ${GATEWAY_LOG_RETENTION_DAYS} days.`;
  if (sort === 'desc') return withApplicationLogs ? `${kept} Only application logs continue below.` : `${kept} Older lines are no longer available.`;
  return withApplicationLogs ? `${kept} Only application logs appear above; gateway logs start here.` : `${kept} Gateway logs start here.`;
}

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A row's time in local time: the clock with milliseconds today, the date and clock on any other day. */
export function formatLogTimestamp(timestamp: string, now: Date = new Date()): string {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return timestamp;
  const clock = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  return sameDay ? `${clock}.${pad(d.getMilliseconds(), 3)}` : `${MONTHS[d.getMonth()]} ${d.getDate()} ${clock}`;
}

const count = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`;

/** The panel's summary line; a part is left out when it has nothing to count. */
export function logsSummary({ lines, endpoints, environments }: { lines: number; endpoints?: number; environments?: number }): string {
  return [count(lines, 'line'), endpoints ? count(endpoints, 'endpoint') : '', environments ? count(environments, 'environment') : ''].filter(Boolean).join(' · ');
}

/** One label and value in an expanded row's field list. */
export interface LogDetailField {
  label: string;
  value: string;
}

const OWN_ROW_FIELDS = new Set<keyof LogRow>(['timestamp', 'level', 'logLine']);

/** The fields an expanded row lists: a request's own parts for a gateway request, else what the log source supplied. */
export function logDetailFields(log: LogRow, { envName, endpointName }: { envName?: string; endpointName?: string } = {}): LogDetailField[] {
  const request = log.source === 'gateway' ? log.request : null;
  const fields: [string, unknown][] = request
    ? [
        ['Method', request.method],
        ['Path', request.path],
        ['Status', request.status],
        ['Duration', request.durationMs != null ? `${request.durationMs} ms` : null],
        ['Environment', envName],
        ['Endpoint', endpointName],
        ['Caller', request.userAgent],
        ['Host', request.authority],
        ['Response flags', request.responseFlags && request.responseFlags !== '-' ? request.responseFlags : null],
        ['Pod', log.podName],
        ['Container', log.containerName],
      ]
    : [
        ['Timestamp', isNaN(new Date(log.timestamp).getTime()) ? log.timestamp : new Date(log.timestamp).toLocaleString()],
        ['Level', log.level],
        ['Source', log.source === 'gateway' ? 'Gateway' : log.source === 'component' ? 'Application' : null],
        ['Environment', envName],
        ['Endpoint', endpointName],
        ...DISPLAY_FIELDS.filter(({ key }) => !OWN_ROW_FIELDS.has(key)).map(({ key, label }): [string, unknown] => [label, log[key]]),
      ];
  return fields.map(([label, value]) => ({ label, value: formatValue(value) })).filter((f) => f.value !== '');
}
