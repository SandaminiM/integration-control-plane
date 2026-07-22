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

/** Badge/tile colours per GraphQL operation type — mirrors the shape of `getHttpMethodColors`. */
export interface GraphqlOperationColors {
  badgeBg: string;
  badgeText: string;
  border: string;
  cardBg: string;
}

const GRAPHQL_OPERATION_COLORS: Record<string, GraphqlOperationColors> = {
  Query: { badgeBg: '#0095FF', badgeText: '#fff', border: '#C1E4FC', cardBg: '#F4FAFF' },
  Mutation: { badgeBg: '#36B475', badgeText: '#fff', border: '#CDF1DF', cardBg: '#F5FFF7' },
  Subscription: { badgeBg: '#7B55D5', badgeText: '#fff', border: 'rgba(123,85,213,0.28)', cardBg: 'rgba(123,85,213,0.08)' },
};

const DEFAULT_GRAPHQL_OPERATION_COLORS: GraphqlOperationColors = { badgeBg: '#9e9e9e', badgeText: '#fff', border: '#e0e0e0', cardBg: '#f5f5f5' };

export function getGraphqlOperationColors(operationName: string): GraphqlOperationColors {
  return GRAPHQL_OPERATION_COLORS[operationName] ?? DEFAULT_GRAPHQL_OPERATION_COLORS;
}
