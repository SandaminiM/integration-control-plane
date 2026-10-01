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
import type { LogRow } from '../types/logs';
import {
  endpointContextPath,
  filterGatewayRows,
  gatewaySearchPhrases,
  gatewayFrontedEndpoints,
  gatewayRequestLevel,
  isHealthProbe,
  longestCommonPrefix,
  tagGatewayEndpoints,
  mentionsContextPath,
  parseAccessLine,
  startsBeyondGatewayRetention,
  summarizeGatewayLine,
} from './gatewayLogs';
import type { EnvEndpoint } from '../types/component';

// Taken from a DEV gateway: the apip gateway tags every line `[rtr]` and logs abbreviated keys.
const RTR_ACCESS_LINE =
  '[rtr] ' +
  JSON.stringify({
    bytesRx: 0,
    bytesTx: 18,
    dur: 4,
    host: 'api.example.com',
    meth: 'GET',
    path: '/hello-world-service-endpoint-90-37b21ad5/greeting',
    proto: 'HTTP/2',
    reqId: 'fba61c85',
    respCd: 200,
    respFlg: '-',
    t: '2026-09-28T04:43:03.709Z',
    ua: 'curl/8.7.1',
    upPath: '/greeting',
  });

// The same gateway's operational output carries the same tag, so the tag cannot be the test.
const RTR_OPERATIONAL_LINE = '[rtr] [2026-09-27 12:45:50.065][59][warning][misc] [source/common/protobuf/message_validator_impl.cc:23] Deprecated field: envoy.config.cluster.v3.Cluster';

// Envoy's own json_fields spelling, which other gateways ship.
const ENVOY_ACCESS_LINE = JSON.stringify({
  authority: 'api.example.com',
  duration: 12,
  method: 'GET',
  path: '/orders',
  response_code: 201,
  response_flags: '-',
  start_time: '2026-09-12T06:00:00.000Z',
  user_agent: 'curl/8.7.1',
});

describe('parseAccessLine recognition', () => {
  it.each([
    ['a tagged access line', RTR_ACCESS_LINE, true],
    ['an untagged envoy access line', ENVOY_ACCESS_LINE, true],
    ['a tagged operational line', RTR_OPERATIONAL_LINE, false],
    ['an access line missing one marker', '{"meth":"POST","path":"/orders","respCd":201,"dur":8}', true],
    ['a policy-engine error', '{"time":"2026-09-12T06:00:00Z","level":"ERROR","msg":"policy evaluation failed","policy":"ratelimit_v1"}', false],
    ['a controller reconcile line', '{"level":"info","ts":"2026-09-12T06:00:00Z","msg":"reconciled API","api":"pizzashack"}', false],
    ['envoy plain text', '[2026-09-12 06:00:00.123][1][info][main] initializing epoch 0', false],
    ['two markers only', '{"meth":"internal","path":"/healthz"}', false],
    ['truncated json', '{"meth":"GET","path":"/a","respCd":', false],
    ['a json array', '[{"meth":"GET","path":"/a","respCd":200}]', false],
    ['an empty line', '', false],
    ['whitespace', '   \n', false],
  ])('recognises %s', (_label, line, expected) => {
    expect(parseAccessLine(line) !== null).toBe(expected);
  });

  it('reads the line, not the whitespace a collector wrapped it in', () => {
    expect(parseAccessLine(`  \n${RTR_ACCESS_LINE}\t`)).not.toBeNull();
  });
});

