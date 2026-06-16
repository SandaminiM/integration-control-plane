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
 * Cloud (OpenChoreo) build-log API.
 *
 * The build card's stepper needs per-stage status + steps. The per-step
 * progress lives in the WorkflowRun's tasks (GET /components/{name}/builds/{runId},
 * each task has a phase), so we fetch the run from the BFF and synthesize the
 * BuildRunLogs (init/build/deploy) from its task phases.
 *
 * The log text itself comes from the wso2cloud observability proxy, queried by
 * WorkflowRun name (see cloud/logs.ts). The BFF logs route
 * (GET /components/{name}/builds/{runId}/logs) is kept as a fallback for
 * deployments without the proxy.
 */

import type { BuildRunLogs, BuildStage, BuildStep } from '../../types/build';
import { bff, q, seg } from './_client';
import { queryObsLogs } from './logs';

// Underscored params (_orgHandler, _versionId) are kept for devant contract
// parity; cloud addresses builds by component name + run id only.

// Subset of the BFF WorkflowRun (GET /components/{name}/builds/{runId}) we read.
interface BffWorkflowTask {
  name: string;
  phase?: string;
  startedAt?: string;
  completedAt?: string;
}
interface BffBuildRun {
  status?: string;
  startedAt?: string;
  completedAt?: string;
  tasks?: BffWorkflowTask[];
  // The run's K8s namespace (the org namespace); the observability proxy filters
  // log queries on it.
  namespace?: string;
}

type StageKey = 'init' | 'build' | 'deploy';

// Classify an OpenChoreo build task into one of the three stepper stages.
// Pattern-based so it tolerates builder-specific task names (ballerina /
// dockerfile / buildpack workflows expose different sets). Observed names:
// checkout-source → init, build-image → build, generate-workload-cr &
// publish-build-artifacts → deploy.
function stageForTask(name: string): StageKey {
  const n = name.toLowerCase();
  if (n.includes('checkout') || n.includes('clone') || n.includes('source')) return 'init';
  if (n.includes('publish') || n.includes('push') || n.includes('workload') || n.includes('artifact') || n.includes('deploy') || n.includes('release')) return 'deploy';
  return 'build';
}

// OpenChoreo task phase → the status/conclusion the stepper reads.
function stepFromTask(task: BffWorkflowTask, number: number): BuildStep {
  const phase = task.phase ?? '';
  let status = 'pending';
  let conclusion: string | null = null;
  if (phase === 'Running') {
    status = 'in_progress';
  } else if (phase === 'Succeeded') {
    status = 'completed';
    conclusion = 'success';
  } else if (phase === 'Failed') {
    status = 'completed';
    conclusion = 'failure';
  }
  return { number, name: task.name, status, conclusion, started_at: task.startedAt ?? null, completed_at: task.completedAt ?? null };
}

// Stage status from its steps: in_progress if any running, completed if all
// terminal, otherwise null (the card reads an empty stage as "pending").
function stageStatus(steps: BuildStep[]): string | null {
  if (steps.length === 0) return null;
  if (steps.some((s) => s.status === 'in_progress')) return 'in_progress';
  if (steps.every((s) => s.status === 'completed')) return 'completed';
  return null;
}

// The card base64-decodes stage logs (safeAtob), but the BFF returns raw text;
// re-encode so it renders. Null/empty stays null so the card shows the live
// step list instead.
function encodeLog(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch {
    return null;
  }
}

function buildRunLogsFromTasks(run: BffBuildRun, rawBuildLog: string | null): BuildRunLogs {
  const stages: Record<StageKey, BuildStep[]> = { init: [], build: [], deploy: [] };
  (run.tasks ?? []).forEach((t, i) => stages[stageForTask(t.name)].push(stepFromTask(t, i + 1)));
  const mk = (key: StageKey, log: string | null): BuildStage => ({ log, status: stageStatus(stages[key]), steps: stages[key] });
  return { init: mk('init', null), build: mk('build', encodeLog(rawBuildLog)), deploy: mk('deploy', null) };
}

// Fetch the build's log lines from the observability proxy, keyed by the
// WorkflowRun name. The time window starts at the run's start (30 days back
// when unknown) and is padded 10 minutes past completion to capture logs that
// arrive late in the ingestion pipeline; in-progress runs read up to now.
async function fetchObsBuildLogText(runId: string, run: BffBuildRun): Promise<string | null> {
  const startTime = run.startedAt || new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
  const endTime = run.completedAt ? new Date(new Date(run.completedAt).getTime() + 10 * 60_000).toISOString() : new Date().toISOString();
  try {
    const rows = await queryObsLogs({
      searchScope: { ...(run.namespace ? { namespace: run.namespace } : {}), workflowRunName: runId },
      startTime,
      endTime,
      limit: 500,
      sortOrder: 'asc',
      logLevels: [],
      searchPhrase: '',
    });
    return rows.length > 0 ? rows.map((r) => r.logLine).join('\n') : null;
  } catch {
    return null;
  }
}

// Fetch the run (for task phases → steps) and its log text (best-effort) and
// synthesize the BuildRunLogs the stepper consumes. The build run is required;
// the log text is sourced from the observability proxy, with the BFF logs
// route as fallback when the proxy is unavailable or has nothing for the run.
async function loadBuildRunLogs(componentId: string, runId: string, projectQuery: string): Promise<BuildRunLogs | null> {
  const run = await bff.get<BffBuildRun | null>(`/components/${seg(componentId)}/builds/${seg(runId)}${projectQuery}`).catch(() => null);
  if (!run) return null;
  let rawLog = await fetchObsBuildLogText(runId, run);
  if (rawLog === null) {
    const bffLogs = await bff.get<BuildRunLogs | null>(`/components/${seg(componentId)}/builds/${seg(runId)}/logs${projectQuery}`).catch(() => null);
    rawLog = bffLogs?.build?.log ?? null;
  }
  return buildRunLogsFromTasks(run, rawLog);
}

export const fetchBuildRunLogs = (_orgHandler: string, projectId: string, componentId: string, runId: string): Promise<BuildRunLogs | null> => loadBuildRunLogs(componentId, runId, q({ projectName: projectId }));

export const fetchBuildLogs = (componentId: string, _versionId: string, workflowName: string): Promise<BuildRunLogs | null> => loadBuildRunLogs(componentId, workflowName, '');
