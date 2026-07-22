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
import { buildClientSchema, getIntrospectionQuery, type GraphQLSchema } from 'graphql';

interface UseGraphqlSchemaParams {
  /** Live GraphQL endpoint URL (base + apiContext). */
  invokeUrl: string;
  /** Test key minted for the endpoint's APIM API (`test-key` header). */
  token: string;
  enabled: boolean;
}

/**
 * Introspects a deployed GraphQL endpoint and builds a client schema — the
 * counterpart of devant's `useGraphQLSchema`/`getSchema`. The request hits the
 * running data-plane endpoint (not the console API), authenticated with the
 * `test-key` header, so this lives in react-query rather than the api layer.
 */
export function useGraphqlSchema({ invokeUrl, token, enabled }: UseGraphqlSchemaParams) {
  return useQuery<GraphQLSchema, Error>({
    queryKey: ['graphqlSchema', invokeUrl],
    queryFn: async () => {
      const result = await fetch(invokeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'test-key': token },
        body: JSON.stringify({ query: getIntrospectionQuery() }),
      });

      if (!result.ok) {
        if (result.status === 404) throw new Error('Request URL not found.');
        if (result.status === 401 || result.status === 403) throw new Error('Invalid or expired token. Please refresh the card.');
        if (result.status === 503) throw new Error('Integration deployment is suspended. Redeploy to visualize the schema.');
        throw new Error(`Unexpected HTTP status code ${result.status} received`);
      }

      const body = await result.json();
      // eslint-disable-next-line no-underscore-dangle
      if (!body?.data?.__schema) throw new Error('Invalid response received');
      return buildClientSchema(body.data);
    },
    enabled: enabled && Boolean(invokeUrl && token),
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
