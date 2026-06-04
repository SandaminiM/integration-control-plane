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

// TODO: implement using ICP local REST APIs

import type { GqlExecutionConfigs, TaskExecution, ExecutionLogEntry, UpdateJobConfigsInput, TriggerComponentInput } from '../../types/executions';
import type { TriggerTaskInput } from '../../types/artifact';

interface ExecutionArgument { argumentName: string; argumentValue: string }

const ni = (name: string): never => { throw new Error(`[icp] executions.${name}: not implemented`); };

export const fetchExecutionConfigs = (_componentId: string, _releaseId: string, _envId = '', _projectId = ''): Promise<GqlExecutionConfigs | null> => ni('fetchExecutionConfigs');
export const fetchTaskExecutions = (_releaseId: string, _componentId = '', _envId = '', _projectId = ''): Promise<TaskExecution[]> => ni('fetchTaskExecutions');
export const fetchExecutionArguments = (_runId: string, _componentId: string, _releaseId: string): Promise<ExecutionArgument[]> => ni('fetchExecutionArguments');
export const fetchExecutionLogs = (_componentId: string, _deploymentTrackId: string, _executionId: string, _environmentId: string): Promise<ExecutionLogEntry[]> => ni('fetchExecutionLogs');
export const fetchTaskExecutionCount = (_releaseId: string, _componentId = '', _envId = '', _projectId = ''): Promise<number | null> => ni('fetchTaskExecutionCount');
export const updateJobConfigs = (_input: UpdateJobConfigsInput): Promise<boolean> => ni('updateJobConfigs');
export const triggerTask = (_input: TriggerTaskInput): Promise<{ status: string; message: string; successCount: number; failedCount: number; details: string[] }> => ni('triggerTask');
export const triggerComponentRun = (_input: TriggerComponentInput): Promise<unknown> => ni('triggerComponentRun');