describe('parseAccessLine', () => {
  it('reads the request out of a tagged access line', () => {
    expect(parseAccessLine(RTR_ACCESS_LINE)).toEqual({
      method: 'GET',
      path: '/hello-world-service-endpoint-90-37b21ad5/greeting',
      status: 200,
      durationMs: 4,
      authority: 'api.example.com',
      responseFlags: '-',
      userAgent: 'curl/8.7.1',
    });
  });

  it('reads the envoy spelling just the same', () => {
    expect(parseAccessLine(ENVOY_ACCESS_LINE)).toEqual({
      method: 'GET',
      path: '/orders',
      status: 201,
      durationMs: 12,
      authority: 'api.example.com',
      responseFlags: '-',
      userAgent: 'curl/8.7.1',
    });
  });

  it('leaves out fields the gateway did not log', () => {
    expect(parseAccessLine('{"meth":"POST","path":"/orders","respCd":201,"dur":8}')).toEqual({
      method: 'POST',
      path: '/orders',
      status: 201,
      durationMs: 8,
      authority: null,
      responseFlags: null,
      userAgent: null,
    });
  });

  // A status the gateway wrote as a string is not a status this can report as a number.
  it('ignores a field of the wrong type', () => {
    expect(parseAccessLine('{"meth":"GET","path":"/a","respCd":"200","t":"x"}')?.status).toBeNull();
  });

  it('returns null for an operational line, so the caller renders it raw', () => {
    expect(parseAccessLine(RTR_OPERATIONAL_LINE)).toBeNull();
  });
});

describe('isHealthProbe', () => {
  const probe = '[rtr] ' + JSON.stringify({ meth: 'GET', path: '/_gateway-health/ready', respCd: 200, t: 'x', ua: 'kube-probe/1.33' });

  it.each([
    ['a probe by path and agent', probe, true],
    ['a probe the gateway logged without a user agent', '[rtr] {"meth":"GET","path":"/_gateway-health/live","respCd":200,"t":"x"}', true],
    ['a caller whose agent is kube-probe', '[rtr] {"meth":"GET","path":"/orders","respCd":200,"t":"x","ua":"kube-probe/1.33"}', true],
    ['a real request', RTR_ACCESS_LINE, false],
    ['an operational line', RTR_OPERATIONAL_LINE, false],
  ])('reports %s', (_label, line, expected) => {
    expect(isHealthProbe(parseAccessLine(line))).toBe(expected);
  });
});

describe('endpointContextPath', () => {
  it.each([
    ['the declared context, leading slash added', '/greeting-service', null, '/greeting-service'],
    ['a context declared without one', 'greeting-service', null, '/greeting-service'],
    ['the path of the invoke URL when no context is declared', null, 'https://gw.example.com/hello-world-endpoint-90-37b21ad5', '/hello-world-endpoint-90-37b21ad5'],
    ['a trailing slash removed, so the value matches what a log line carries', null, 'https://gw.example.com/hello/', '/hello'],
    ['nothing to go on', null, null, ''],
    ['a URL that will not parse', null, 'not a url', ''],
    ['a declared context with a trailing slash, the same as its URL form', '/greeting/', null, '/greeting'],
    ['a root context, which cannot narrow a shared gateway', '/', null, ''],
    ['a root URL', null, 'https://gw.example.com/', ''],
  ])('reads %s', (_label, apiContext, url, expected) => {
    expect(endpointContextPath(apiContext, url)).toBe(expected);
  });
});

describe('filterGatewayRows', () => {
  const row = (logLine: string): LogRow => ({ logLine, source: 'gateway', request: parseAccessLine(logLine) }) as LogRow;
  const rows = [row(RTR_ACCESS_LINE), row('[rtr] ' + JSON.stringify({ meth: 'GET', path: '/_gateway-health/ready', respCd: 200, t: 'x', ua: 'kube-probe/1.33' })), row(RTR_OPERATIONAL_LINE)];

  // Returning the same array keeps a caller's memoized identity stable.
  it('returns the rows untouched when nothing narrows them', () => {
    expect(filterGatewayRows(rows, { hideHealthChecks: false })).toBe(rows);
  });

  it('drops health probes without dropping real requests', () => {
    const kept = filterGatewayRows(rows, { hideHealthChecks: true });
    expect(kept.map((r) => r.logLine)).toEqual([RTR_ACCESS_LINE, RTR_OPERATIONAL_LINE]);
  });

  it('narrows by a phrase, case-insensitively', () => {
    expect(filterGatewayRows(rows, { hideHealthChecks: false, searchPhrase: 'GREETING' })).toHaveLength(1);
    expect(filterGatewayRows(rows, { hideHealthChecks: false, searchPhrase: '   ' })).toBe(rows);
  });
});

