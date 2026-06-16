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

import { Alert, Box, Button, CircularProgress, Divider, Stack, Typography } from '@wso2/oxygen-ui';
import { MCP } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useEnvEndpoints } from '../../../hooks/useDeployments';
import { useGenerateTestKey } from '../../../hooks/useApim';
import { useMcpTools } from '../../../hooks/useMcpTools';
import type { EnvCardBodyProps } from '../../../types/integration';
import EnvCardSkeleton from '../_shared/EnvCardSkeleton';
import EndpointUrlsPanel from '../_shared/EndpointUrlsPanel';
import McpToolTile from './McpToolTile';

/**
 * MCP Server env-card body: the list of tools the deployed MCP server exposes.
 *
 * Discovers the deployed endpoint (with an APIM id), generates a test key for
 * it, then lists tools over the MCP SDK (`useMcpTools`) — mirroring devant's
 * MCP overview, which replaces the swagger/operations view with a tools list.
 * Shared by both MCP flavors (server-from-source and proxy) via the registry.
 */
export default function EnvCardBody({ component, env, versionId, releaseId, hasDeployment, loadingDeployment }: EnvCardBodyProps): ReactNode {
  const { data: endpoints = [] } = useEnvEndpoints(component.id, versionId, releaseId);

  // Default to the MCP-capable endpoint (one with a public URL + APIM id — the
  // test key is minted per APIM API, and tools are listed at `${publicUrl}/mcp`),
  // but let the user switch endpoints in the panel.
  const mcpIdx = useMemo(() => {
    const i = endpoints.findIndex((e) => e.publicUrl && e.apimId);
    return i >= 0 ? i : 0;
  }, [endpoints]);
  const [selectedEpIdx, setSelectedEpIdx] = useState<number | null>(null);
  const activeIdx = selectedEpIdx ?? mcpIdx;
  const activeEndpoint = endpoints[activeIdx] ?? endpoints[0];
  const baseUrl = activeEndpoint?.publicUrl ?? '';
  const apimId = activeEndpoint?.apimId ?? null;

  // Test key for the `test-key` header (same flow as the AI agent chat).
  const generateKey = useGenerateTestKey();
  const [apiKey, setApiKey] = useState<string | null>(null);
  useEffect(() => {
    if (!apimId) return undefined;
    let cancelled = false;
    generateKey
      .mutateAsync({ apimId, keyType: env.critical ? 'Production' : 'Development' })
      .then((r) => {
        if (!cancelled) setApiKey(r?.apikey ?? null);
      })
      .catch(() => {
        /* surfaced via the tools error below */
      });
    return () => {
      cancelled = true;
    };
    // generateKey is a stable mutation; apimId/env drive identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apimId, env.critical]);

  const { tools, isLoading, error, isForbidden, refetch } = useMcpTools({ baseUrl, apiKey, enabled: hasDeployment && !!baseUrl });

  if (loadingDeployment) return <EnvCardSkeleton />;

  if (!hasDeployment) {
    return (
      <>
        <Divider sx={{ my: 2 }} />
        <Stack alignItems="center" justifyContent="center" gap={1} sx={{ py: 4 }}>
          <MCP size={24} style={{ opacity: 0.4 }} />
          <Typography variant="body2" color="text.secondary">
            Deploy this MCP server to view its tools.
          </Typography>
        </Stack>
      </>
    );
  }

  const showEndpointPanel = hasDeployment && !!endpoints.length;

  return (
    <>
      <Divider sx={{ my: 2 }} />

      {showEndpointPanel && <EndpointUrlsPanel endpoints={endpoints} selectedIdx={activeIdx} onSelect={setSelectedEpIdx} componentId={component.id} deploymentTrackId={versionId} />}

      {isLoading && (
        <Stack alignItems="center" sx={{ py: 3 }}>
          <CircularProgress size={20} />
        </Stack>
      )}

      {!isLoading && error && (
        <Alert
          severity={isForbidden ? 'warning' : 'error'}
          action={
            isForbidden ? undefined : (
              <Button color="inherit" size="small" onClick={refetch}>
                Retry
              </Button>
            )
          }>
          {isForbidden ? "You don't have permission to view this MCP server's tools." : 'Failed to fetch MCP tools.'}
        </Alert>
      )}

      {!isLoading && !error && tools.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No tools available.
        </Typography>
      )}

      {!isLoading && !error && tools.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          {tools.map((tool) => (
            <McpToolTile key={tool.name} tool={tool} />
          ))}
        </Box>
      )}
    </>
  );
}
