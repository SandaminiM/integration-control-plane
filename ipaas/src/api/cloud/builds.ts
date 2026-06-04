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
 * Cloud (OpenChoreo) build-log API. Calls the ipaas-service BFF.
 *
 * The build card's stepper needs per-stage status + steps, but the BFF logs
 * endpoint (GET /components/{name}/builds/{runId}/logs) only carries raw
 * build-stage log text — its stage status/steps are empty. The real per-step
 * progress lives in the WorkflowRun's tasks (GET /components/{name}/builds/{runId},
 * each task has a phase), so we fetch the run and synthesize the BuildRunLogs
 * (init/build/deploy) from its task phases, folding in the log text when present.
 */

import type { BuildRunLogs, BuildStage, BuildStep } from '../../types/build';
import { bff, q, seg } from './_client';

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
  tasks?: BffWorkflowTask[];
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

// Fetch the run (for task phases → steps) and its logs (best-effort) and
// synthesize the BuildRunLogs the stepper consumes. The build run is required;
// a logs 503 (observability not configured) just drops the log text.
async function loadBuildRunLogs(componentId: string, runId: string, projectQuery: string): Promise<BuildRunLogs | null> {
  const [run, rawLogs] = await Promise.all([
    bff.get<BffBuildRun | null>(`/components/${seg(componentId)}/builds/${seg(runId)}${projectQuery}`).catch(() => null),
    bff.get<BuildRunLogs | null>(`/components/${seg(componentId)}/builds/${seg(runId)}/logs${projectQuery}`).catch(() => null),
  ]);
  if (!run) return null;
  return buildRunLogsFromTasks(run, rawLogs?.build?.log ?? null);
}

export const fetchBuildRunLogs = (_orgHandler: string, projectId: string, componentId: string, runId: string): Promise<BuildRunLogs | null> =>
  loadBuildRunLogs(componentId, runId, q({ projectName: projectId }));

export const fetchBuildLogs = (componentId: string, _versionId: string, workflowName: string): Promise<BuildRunLogs | null> =>
  loadBuildRunLogs(componentId, workflowName, '');
