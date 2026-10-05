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

import { describe, expect, it, vi } from 'vitest';

/**
 * Importing the API layer reaches src/features.ts, which evaluates the build-time `__PRODUCT__`
 * at module scope. Vite substitutes it via `define`; vitest does not, so the module graph throws
 * before any test runs. vi.hoisted executes ahead of the imports below, which is what makes the
 * stub take effect. Same approach as logs.test.ts.
 */
vi.hoisted(() => {
  (globalThis as unknown as { __PRODUCT__: string }).__PRODUCT__ = 'cloud';
});

import { buildLogTextFrom, buildRunLogsFromTasks } from './builds';
import type { LogRow } from '../../types/logs';

// The query asks for newest-first, so a row's position is what matters here.
const rows = (...lines: string[]): LogRow[] => lines.map((logLine) => ({ logLine }) as LogRow);

describe('buildLogTextFrom', () => {
  it('reports no text for a build with no lines', () => {
    expect(buildLogTextFrom([])).toBeNull();
  });

  // Rows come back newest-first; the log has to read oldest-first.
  it('restores chronological order', () => {
    expect(buildLogTextFrom(rows('last', 'middle', 'first'))).toBe('first\nmiddle\nlast');
  });

  it('adds no notice when the build fits inside the limit', () => {
    expect(buildLogTextFrom(rows('only line'))).toBe('only line');
  });

  // A build that outruns the observer's cap keeps its tail, where a failure
  // reports itself — so the text must say the start is missing rather than read
  // as a build that began mid-stream.
  it('says so when the output was truncated, and keeps the newest lines', () => {
    const newestFirst = Array.from({ length: 1000 }, (_, i) => `line-${1000 - i}`);
    const text = buildLogTextFrom(rows(...newestFirst));
    const lines = text!.split('\n');
    expect(lines[0]).toContain('earlier output omitted');
    expect(lines[0]).toContain('1000');
    expect(lines[1]).toBe('line-1');
    expect(lines[lines.length - 1]).toBe('line-1000');
  });
});

describe('buildRunLogsFromTasks', () => {
  const task = (name: string, phase: string) => ({ name, phase });
  const init = task('checkout-source', 'Succeeded');

  // The build stage stays open until the parallel unit tests finish.
  it('holds the build stage open until the unit tests finish', () => {
    const logs = buildRunLogsFromTasks({ tasks: [init, task('build-image', 'Succeeded'), task('unit-test', 'Pending')] }, null);
    expect(logs.build.status).toBeNull();
  });

  it('completes the build stage once both the image and the tests are done', () => {
    const logs = buildRunLogsFromTasks({ tasks: [init, task('build-image', 'Succeeded'), task('unit-test', 'Succeeded')] }, null);
    expect(logs.build.status).toBe('completed');
  });

  // A failed unit-test task shows as a failed Unit Test step.
  it('reports a failing suite as a failed Unit Test step', () => {
    const logs = buildRunLogsFromTasks({ tasks: [init, task('build-image', 'Succeeded'), task('unit-test', 'Failed')] }, null);
    expect(logs.build.status).toBe('completed');
    expect(logs.build.steps.find((s) => s.name === 'Unit Test')?.conclusion).toBe('failure');
  });

  // A skipped unit-test task is left out of the build steps.
  it('leaves a skipped unit-test task out of the build', () => {
    const logs = buildRunLogsFromTasks({ tasks: [init, task('build-image', 'Succeeded'), task('unit-test', 'Skipped')] }, null);
    expect(logs.build.steps.map((s) => s.name)).toEqual(['build-image']);
    expect(logs.build.status).toBe('completed');
  });
});
