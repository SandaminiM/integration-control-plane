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
import type { PrebuiltIntegration } from '../types/samples';

const DEFAULT_PREBUILT_INTEGRATIONS_URL = 'https://raw.githubusercontent.com/wso2/integration-samples/main/.metadata/prebuilt-integrations.json';

export interface PrebuiltIntegrationsData {
  prebuiltIntegrations: PrebuiltIntegration[];
}

export function usePrebuiltIntegrations() {
  return useQuery<PrebuiltIntegrationsData>({
    queryKey: ['prebuiltIntegrations'],
    queryFn: async ({ signal }) => {
      const url = window.API_CONFIG?.prebuiltIntegrationsUrl ?? DEFAULT_PREBUILT_INTEGRATIONS_URL;
      const response = await fetch(url, { cache: 'no-store', signal });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = (await response.json()) as { prebuiltIntegrations: PrebuiltIntegration[] };
      if (!Array.isArray(rawData?.prebuiltIntegrations)) {
        throw new Error('Invalid response format: missing prebuiltIntegrations array');
      }
      return { prebuiltIntegrations: rawData.prebuiltIntegrations };
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });
}
