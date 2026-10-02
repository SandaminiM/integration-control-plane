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

import { describe, expect, it } from 'vitest';
import { describeAppliedFilters, formatLogTimestamp, logDetailFields, liveStatus, logsSummary, retentionBoundaryIndex, retentionNote } from './logsView';
import type { LogRow } from '../types/logs';

describe('describeAppliedFilters', () => {
  it('shows nothing when no filter is applied', () => {
    expect(describeAppliedFilters({ levels: [], environments: [] })).toEqual([]);
  });

  it('turns each applied value into its own removable chip, by display name', () => {
    const chips = describeAppliedFilters({
      levels: ['ERROR'],
      environments: ['dev'],
      endpoints: ['endpoint-9001'],
      hideHealthChecks: true,
      environmentNames: { dev: 'Development' },
      endpointNames: { 'endpoint-9001': 'Cases API' },
    });
    expect(chips.map((c) => c.label)).toEqual(['Level: ERROR', 'Environment: Development', 'Endpoint: Cases API', 'Health checks hidden']);
    expect(chips.find((c) => c.field === 'environment')?.value).toBe('dev');
  });

  it('falls back to the raw value when no display name is known', () => {
    expect(describeAppliedFilters({ levels: [], environments: ['prod'] })[0].label).toBe('Environment: prod');
  });
});

describe('retentionBoundaryIndex', () => {
  const horizon = Date.parse('2026-09-28T00:00:00Z');
  const rows = (...ts: string[]) => ts.map((timestamp) => ({ timestamp }));

  it('marks the first older row in a newest-first list', () => {
    expect(retentionBoundaryIndex(rows('2026-09-30T00:00:00Z', '2026-09-29T00:00:00Z', '2026-09-27T00:00:00Z'), 'desc', horizon)).toBe(2);
  });

  it('marks the first kept row in an oldest-first list', () => {
    expect(retentionBoundaryIndex(rows('2026-09-26T00:00:00Z', '2026-09-27T00:00:00Z', '2026-09-29T00:00:00Z'), 'asc', horizon)).toBe(2);
  });

  it('draws nothing when the loaded rows never cross the horizon', () => {
    expect(retentionBoundaryIndex(rows('2026-09-30T00:00:00Z', '2026-09-29T00:00:00Z'), 'desc', horizon)).toBe(-1);
    expect(retentionBoundaryIndex(rows('2026-09-27T00:00:00Z'), 'desc', horizon)).toBe(-1);
  });
});

describe('formatLogTimestamp', () => {
  const now = new Date(2026, 9, 1, 12, 0, 0);

  it('shows the clock with milliseconds for today', () => {
    expect(formatLogTimestamp(new Date(2026, 9, 1, 10, 14, 6, 218).toISOString(), now)).toBe('10:14:06.218');
  });

  it('adds the date for another day', () => {
    expect(formatLogTimestamp(new Date(2026, 8, 27, 18, 2, 15).toISOString(), now)).toBe('Sep 27 18:02:15');
  });

  it('leaves an unreadable timestamp as it came', () => {
    expect(formatLogTimestamp('not-a-date', now)).toBe('not-a-date');
  });
});

describe('logsSummary', () => {
  it('lists what there is to count', () => {
    expect(logsSummary({ lines: 128, endpoints: 5, environments: 2 })).toBe('128 lines · 5 endpoints · 2 environments');
  });

  it('says how many of the loaded lines the filters left', () => {
    expect(logsSummary({ lines: 12, loaded: 300, endpoints: 5 })).toBe('12 of 300 lines · 5 endpoints');
    expect(logsSummary({ lines: 300, loaded: 300 })).toBe('300 lines');
  });

  it('uses the singular for one and drops empty parts', () => {
    expect(logsSummary({ lines: 1, endpoints: 0, environments: 1 })).toBe('1 line · 1 environment');
  });
});

describe('logDetailFields', () => {
  const base = { timestamp: '2026-10-01T04:44:06.218Z', level: 'INFO', logLine: 'line', podName: 'gw-1', containerName: 'gateway-runtime' } as LogRow;

  it("lists a gateway request's own parts, leaving out what the line omitted", () => {
    const log = { ...base, source: 'gateway', request: { method: 'GET', path: '/a', status: 0, durationMs: 4, authority: null, responseFlags: 'UF', userAgent: null } } as LogRow;
    expect(logDetailFields(log, { envName: 'Development', endpointName: 'Cases API' })).toEqual([
      { label: 'Method', value: 'GET' },
      { label: 'Path', value: '/a' },
      { label: 'Status', value: '0' },
      { label: 'Duration', value: '4 ms' },
      { label: 'Environment', value: 'Development' },
      { label: 'Endpoint', value: 'Cases API' },
      { label: 'Response flags', value: 'UF' },
      { label: 'Pod', value: 'gw-1' },
      { label: 'Container', value: 'gateway-runtime' },
    ]);
  });

  it('lists the source-supplied fields for an application line, without repeating the line itself', () => {
    const labels = logDetailFields({ ...base, source: 'component', containerName: 'main' } as LogRow, { envName: 'Production' }).map((f) => f.label);
    expect(labels).toEqual(['Timestamp', 'Level', 'Source', 'Environment', 'Container', 'Pod']);
  });
});

describe('retentionNote', () => {
  it.each([
    ['newest first, merged with application logs', 'desc', true, 'Gateway logs are kept for 3 days. Only application logs continue below.'],
    ['newest first, gateway logs only', 'desc', false, 'Gateway logs are kept for 3 days. Older lines are no longer available.'],
    ['oldest first, merged with application logs', 'asc', true, 'Gateway logs are kept for 3 days. Only application logs appear above; gateway logs start here.'],
    ['oldest first, gateway logs only', 'asc', false, 'Gateway logs are kept for 3 days. Gateway logs start here.'],
  ] as const)('names what is on the other side: %s', (_label, sort, mixed, expected) => {
    expect(retentionNote(sort, mixed)).toBe(expected);
  });
});

describe('liveStatus', () => {
  it('is live on the newest page, newest first', () => {
    expect(liveStatus({ autoFetch: true, historyOpen: false, sort: 'desc' })).toEqual({ live: true, backToLive: 'none' });
  });

  it('pauses on older pages and goes back by dropping them', () => {
    expect(liveStatus({ autoFetch: true, historyOpen: true, sort: 'desc' })).toEqual({ live: false, pausedNote: 'viewing older lines', backToLive: 'newestPage' });
  });

  it('cannot follow new lines oldest first, so going back means newest first', () => {
    expect(liveStatus({ autoFetch: true, historyOpen: false, sort: 'asc' })).toEqual({ live: false, pausedNote: 'oldest first', backToLive: 'newestFirst' });
  });

  it('offers nothing while auto refresh is off', () => {
    expect(liveStatus({ autoFetch: false, historyOpen: true, sort: 'desc' })).toEqual({ live: false, backToLive: 'none' });
  });
});
