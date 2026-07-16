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

import type { ExecutionOutcome } from '../types/insights';

/** Compact count: 1_500_000 → '1.50M', 1500 → '1.5k', else rounded integer. */
export function formatCount(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`;
}

/** Human duration from seconds: '45s', '3m', '3m 20s'. */
export function formatDuration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

/** Classify a task-execution status string into a success/failure/timeout outcome. */
export function executionOutcome(status: string): ExecutionOutcome {
  const v = status?.toLowerCase() ?? '';
  if (v === 'completed' || v === 'succeeded' || v === 'success') return 'success';
  if (/timeout|timed.?out|deadline/.test(v)) return 'timeout';
  return 'failure';
}
