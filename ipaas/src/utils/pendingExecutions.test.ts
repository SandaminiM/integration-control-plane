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
import { hasExecutionForDueTime } from './pendingExecutions';
import type { TaskExecution } from '../types/executions';

const DUE = 1_700_000_000_000;

function execution(startMs: number): TaskExecution {
  return { id: `e-${startMs}`, startTime: String(Math.floor(startMs / 1000)), completionTime: '', runId: '', revisionId: '', failedReason: '', status: 'InProgress' };
}

describe('hasExecutionForDueTime', () => {
  it('is false when no executions have been reported', () => {
    expect(hasExecutionForDueTime(DUE, [])).toBe(false);
  });

  it('is true for an execution that started after the due time', () => {
    expect(hasExecutionForDueTime(DUE, [execution(DUE + 2000)])).toBe(true);
  });

  it('is true for an execution that started just before the due time', () => {
    expect(hasExecutionForDueTime(DUE, [execution(DUE - 3000)])).toBe(true);
  });

  it('is false for an execution older than the tolerance', () => {
    expect(hasExecutionForDueTime(DUE, [execution(DUE - 60_000)])).toBe(false);
  });

  it('ignores executions with no start time', () => {
    const pending: TaskExecution = { ...execution(DUE), startTime: '' };
    expect(hasExecutionForDueTime(DUE, [pending])).toBe(false);
  });

  it('finds a match among older executions', () => {
    expect(hasExecutionForDueTime(DUE, [execution(DUE - 120_000), execution(DUE + 1000)])).toBe(true);
  });
});
