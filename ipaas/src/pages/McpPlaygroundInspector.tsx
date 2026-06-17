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

import { Box, MenuItem, Select, Stack, Typography } from '@wso2/oxygen-ui';
import { FlaskConical } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useMemo, useState, type JSX } from 'react';
// The MCP playground UI ships in the optional `@wso2-org/mcp-playground` package.
// It's commented out so the app builds without the dependency installed. To enable:
//   1. npm install @wso2-org/mcp-playground
//   2. uncomment the import below and the <MCPInspector /> usage further down
//   3. set isPlaygroundEnabled = true in McpTest.tsx
// import MCPInspector from '@wso2-org/mcp-playground';
import ComingSoon from './ComingSoon';
import DeploymentTrackBar from '../components/DeploymentTrackBar';
import { useGenerateTestKey } from '../hooks/useApim';
import { useComponentByHandler } from '../hooks/useComponents';
import { useComponentDeployment, useEnvEndpoints } from '../hooks/useDeployments';
import { useEnvironments } from '../hooks/useEnvironments';
import { useOrgUuid } from '../hooks/useOrgUuid';
import { useProjectId } from '../hooks/useProjects';
import type { ComponentScope } from '../nav';

const TEST_KEY_HEADER = 'test-key';

/**
 * The actual MCP playground — embeds `@wso2-org/mcp-playground`'s `MCPInspector`
 * (the component devant uses) pointed at the deployed MCP endpoint for the
 * selected environment, with a freshly minted `test-key`.
 *
 * This file statically imports the optional `@wso2-org/mcp-playground` package,
 * so it is **only** loaded (via `React.lazy`) when `isPlaygroundEnabled` is true
 * in {@link McpTest} — keeping the package out of the build graph while the
 * feature is disabled / the dependency isn't installed.
 */
export default function McpPlaygroundInspector({ scope }: { scope: ComponentScope }): JSX.Element {
  const orgUuid = useOrgUuid() ?? '';
  const { projectId, project } = useProjectId(scope.project);
  const { data: component } = useComponentByHandler(projectId, scope.component);
  const isMcp = component?.componentSubType === 'MCP';

  const { data: environments = [] } = useEnvironments(scope.org, projectId);

  // Deployment track (default latest).
  const tracks = useMemo(() => component?.deploymentTracks ?? [], [component?.deploymentTracks]);
  const [selectedTrackId, setSelectedTrackId] = useState('');
  useEffect(() => {
    if (!tracks.length) return;
    setSelectedTrackId((prev) => (prev && tracks.some((t) => t.id === prev) ? prev : (tracks.find((t) => t.latest)?.id ?? tracks[0].id)));
  }, [component?.id, tracks]);

  // Environment selection.
  const [selectedEnvId, setSelectedEnvId] = useState('');
  useEffect(() => {
    if (!environments.length) return;
    setSelectedEnvId((prev) => (prev && environments.some((e) => e.id === prev) ? prev : environments[0].id));
  }, [environments]);
  const selectedEnv = environments.find((e) => e.id === selectedEnvId) ?? null;

  // Deployment → releaseId → endpoints for the selected env + track.
  const { data: deployment } = useComponentDeployment(component ? scope.org : '', component ? orgUuid : '', component?.id ?? '', selectedTrackId, selectedEnv?.id ?? '');
  const releaseId = deployment?.releaseId ?? '';
  const { data: endpoints = [] } = useEnvEndpoints(component?.id ?? '', selectedTrackId, releaseId);

  // The MCP endpoint: first reachable one with an APIM id (tools live at `${publicUrl}/mcp`).
  const mcpEndpoint = useMemo(() => endpoints.find((e) => e.publicUrl && e.apimId) ?? null, [endpoints]);
  const baseUrl = mcpEndpoint?.publicUrl ?? '';
  const mcpUrl = baseUrl ? `${baseUrl}/mcp` : '';
  const apimId = mcpEndpoint?.apimId ?? null;

  // Mint a test key for the selected environment (sent as the `test-key` header).
  const generateKey = useGenerateTestKey();
  const [token, setToken] = useState('');
  const [tokenFetching, setTokenFetching] = useState(false);
  useEffect(() => {
    if (!apimId) {
      setToken('');
      return undefined;
    }
    let cancelled = false;
    setTokenFetching(true);
    generateKey
      .mutateAsync({ apimId, keyType: selectedEnv?.critical ? 'Production' : 'Development' })
      .then((r) => {
        if (!cancelled) setToken(r?.apikey ?? '');
      })
      .catch(() => {
        if (!cancelled) setToken('');
      })
      .finally(() => {
        if (!cancelled) setTokenFetching(false);
      });
    return () => {
      cancelled = true;
    };
    // generateKey is a stable mutation; apimId/env drive identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apimId, selectedEnv?.critical]);

  // Non-MCP components keep this route's previous Coming Soon behaviour.
  if (component && !isMcp) {
    return <ComingSoon title="Coming Soon" description="Testing tools are currently under development." />;
  }

  const envSelector = environments.length > 0 && (
    <Select
      size="small"
      value={selectedEnvId}
      onChange={(e) => setSelectedEnvId(e.target.value as string)}
      inputProps={{ 'aria-label': 'Environment' }}
      sx={{ fontSize: '0.8125rem', '& .MuiOutlinedInput-notchedOutline': { borderRadius: 5 }, '& .MuiSelect-select': { py: 0.5, px: 1.5 }, minWidth: 140 }}>
      {environments.map((env) => (
        <MenuItem key={env.id} value={env.id}>
          {env.name}
        </MenuItem>
      ))}
    </Select>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {tracks.length > 0 && <DeploymentTrackBar tracks={tracks} selectedId={selectedTrackId} onChange={setSelectedTrackId} orgHandler={scope.org} projectHandler={project?.handler ?? scope.project} componentHandler={scope.component} extra={envSelector} />}

      <Box sx={{ flex: 1, minHeight: 0 }}>
        {mcpUrl ? (
          // Live playground — enable by installing @wso2-org/mcp-playground and
          // replacing the placeholder below with this usage:
          // <MCPInspector url={mcpUrl} token={token} headerName={TEST_KEY_HEADER} isTokenFetching={tokenFetching} shouldSetHeaderNameExternally={false} />
          <Stack alignItems="center" justifyContent="center" gap={1} sx={{ height: '100%', px: 3 }}>
            <FlaskConical size={28} style={{ opacity: 0.4 }} />
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              MCP playground endpoint is ready ({tokenFetching ? 'fetching key…' : token ? 'key ready' : 'no key'}, header <code>{TEST_KEY_HEADER}</code>).
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {mcpUrl}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              Install <code>@wso2-org/mcp-playground</code> to render the interactive inspector here.
            </Typography>
          </Stack>
        ) : (
          <Stack alignItems="center" justifyContent="center" gap={1.5} sx={{ height: '100%', px: 3 }}>
            <FlaskConical size={28} style={{ opacity: 0.4 }} />
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Deploy this MCP server to {environments.length > 1 ? 'the selected environment' : 'an environment'} to test its tools here.
            </Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
