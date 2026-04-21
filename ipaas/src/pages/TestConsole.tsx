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

import { Autocomplete, Box, Button, CircularProgress, Divider, IconButton, InputAdornment, MenuItem, OutlinedInput, PageContent, Select, Stack, TextField, Tooltip, Typography } from '@wso2/oxygen-ui';
import { ArrowLeft, Check, Copy, Eye, EyeOff, Key } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useMemo, useState, type JSX } from 'react';
import { useNavigate } from 'react-router';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { fetchApimSwagger, fetchTestSession, type TestSession } from '../api/apim';
import { useComponentByHandler, useComponentDeployment, useEnvEndpoints, useEnvironments, useProject, useProjectByHandler, useProjects, type GqlEnvEndpoint } from '../api/queries';
import { useAuth } from '../auth/AuthContext';
import { getOrgUuidFromToken } from '../auth/tokenManager';
import DeploymentTrackBar from '../components/DeploymentTrackBar';
import NotFound from '../components/NotFound';
import { broaden, resourceUrl, type ComponentScope } from '../nav';
import { componentOverviewUrl } from '../paths';
import { UUID_RE } from '../utils/string';

interface VisibilityOption {
  label: string;
  url: string;
}

function getVisibilityOptions(endpoint: GqlEnvEndpoint): VisibilityOption[] {
  const opts: VisibilityOption[] = [];
  if (endpoint.publicUrl) opts.push({ label: 'Public', url: endpoint.publicUrl });
  if (endpoint.organizationUrl) opts.push({ label: 'Organization', url: endpoint.organizationUrl });
  if (endpoint.projectUrl) opts.push({ label: 'Project', url: endpoint.projectUrl });
  if (opts.length === 0 && endpoint.invokeUrl) opts.push({ label: 'Public', url: endpoint.invokeUrl });
  return opts;
}

// Hides SwaggerUI top chrome — keeps only the operations list with try-it-out
const HideTopPlugin = () => ({
  components: {
    InfoContainer: () => null,
    Info: () => null,
    Servers: () => null,
    ServersContainer: () => null,
    SchemesContainer: () => null,
    AuthorizeBtn: () => null,
    AuthorizeBtnContainer: () => null,
  },
});

