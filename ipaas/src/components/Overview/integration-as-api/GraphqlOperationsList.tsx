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
import { useGraphqlOperations } from '../../../hooks/useGraphqlOperations';
import { getGraphqlOperationColors } from '../../../constants/graphqlOperations';
import { resolveEndpointInvokeUrl } from '../../../utils/endpoints';
import type { EnvEndpoint } from '../../../types/component';
import OperationTile from '../_shared/bodies/OperationTile';
import GraphqlOperationDrawer from './GraphqlOperationDrawer';

interface GraphqlOperationsListProps {
  activeEndpoint?: EnvEndpoint;
  isDeploymentReady: boolean;
  envCritical: boolean;
}

/**
 * Introspects a deployed GraphQL endpoint and lists its Query / Mutation /
 * Subscription fields as operation tiles — the GraphQL counterpart of
 * {@link SwaggerOperationsList}.
 */
export default function GraphqlOperationsList({ activeEndpoint, isDeploymentReady, envCritical }: GraphqlOperationsListProps): ReactNode {
  const invokeUrl = useMemo(() => resolveEndpointInvokeUrl(activeEndpoint), [activeEndpoint]);
  const apimId = activeEndpoint?.apimId ?? null;

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
        /* surfaced via the operations error below */
      });
    return () => {
      cancelled = true;
    };
    // generateKey is a stable mutation; apimId/env/readiness drive identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apimId, envCritical, isDeploymentReady]);

  const { data: operations = [], isFetching, isError, error } = useGraphqlOperations({ invokeUrl, token: apiKey ?? '', enabled: isDeploymentReady && !!invokeUrl && !!apiKey });

  if ((!apiKey || isFetching) && operations.length === 0 && !isError) {
    return (
      <Stack alignItems="center" sx={{ py: 3 }}>
        <CircularProgress size={20} />
      </Stack>
    );
  }

  if (isError && operations.length === 0) {
    return (
      <Alert severity="error" sx={{ mt: 1.5 }}>
        {error?.message || 'Failed to fetch GraphQL schema.'}
      </Alert>
    );
  }

  if (operations.length === 0) {
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
            drawerContent={<GraphqlOperationDrawer operationName={operation.name} field={field} colors={colors} />}
          />
        ));
      })}
    </Box>
  );
}