describe('tagGatewayEndpoints', () => {
  const row = (path: string, extra: Record<string, unknown> = {}): LogRow => {
    const logLine = '[rtr] ' + JSON.stringify({ meth: 'GET', path, respCd: 200, t: 'x', ...extra });
    return { logLine, source: 'gateway', request: parseAccessLine(logLine) } as LogRow;
  };
  const endpoints = [
    { id: 'covid-status', contextPath: '/covid19-status-covid-status-753fa897' },
    { id: 'endpoint-9001', contextPath: '/covid19-status-endpoint-9001-3778a43e' },
  ];

  it('stamps each request with the endpoint whose path it sits under', () => {
    const tagged = tagGatewayEndpoints([row('/covid19-status-covid-status-753fa897/cases'), row('/covid19-status-endpoint-9001-3778a43e')], endpoints);
    expect(tagged.map((r) => r.endpoint)).toEqual(['covid-status', 'endpoint-9001']);
  });

  it('drops a lookalike handle that only shares the prefix', () => {
    expect(tagGatewayEndpoints([row('/covid19-status-v2-endpoint-9001-11111111/cases')], endpoints)).toEqual([]);
  });

  it('matches a request on its own path, not on an upstream path that carries the context', () => {
    expect(tagGatewayEndpoints([row('/other-api/cases', { upPath: '/covid19-status-covid-status-753fa897' })], endpoints)).toEqual([]);
  });

  it('never lets an endpoint with no path claim every row', () => {
    expect(tagGatewayEndpoints([row('/anything')], [{ id: 'blank', contextPath: '' }])).toEqual([]);
  });

  it('attributes an operational line by the path it mentions', () => {
    const line = { logLine: 'deployed API /covid19-status-endpoint-9001-3778a43e to the router', source: 'gateway', request: null } as LogRow;
    expect(tagGatewayEndpoints([line], endpoints)[0]?.endpoint).toBe('endpoint-9001');
  });
});

describe('gatewayFrontedEndpoints', () => {
  const endpoint = (id: string, networkVisibilities: string[]): EnvEndpoint => ({ id, networkVisibilities }) as EnvEndpoint;

  it('keeps every Public endpoint, skipping ones the gateway never sees', () => {
    const endpoints = [endpoint('project-only', ['Project']), endpoint('public', ['Public']), endpoint('org-only', ['Organization']), endpoint('public-2', ['Public'])];
    expect(gatewayFrontedEndpoints(endpoints).map((e) => e.id)).toEqual(['public', 'public-2']);
  });

  it('finds none when no endpoint is Public', () => {
    expect(gatewayFrontedEndpoints([endpoint('project-only', ['Project']), endpoint('org-only', ['Organization'])])).toEqual([]);
  });
});

describe('longestCommonPrefix', () => {
  it('narrows a multi-endpoint integration to its handle', () => {
    const paths = ['/covid19-status-covid-commu-3e5-3fd28816', '/covid19-status-covid-status-753fa897', '/covid19-status-endpoint-9001-3778a43e', '/covid19-status-endpoint-9002-c7e280a0', '/covid19-status-endpoint-9097-50939cbc'];
    expect(longestCommonPrefix(paths)).toBe('/covid19-status-');
  });

  it('keeps the one path whole when there is a single endpoint', () => {
    expect(longestCommonPrefix(['/hr-assistant-chat-servic-867'])).toBe('/hr-assistant-chat-servic-867');
  });

  it('finds nothing to share in an empty list', () => {
    expect(longestCommonPrefix([])).toBe('');
  });
});

