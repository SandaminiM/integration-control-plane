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

/**
 * Cloud (OpenChoreo) scheduled-task / execution API. Calls the ipaas-service BFF.
 *
 * OpenChoreo scopes scheduled tasks per environment, so the schedule spec and job
 * history are keyed by component + env (+ project), not by releaseId — the legacy
 * releaseId argument is carried only to satisfy the shared contract and is ignored
 * here. Per-execution logs remain safe-defaulted (pod-log plumbing via
 * resource-tree is not wired yet), and triggerTask (MI) is unsupported.
 */

import { bff, q, seg } from './_client';
import type { ExecutionConfigs, TaskExecution, ExecutionLogEntry, UpdateJobConfigsInput, TriggerComponentInput } from '../../types/executions';
import type { TriggerTaskInput } from '../../types/artifact';

interface ExecutionArgument { argumentName: string; argumentValue: string }

// BFF Execution (k8s job) from GET /components/{name}/schedules/{envId}/executions.
interface BffExecution { jobId?: string; status?: string; startTime?: string; completionTime?: string; revisionId?: string }

// BFF Schedule (CronJob spec) from GET /components/{name}/schedules/{envId}.
interface BffSchedule { cronExpression: string; cronTimezone?: string; state?: string; backoffLimit?: number | null; activeDeadlineSeconds?: number | null }

// The BFF returns ISO timestamps; the env card parses startTime/completionTime
// as unix seconds (parseInt * 1000), so convert.
function toUnixSeconds(iso?: string): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  return Number.isNaN(t) ? '' : String(Math.floor(t / 1000));
}

function toTaskExecution(e: BffExecution): TaskExecution {
  const jobId = e.jobId ?? '';
  return {
    id: jobId,
    runId: jobId,
    startTime: toUnixSeconds(e.startTime),
    completionTime: toUnixSeconds(e.completionTime),
    revisionId: e.revisionId ?? '',
    failedReason: '',
    status: e.status ?? '',
    arguments: null,
  };
}

// GET /components/{name}/schedules/{envId} — the CronJob's schedule spec, keyed by
// environment. Mapped onto ExecutionConfigs so the schedule UI (button state,
// next-run countdown, dialog prefill) reads it unchanged.
//
// Stopping a schedule undeploys the underlying ReleaseBinding (state "Undeploy")
// but leaves its cron spec intact, so the endpoint keeps returning a cronExpression.
// Report a stopped schedule as no active schedule so the UI reflects "not running"
// rather than treating the lingering cron as live.
export const fetchExecutionConfigs = (componentId: string, _releaseId: string, envId = '', projectId = ''): Promise<ExecutionConfigs | null> => {
  if (!envId) return Promise.resolve(null);
  return bff
    .get<BffSchedule>(`/components/${seg(componentId)}/schedules/${seg(envId)}${q({ projectName: projectId })}`)
    .then((s) => {
      if (s.state === 'Undeploy') return null;
      return {
        cronjobFrequency: s.cronExpression,
        cronjobTimezone: s.cronTimezone || 'UTC',
        timeoutSeconds: s.activeDeadlineSeconds ?? undefined,
        retryCount: s.backoffLimit ?? undefined,
      };
    })
    .catch(() => null);
};

// GET /components/{name}/environments/{envId}/resource-tree/executions — the
// CronJob's job runs (newest-first), keyed by component + env.
//
// Sourced from OpenChoreo's rendered resource tree (control-plane API) 
export const fetchTaskExecutions = (_releaseId: string, componentId = '', envId = '', _projectId = ''): Promise<TaskExecution[]> => {
  if (!componentId || !envId) return Promise.resolve([]);
  return bff
    .get<{ items?: BffExecution[] }>(`/components/${seg(componentId)}/environments/${seg(envId)}/resource-tree/executions`)
    .then((r) => (r?.items ?? []).map(toTaskExecution))
    .catch(() => []);
};

export const fetchExecutionArguments = (runId: string, componentId: string, _releaseId: string): Promise<ExecutionArgument[]> =>
  bff.get<ExecutionArgument[]>(`/components/${seg(componentId)}/executions/${seg(runId)}/arguments`).then((r) => r ?? []).catch(() => []);

// awaits: BFF execution-log plumbing (pod logs via resource-tree).
export const fetchExecutionLogs = (_componentId: string, _deploymentTrackId: string, _executionId: string, _environmentId: string): Promise<ExecutionLogEntry[]> => Promise.resolve([]);

// No dedicated count endpoint; approximate from the listed job runs.
export const fetchTaskExecutionCount = (releaseId: string, componentId = '', envId = '', projectId = ''): Promise<number | null> =>
  fetchTaskExecutions(releaseId, componentId, envId, projectId).then((items) => items.length).catch(() => null);

export const updateJobConfigs = (input: UpdateJobConfigsInput): Promise<boolean> =>
  bff.put<{ success?: boolean }>(`/components/${seg(input.componentId)}/job-configs`, input).then((r) => r?.success ?? true);

// MI artifact trigger — no API Manager / MI runtime on the OpenChoreo stack.
export const triggerTask = (_input: TriggerTaskInput): Promise<{ status: string; message: string; successCount: number; failedCount: number; details: string[] }> =>
  Promise.resolve({ status: 'skipped', message: 'Task triggering is not supported in this build.', successCount: 0, failedCount: 0, details: [] });

// POST /components/{name}/releases/{releaseId}/executions — BFF resolves the env.
// The BFF takes positional string args; map the name/value pairs to their values.
export const triggerComponentRun = (input: TriggerComponentInput): Promise<unknown> =>
  bff.post(`/components/${seg(input.componentId)}/releases/${seg(input.releaseId)}/executions`, {
    args: (input.args ?? []).map((a) => a.argument_value),
  });
