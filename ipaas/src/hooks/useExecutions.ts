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

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchExecutionConfigs, fetchTaskExecutions, fetchExecutionArguments, fetchExecutionLogs, fetchTaskExecutionCount, updateJobConfigs, triggerTask, triggerComponentRun } from '#api/executions';
import type { UpdateJobConfigsInput, TriggerComponentInput } from '../types/executions';
import type { TriggerTaskInput } from '../types/artifact';

// envId/projectId are needed by the cloud (OpenChoreo) product, which keys
// schedules + executions per environment; the devant backend keys by releaseId
// and ignores them. The enable guard accepts either key so both products fetch.
export function useExecutionConfigs(componentId: string, releaseId: string, envId = '', projectId = '') {
  return useQuery({
    queryKey: ['executionConfigs', componentId, releaseId, envId, projectId],
    queryFn: () => fetchExecutionConfigs(componentId, releaseId, envId, projectId),
    enabled: !!componentId && (!!releaseId || !!envId),
    retry: false,
  });
}

export function useTaskExecutions(releaseId: string, componentId = '', envId = '', projectId = '') {
  return useQuery({
    queryKey: ['taskExecutions', releaseId, componentId, envId, projectId],
    queryFn: () => fetchTaskExecutions(releaseId, componentId, envId, projectId),
    enabled: !!releaseId || (!!componentId && !!envId),
    retry: false,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

export function useExecutionArguments(runId: string, componentId: string, releaseId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['executionArguments', runId, componentId, releaseId],
    queryFn: () => fetchExecutionArguments(runId, componentId, releaseId),
    enabled: enabled && !!runId && !!componentId && !!releaseId,
    retry: false,
    staleTime: 60000,
  });
}

export function useExecutionLogs(componentId: string, deploymentTrackId: string, executionId: string, environmentId: string, enabled: boolean) {
  const baseUrl = window.API_CONFIG?.systemApisBaseUrl ?? '';
  return useQuery({
    queryKey: ['executionLogs', componentId, deploymentTrackId, executionId, environmentId, baseUrl],
    queryFn: () => fetchExecutionLogs(componentId, deploymentTrackId, executionId, environmentId),
    enabled: enabled && !!baseUrl && !!componentId && !!deploymentTrackId && !!executionId && !!environmentId,
    retry: false,
    staleTime: 30000,
  });
}

export function useTaskExecutionCount(releaseId: string, componentId = '', envId = '', projectId = '') {
  return useQuery({
    queryKey: ['taskExecutionCount', releaseId, componentId, envId, projectId],
    queryFn: () => fetchTaskExecutionCount(releaseId, componentId, envId, projectId),
    enabled: !!releaseId || (!!componentId && !!envId),
    retry: false,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useUpdateJobConfigs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateJobConfigsInput) => updateJobConfigs(input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['executionConfigs', input.componentId] });
    },
  });
}

export function useTriggerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TriggerTaskInput) => triggerTask(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artifacts', 'Task'] });
    },
  });
}

export function useTriggerComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TriggerComponentInput) => triggerComponentRun(input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ['taskExecutions', input.releaseId] });
    },
  });
}