describe('mentionsContextPath', () => {
  it.each([
    ['the path followed by a sub-path', '{"path":"/greeting/hello"}', true],
    ['the path at the end of a quoted value', '{"path":"/greeting"}', true],
    ['the path followed by a query', 'GET /greeting?x=1', true],
    ['a longer path sharing the prefix', '{"path":"/greeting-v2/hello"}', false],
    ['the path nested under another', '{"path":"/internal/greeting"}', false],
  ])('reports %s', (_label, line, expected) => {
    expect(mentionsContextPath(line, '/greeting')).toBe(expected);
  });

  it('treats a regex-special path literally', () => {
    expect(mentionsContextPath('{"path":"/a.b"}', '/a.b')).toBe(true);
    expect(mentionsContextPath('{"path":"/aXb"}', '/a.b')).toBe(false);
  });
});

describe('startsBeyondGatewayRetention', () => {
  const now = Date.parse('2026-09-28T12:00:00Z');

  it.each([
    ['a range inside the retention window', '2026-09-27T12:00:00Z', false],
    ['a range starting exactly at the horizon', '2026-09-25T12:00:00Z', false],
    ['a range starting before the horizon', '2026-09-25T11:59:59Z', true],
  ])('reports %s', (_label, startTime, expected) => {
    expect(startsBeyondGatewayRetention(startTime, now)).toBe(expected);
  });
});

describe('summarizeGatewayLine', () => {
  it.each([
    ["a structured line's message", '{"time":"2026-09-29T08:24:06.540760489Z","level":"INFO","source":"/build/pkg/policyxds/server.go:228","msg":"Policy xDS stream request","stream_id":1}', 'Policy xDS stream request'],
    ['a tagged structured line', '[pe] {"level":"ERROR","message":"policy evaluation failed"}', 'policy evaluation failed'],
    ['an Envoy text line, past its bracketed prefixes', RTR_OPERATIONAL_LINE, 'Deprecated field: envoy.config.cluster.v3.Cluster'],
    ['plain text as it is', 'starting gateway controller', 'starting gateway controller'],
    ['structured output with no message, as raw text', '{"level":"info","ts":"x"}', '{"level":"info","ts":"x"}'],
  ])('reads %s', (_label, line, expected) => {
    expect(summarizeGatewayLine(line)).toBe(expected);
  });

  it('shortens a long line to one readable row', () => {
    const summary = summarizeGatewayLine('x'.repeat(500));
    expect(summary).toHaveLength(120);
    expect(summary.endsWith('…')).toBe(true);
  });
});

describe('gatewayRequestLevel', () => {
  const req = (status: number | null) => parseAccessLine(`[rtr] ${JSON.stringify({ meth: 'GET', path: '/a', respCd: status, t: 'x' })}`);

  it.each([
    ['a client error', 404, 'ERROR'],
    ['a server error', 503, 'ERROR'],
    ['no upstream response', 0, 'ERROR'],
    ['a success, as the log source said', 200, 'INFO'],
    ['a redirect, as the log source said', 302, 'INFO'],
  ])('reads %s', (_label, status, expected) => {
    expect(gatewayRequestLevel(req(status), 'INFO')).toBe(expected);
  });

  it("keeps the source's level for a line that is not a request", () => {
    expect(gatewayRequestLevel(null, 'WARN')).toBe('WARN');
  });
});

describe('gatewaySearchPhrases', () => {
  it('uses the shared prefix when it narrows to the integration', () => {
    expect(gatewaySearchPhrases(['/covid19-status-covid-status-753fa897', '/covid19-status-endpoint-9001-3778a43e'])).toEqual(['/covid19-status-']);
  });

  it("searches each path on its own when they share no more than '/'", () => {
    expect(gatewaySearchPhrases(['/orders', '/payments', '/orders'])).toEqual(['/orders', '/payments']);
  });

  it('has nothing to search for without paths', () => {
    expect(gatewaySearchPhrases([])).toEqual([]);
  });
});
