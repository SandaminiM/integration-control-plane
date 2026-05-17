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

import { useQuery } from '@tanstack/react-query';
import { fetchBuildLogs, fetchBuildRunLogs } from '../api/builds';

export function useBuildLogs(componentId: string, versionId: string, workflowName: string, isInProgress: boolean) {
  return useQuery({
    queryKey: ['buildLogs', componentId, versionId, workflowName],
    queryFn: () => fetchBuildLogs(componentId, versionId, workflowName),
    enabled: !!componentId && !!versionId && !!workflowName,
    refetchInterval: isInProgress ? 5000 : false,
  });
}

export function useBuildRunLogs(orgHandler: string, projectId: string, componentId: string, runId: string, enabled: boolean, isInProgress: boolean) {
  return useQuery({
    queryKey: ['buildRunLogs', orgHandler, projectId, componentId, runId],
    queryFn: () => fetchBuildRunLogs(orgHandler, projectId, componentId, runId),
    enabled: enabled && !!orgHandler && !!projectId && !!componentId && !!runId,
    refetchInterval: isInProgress ? 5000 : false,
  });
}
