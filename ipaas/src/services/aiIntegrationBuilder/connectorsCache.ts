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

import type { BallerinaConnector } from './types';
import { createStorageCache } from './storageCache';

const CONNECTORS_QUERY = `{
  ballerina: packages(orgName: "ballerina", limit: 100, offset: 0) {
    packages { organization name summary }
  }
  ballerinax: packages(orgName: "ballerinax", limit: 1000, offset: 0) {
    packages { organization name summary }
  }
}`;

const cache = createStorageCache<BallerinaConnector[]>({
  storageKey: 'ai-integration-builder-connectors-cache',
  ttlMs: 60 * 60 * 1000, // 1 hour
  validate: (data) => Array.isArray(data),
});

async function fetchFromCentral(): Promise<{ data: BallerinaConnector[] }> {
  const graphqlUrl = window.API_CONFIG.integrationBuilderCentralGraphqlUrl;
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: CONNECTORS_QUERY }),
  });

  if (!response.ok) {
    throw new Error(`Ballerina Central API error (${response.status})`);
  }

  const { data, errors } = await response.json();
  if (Array.isArray(errors) && errors.length > 0) {
    throw new Error(`Ballerina Central GraphQL error: ${JSON.stringify(errors)}`);
  }

  const connectors: BallerinaConnector[] = [...(data?.ballerina?.packages ?? []), ...(data?.ballerinax?.packages ?? [])];

  return { data: connectors };
}

/** Full Ballerina connector catalog for the feasibility check; cached 1h in memory + localStorage. */
export function getConnectors(): Promise<BallerinaConnector[]> {
  return cache.get(() => fetchFromCentral());
}

/** Force-clear cache (useful for testing or manual refresh) */
export function clearConnectorsCache(): void {
  cache.clear();
}
