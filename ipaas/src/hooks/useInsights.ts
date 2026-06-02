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
import { fetchComponentInsights, fetchInsightsEnvironments } from '#api/insights';
import type { InsightsEnvironment } from '../types/insights';

export function useInsightsEnvironments(orgUuid: string, projectId: string) {
  return useQuery({
    queryKey: ['insightsEnvironments', orgUuid, projectId],
    queryFn: () => fetchInsightsEnvironments(orgUuid, projectId),
    enabled: !!orgUuid && !!projectId,
    staleTime: 5 * 60_000,
  });
}

export function useComponentInsights(orgUuid: string, insightsEnv: InsightsEnvironment | null, apiId: string) {
  return useQuery({
    queryKey: ['componentInsights', orgUuid, insightsEnv?.id ?? null, apiId],
    queryFn: () => fetchComponentInsights(orgUuid, insightsEnv!, apiId),
    enabled: !!orgUuid && !!insightsEnv && !!apiId,
    refetchInterval: 10_000,
  });
}