export default function TestConsole(scope: ComponentScope): JSX.Element {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const orgUuid = getOrgUuidFromToken() ?? '';

  // Project resolution with fallback (same pattern as Component.tsx)
  const isUuid = UUID_RE.test(scope.project);
  const { data: projectByHandler } = useProjectByHandler(!isUuid ? scope.project : '');
  const { data: projectById } = useProject(isUuid ? scope.project : '');
  const { data: allProjects = [] } = useProjects();
  const projectFromList = !isUuid ? (allProjects.find((p) => p.handler === scope.project) ?? null) : null;
  const project = isUuid ? projectById : (projectByHandler ?? projectFromList ?? undefined);
  const projectId = project?.id ?? '';

  // Component + environments
  const { data: component, isLoading: loadingComponent } = useComponentByHandler(projectId, scope.component);
  const { data: environments = [] } = useEnvironments(scope.org, projectId);

  // Deployment track selection (default to latest)
  const tracks = useMemo(() => component?.deploymentTracks ?? [], [component?.deploymentTracks]);
  const [selectedTrackId, setSelectedTrackId] = useState('');
  useEffect(() => {
    if (!tracks.length) return;
    setSelectedTrackId((prev) => {
      if (prev && tracks.some((t) => t.id === prev)) return prev;
      return tracks.find((t) => t.latest)?.id ?? tracks[0].id;
    });
  }, [component?.id, tracks]);

  // Environment tab selection
  const [selectedEnvIdx, setSelectedEnvIdx] = useState(0);
  const selectedEnv = environments[selectedEnvIdx] ?? null;

  // Deployment for selected env (provides releaseId)
  const { data: deployment } = useComponentDeployment(component ? scope.org : '', component ? orgUuid : '', component?.id ?? '', selectedTrackId, selectedEnv?.id ?? '');
  const releaseId = deployment?.releaseId ?? '';

  // Endpoints for the selected env + track
  const { data: endpoints = [], isLoading: loadingEndpoints } = useEnvEndpoints(component?.id ?? '', selectedTrackId, releaseId);

  // Selected endpoint
  const [selectedEndpointId, setSelectedEndpointId] = useState('');
  useEffect(() => {
    if (endpoints.length > 0 && (!selectedEndpointId || !endpoints.find((e) => e.id === selectedEndpointId))) {
      setSelectedEndpointId(endpoints[0].id);
    }
  }, [endpoints, selectedEndpointId]);
  const selectedEndpoint = endpoints.find((e) => e.id === selectedEndpointId) ?? null;

  // Visibility options for selected endpoint
  const visibilityOptions = selectedEndpoint ? getVisibilityOptions(selectedEndpoint) : [];
  const [selectedVisibility, setSelectedVisibility] = useState<VisibilityOption | null>(null);
  useEffect(() => {
    setSelectedVisibility(visibilityOptions[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEndpointId]);
  const invokeUrl = selectedVisibility?.url ?? '';

  // Security header / test key
  const [securityHeader, setSecurityHeader] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [fetchingKey, setFetchingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const handleGetTestKey = async () => {
    if (!component?.id || !selectedEnv?.id || !selectedEndpointId || !userId) return;
    setFetchingKey(true);
    setKeyError(null);
    try {
      const session: TestSession | null = await fetchTestSession(component.id, selectedEnv.id, selectedEndpointId, userId);
      if (session?.sessionId) {
        setSecurityHeader(session.sessionId);
      } else {
        setKeyError('No test session available. Please check your permissions.');
      }
    } catch {
      setKeyError('Failed to fetch test key.');
    } finally {
      setFetchingKey(false);
    }
  };

  // Swagger spec for selected endpoint
  const [swagger, setSwagger] = useState<unknown>(null);
  const [loadingSwagger, setLoadingSwagger] = useState(false);
  useEffect(() => {
    if (!selectedEndpoint?.apimId) {
      setSwagger(null);
      return;
    }
    setLoadingSwagger(true);
    fetchApimSwagger(selectedEndpoint.apimId)
      .then(setSwagger)
      .catch(() => setSwagger(null))
      .finally(() => setLoadingSwagger(false));
  }, [selectedEndpoint?.apimId]);

  if (loadingComponent) {
    return (
      <PageContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </PageContent>
    );
  }

  if (!component) {
    return <NotFound message="Component not found" backTo={resourceUrl(broaden(scope)!, 'overview')} backLabel="Back to Project" />;
  }

  const envSelector = environments.length > 0 && (
    <Select
      size="small"
      value={selectedEnvIdx}
      onChange={(e) => {
        setSelectedEnvIdx(e.target.value as number);
        setSelectedEndpointId('');
      }}
      inputProps={{ 'aria-label': 'Environment' }}
      sx={{
        fontSize: '0.8125rem',
        '& .MuiOutlinedInput-notchedOutline': { borderRadius: 5 },
        '& .MuiSelect-select': { py: 0.5, px: 1.5 },
        minWidth: 140,
      }}>
      {environments.map((env, i) => (
        <MenuItem key={env.id} value={i}>
          {env.name}
        </MenuItem>
      ))}
    </Select>
  );

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', flex: 1 }}>
      {tracks.length > 0 && <DeploymentTrackBar tracks={tracks} selectedId={selectedTrackId} onChange={setSelectedTrackId} orgHandler={scope.org} projectHandler={project?.handler ?? scope.project} componentHandler={component.handler} extra={envSelector} />}

      <PageContent>
        <Button variant="text" size="small" startIcon={<ArrowLeft size={16} />} onClick={() => navigate(componentOverviewUrl(scope.org, project?.handler ?? scope.project, component.handler))} sx={{ mb: 2, textTransform: 'none' }}>
          Back to Overview
        </Button>

        {/* Controls panel */}
        <Box sx={{ maxWidth: 720, mb: 3 }}>
          <Stack direction="column" gap={2}>
            {/* Endpoint */}
            <Stack direction="row" alignItems="center" gap={2}>
              <Typography variant="body2" sx={{ minWidth: 140, fontWeight: 500, color: 'text.secondary' }}>
                Endpoint
              </Typography>
              {loadingEndpoints ? (
                <CircularProgress size={20} />
              ) : (
                <Autocomplete
                  size="small"
                  options={endpoints}
                  getOptionLabel={(ep) => ep.displayName}
                  value={selectedEndpoint}
                  onChange={(_, ep) => {
                    if (ep) setSelectedEndpointId(ep.id);
                  }}
                  disableClearable
                  sx={{ minWidth: 220 }}
                  renderInput={(params) => <TextField {...params} />}
                />
              )}
            </Stack>

            {/* Visibility */}
            {visibilityOptions.length > 0 && (
              <Stack direction="row" alignItems="center" gap={2}>
                <Typography variant="body2" sx={{ minWidth: 140, fontWeight: 500, color: 'text.secondary' }}>
                  Visibility
                </Typography>
                <Autocomplete
                  size="small"
                  options={visibilityOptions}
                  getOptionLabel={(v) => v.label}
                  value={selectedVisibility}
                  onChange={(_, v) => setSelectedVisibility(v)}
                  disableClearable
                  sx={{ minWidth: 180 }}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Stack>
            )}

            {/* Invoke URL */}
            {invokeUrl && (
              <Stack direction="row" alignItems="center" gap={2}>
                <Typography variant="body2" sx={{ minWidth: 140, fontWeight: 500, color: 'text.secondary' }}>
                  Invoke URL
                </Typography>
                <OutlinedInput
                  size="small"
                  value={invokeUrl}
                  readOnly
                  sx={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}
                  endAdornment={
                    <InputAdornment position="end">
                      <Tooltip title={urlCopied ? 'Copied!' : 'Copy to Clipboard'}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(invokeUrl);
                            setUrlCopied(true);
                            setTimeout(() => setUrlCopied(false), 2000);
                          }}>
                          {urlCopied ? <Check size={16} /> : <Copy size={16} />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  }
                />
              </Stack>
            )}

            {/* Security Header */}
            <Stack direction="row" alignItems="flex-start" gap={2}>
              <Typography variant="body2" sx={{ minWidth: 140, fontWeight: 500, color: 'text.secondary', pt: 1 }}>
                Security Header
              </Typography>
              <Stack direction="column" gap={0.5} sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <OutlinedInput
                    size="small"
                    type={showKey ? 'text' : 'password'}
                    value={securityHeader}
                    onChange={(e) => setSecurityHeader(e.target.value)}
                    placeholder="Paste or fetch a test key"
                    sx={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}
                    endAdornment={
                      <InputAdornment position="end">
                        <Tooltip title={showKey ? 'Hide' : 'Show'}>
                          <IconButton size="small" onClick={() => setShowKey((s) => !s)}>
                            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={keyCopied ? 'Copied!' : 'Copy'}>
                          <IconButton
                            size="small"
                            disabled={!securityHeader}
                            onClick={() => {
                              navigator.clipboard.writeText(securityHeader);
                              setKeyCopied(true);
                              setTimeout(() => setKeyCopied(false), 2000);
                            }}>
                            {keyCopied ? <Check size={16} /> : <Copy size={16} />}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    }
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={fetchingKey ? <CircularProgress size={14} color="inherit" /> : <Key size={14} />}
                    disabled={fetchingKey || !selectedEndpoint || !userId}
                    onClick={handleGetTestKey}
                    sx={{ whiteSpace: 'nowrap', textTransform: 'none' }}>
                    Get Test Key
                  </Button>
                </Stack>
                {keyError && (
                  <Typography variant="caption" color="error">
                    {keyError}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Swagger UI */}
        {loadingSwagger ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : swagger ? (
          <Box
            sx={{
              '& .swagger-ui .topbar': { display: 'none' },
              '& .swagger-ui .information-container': { display: 'none' },
              '& .swagger-ui .scheme-container': { display: 'none' },
            }}>
            <SwaggerUI
              spec={swagger}
              plugins={[HideTopPlugin]}
              docExpansion="list"
              requestInterceptor={(request) => {
                if (securityHeader) {
                  request.headers['Authorization'] = `Bearer ${securityHeader}`;
                }
                return request;
              }}
            />
          </Box>
        ) : selectedEndpoint && !loadingSwagger ? (
          <Typography variant="body2" color="text.secondary">
            No API definition available for this endpoint.
          </Typography>
        ) : null}
      </PageContent>
    </Box>
  );
}
