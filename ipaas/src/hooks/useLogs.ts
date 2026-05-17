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

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchLogs, fetchComponentLogs } from '../api/logs';
import type { LogsRequest, ComponentLogsRequest } from '../types/logs';

export function useInfiniteLogs(req: LogsRequest | null, refetchInterval: number | false = false, logsApiUrl?: string) {
  return useInfiniteQuery({
    queryKey: ['logs', req, logsApiUrl],
    queryFn: async ({ pageParam }) => {
      const pageReq = pageParam ? { ...req!, ...(req!.sort === 'desc' ? { endTime: pageParam } : { startTime: pageParam }) } : req!;
      return fetchLogs(pageReq, logsApiUrl!);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!req || lastPage.length < req.limit) return undefined;
      return lastPage[lastPage.length - 1]?.timestamp;
    },
    enabled: !!req && !!logsApiUrl,
    refetchInterval,
  });
}

export function useInfiniteComponentLogs(req: ComponentLogsRequest | null, refetchInterval: number | false = false, logsApiUrl?: string) {
  return useInfiniteQuery({
    queryKey: ['component-logs', req, logsApiUrl],
    queryFn: async ({ pageParam }) => {
      const pageReq = pageParam ? { ...req!, ...(req!.sort === 'desc' ? { endTime: pageParam } : { startTime: pageParam }) } : req!;
      return fetchComponentLogs(pageReq, logsApiUrl!);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!req || lastPage.length < req.limit) return undefined;
      return lastPage[lastPage.length - 1]?.timestamp;
    },
    enabled: !!req && !!logsApiUrl,
    refetchInterval,
  });
}
