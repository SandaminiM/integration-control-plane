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

import type { TaskExecution } from '../types/executions';

/** A job's own start lags the moment it was due, so matching absorbs the gap. */
export const PENDING_MATCH_TOLERANCE_MS = 5_000;

/** A due run the backend never reports is dropped rather than spinning forever. */
export const PENDING_EXPIRY_MS = 120_000;

/** Whether the backend has reported an execution that this due time can account for. */
export function hasExecutionForDueTime(dueTime: number, executions: TaskExecution[]): boolean {
  return executions.some((execution) => {
    const seconds = parseInt(execution.startTime, 10);
    return !Number.isNaN(seconds) && seconds * 1000 >= dueTime - PENDING_MATCH_TOLERANCE_MS;
  });
}
