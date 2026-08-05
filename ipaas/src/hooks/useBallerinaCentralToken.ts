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

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { IS_CLOUD } from '../features';
import type { BallerinaCentralTokenStatus } from '../types/packageRegistries';

const ROOT_KEY = 'ballerinaCentralToken';

/**
 * Ballerina Central access token status for the org.
 *
 * Cloud-exclusive surface (see src/api/cloud/packageRegistries.ts). The query
 * is gated `enabled: IS_CLOUD` so wip/icp never fetch, and the cloud module is
 * loaded lazily inside queryFn/mutationFn (not through `#api`) so it stays out
 * of the non-cloud bundles entirely — same pattern as useBillingOrg.
 */
export function useBallerinaCentralToken(): UseQueryResult<BallerinaCentralTokenStatus> {
  return useQuery<BallerinaCentralTokenStatus>({
    queryKey: [ROOT_KEY],
    queryFn: async () => {
      const { fetchBallerinaCentralToken } = await import('../api/cloud/packageRegistries');
      return fetchBallerinaCentralToken();
    },
    enabled: IS_CLOUD,
  });
}

export function useSaveBallerinaCentralToken() {
  const qc = useQueryClient();
  return useMutation<BallerinaCentralTokenStatus, Error, string>({
    mutationFn: async (token) => {
      const { saveBallerinaCentralToken } = await import('../api/cloud/packageRegistries');
      return saveBallerinaCentralToken(token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROOT_KEY] }),
  });
}

export function useRemoveBallerinaCentralToken() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const { removeBallerinaCentralToken } = await import('../api/cloud/packageRegistries');
      return removeBallerinaCentralToken();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROOT_KEY] }),
  });
}
