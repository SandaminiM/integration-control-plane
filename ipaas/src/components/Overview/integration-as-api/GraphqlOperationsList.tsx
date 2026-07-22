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

import { Alert, Box, CircularProgress, Stack } from '@wso2/oxygen-ui';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useGenerateTestKey } from '../../../hooks/useApim';
import { useGraphqlSchema } from '../../../hooks/useGraphqlSchema';
import { parseSchema } from '../../../utils/graphqlSchema';
import type { EnvEndpoint } from '../../../types/component';
import OperationTile, { type OperationTileColors } from '../_shared/bodies/OperationTile';
import GraphqlOperationDrawer from './GraphqlOperationDrawer';

const NO_DESCRIPTION = 'No description available.';

const GRAPHQL_OPERATION_COLORS: Record<string, OperationTileColors> = {
  Query: { badgeBg: '#0095FF', badgeText: '#fff', border: '#C1E4FC', cardBg: '#F4FAFF' },
  Mutation: { badgeBg: '#36B475', badgeText: '#fff', border: '#CDF1DF', cardBg: '#F5FFF7' },
  Subscription: { badgeBg: '#7B55D5', badgeText: '#fff', border: 'rgba(123,85,213,0.28)', cardBg: 'rgba(123,85,213,0.08)' },
};
const DEFAULT_OPERATION_COLORS: OperationTileColors = { badgeBg: '#9e9e9e', badgeText: '#fff', border: '#e0e0e0', cardBg: '#f5f5f5' };

function getGraphqlOperationColors(name: string): OperationTileColors {
  return GRAPHQL_OPERATION_COLORS[name] ?? DEFAULT_OPERATION_COLORS;
}

/** Resolve the live invoke URL for a GraphQL endpoint by its network visibility. */
function resolveGraphqlUrl(endpoint?: EnvEndpoint): string {
  if (!endpoint) return '';
  const visibilities = endpoint.networkVisibilities ?? [];
  let base = '';
  if (visibilities.includes('Public')) base = endpoint.publicUrl ?? '';
  else if (visibilities.includes('Organization')) base = endpoint.organizationUrl ?? endpoint.defaultOrganizationUrl ?? '';
  else base = endpoint.projectUrl ?? '';
  if (!base) base = endpoint.publicUrl ?? endpoint.defaultPublicUrl ?? endpoint.organizationUrl ?? endpoint.projectUrl ?? '';
  return base.replace(/\/+$/, '');
}

interface GraphqlOperationsListProps {
  activeEndpoint?: EnvEndpoint;
  isDeploymentReady: boolean;
  envCritical: boolean;
}

/**
 * Introspects a deployed GraphQL endpoint and lists its Query / Mutation /
 * Subscription fields as operation tiles — the GraphQL counterpart of
 * {@link SwaggerOperationsList}, mirroring devant's `GraphQLSchemaCard`.
 * Mints a test key for the endpoint's APIM API (as the MCP overview does),
 * then renders each field with a details drawer.
 */
export default function GraphqlOperationsList({ activeEndpoint, isDeploymentReady, envCritical }: GraphqlOperationsListProps): ReactNode {
  const invokeUrl = useMemo(() => resolveGraphqlUrl(activeEndpoint), [activeEndpoint]);
  const apimId = activeEndpoint?.apimId ?? null;

  // Mint a test key for the introspection request (same flow as the MCP overview).
  const generateKey = useGenerateTestKey();
  const [apiKey, setApiKey] = useState<string | null>(null);
  useEffect(() => {
    if (!apimId || !isDeploymentReady) return undefined;
    let cancelled = false;
    generateKey
      .mutateAsync({ apimId, keyType: envCritical ? 'Production' : 'Development' })
      .then((r) => {
        if (!cancelled) setApiKey(r?.apikey ?? null);
      })
      .catch(() => {
        /* surfaced via the schema error below */
      });
    return () => {
      cancelled = true;
    };
    // generateKey is a stable mutation; apimId/env/readiness drive identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apimId, envCritical, isDeploymentReady]);

  const { data: schema, isFetching, isError, error } = useGraphqlSchema({ invokeUrl, token: apiKey ?? '', enabled: isDeploymentReady && !!invokeUrl && !!apiKey });

  const operations = useMemo(() => (schema ? parseSchema(schema, NO_DESCRIPTION) : []), [schema]);

  if (!isDeploymentReady) {
    return (
      <Alert severity="info" sx={{ mt: 1.5 }}>
        Deploy to visualize the GraphQL schema.
      </Alert>
    );
  }

  if ((!apiKey || isFetching) && !schema && !isError) {
    return (
      <Stack alignItems="center" sx={{ py: 3 }}>
        <CircularProgress size={20} />
      </Stack>
    );
  }

  if (isError && !schema) {
    return (
      <Alert severity="error" sx={{ mt: 1.5 }}>
        {error?.message || 'Failed to fetch GraphQL schema.'}
      </Alert>
    );
  }

  if (!schema || operations.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 1.5 }}>
        No GraphQL operations found.
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 1.5 }}>
      {operations.map((operation) => {
        const colors = getGraphqlOperationColors(operation.name);
        return operation.fields.map((field) => (
          <OperationTile
            key={`${operation.name}-${field.name}`}
            badgeLabel={operation.name}
            label={field.name}
            colors={colors}
            drawerContent={<GraphqlOperationDrawer operationName={operation.name} field={field} colors={colors} schema={schema} />}
          />
        ));
      })}
    </Box>
  );
}
