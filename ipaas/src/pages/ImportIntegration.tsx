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

import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, IconButton, InputAdornment, MenuItem, PageContent, Skeleton, Stack, TextField, Tooltip, Typography } from '@wso2/oxygen-ui';
import { ArrowLeft, GitBranch, Building2, RefreshCw, GitHub } from '@wso2/oxygen-ui-icons-react';
import { useState, useEffect, useRef, type JSX } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useCreateComponent } from '../hooks/useComponents';
import type { DisplayType } from '../types/component';
import { useGitHubUserRepos, useRepoBranches, useRepoContents, useRepoMetadata, useComponentNameAvailability } from '../hooks/useRepository';
import type { DetectedMode } from '../types/repository';
import DirectoryPickerField from '../components/DirectoryPicker';
import IntegrationTypeSelector from '../components/IntegrationCreate/IntegrationTypeSelector';
import TechnologySelector from '../components/IntegrationCreate/TechnologySelector';
import TechDetectionIcon from '../components/IntegrationCreate/TechDetectionIcon';
import IntegrationCreationLoader from '../components/IntegrationCreationLoader';
import type { IntegrationType, SourceMode, LocationState } from '../types/import';
import { SAMPLE_REPO_URL } from '../constants/github';
import { URL_DEBOUNCE_MS } from '../constants/project';
import { resourceUrl, narrow, newComponentUrl, type ProjectScope } from '../nav';
import { useGitHubAuth } from '../hooks/useGitHubAuth';
import { toHandler, formatRepoNameToDisplayName } from '../utils/string';
import { parseGitHubUrl } from '../utils/github';
import { detectTechnology } from '../utils/technologyDetection';
import { useProjectId } from '../hooks/useProjectId';

export default function ImportIntegration(scope: ProjectScope): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  const { projectId } = useProjectId(scope.project);

  const locationState = location.state as LocationState | null;
  const preAuthenticated = !!locationState?.authenticated;
  const pendingAuthCode = locationState?.authCode ?? null;

  const [sourceMode] = useState<SourceMode>(locationState?.mode ?? 'github');
  const isPublicRepo = sourceMode === 'public';

  const { authStatus, startGitHubAuth, exchangeAuthCode } = useGitHubAuth(preAuthenticated ? 'done' : pendingAuthCode ? 'authenticating' : 'idle');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');

  const [repoUrl, setRepoUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [parsedOrg, setParsedOrg] = useState('');
  const [parsedRepo, setParsedRepo] = useState('');

  const [selectedBranch, setSelectedBranch] = useState('');
  const [subPath, setSubPath] = useState('/');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [detectedMode, setDetectedMode] = useState<DetectedMode>(null);
  const [selectedTechnology, setSelectedTechnology] = useState<'MI' | 'BI' | null>(null);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<IntegrationType | null>(null);

  const activeOrg = isPublicRepo ? parsedOrg : selectedOrg;
  const activeRepo = isPublicRepo ? parsedRepo : selectedRepo;

  const createComponent = useCreateComponent();

  const displayNameAutoRef = useRef(false);

  // Exchange OAuth code on mount (GitHub mode only)
  const authCodeExchangedRef = useRef(false);
  useEffect(() => {
    if (isPublicRepo || !pendingAuthCode || authCodeExchangedRef.current) return;
    authCodeExchangedRef.current = true;
    navigate(location.pathname, { replace: true, state: null });
    exchangeAuthCode(pendingAuthCode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reposEnabled = !isPublicRepo && (authStatus === 'done' || preAuthenticated);
  const { data: userRepos, isLoading: isReposLoading, refetch: refetchRepos } = useGitHubUserRepos(reposEnabled);

  const isAuthenticated = !isPublicRepo && !!userRepos && userRepos.length > 0;
  const isCheckingAuth = !isPublicRepo && reposEnabled && isReposLoading;

  const { data: branches, isLoading: isBranchesLoading } = useRepoBranches(activeOrg, activeRepo, isPublicRepo);

  const showBranchAndSubPath = !!(activeOrg && activeRepo);
  const pathReady = !!(activeOrg && activeRepo && selectedBranch);

  const { data: repoContents = [], isLoading: isContentsLoading, isError: isContentsError, refetch: refetchContents } = useRepoContents(activeOrg, activeRepo, selectedBranch, isPublicRepo);

  const { data: repoMetadata, isFetching: isValidating, refetch: refetchMetadata } = useRepoMetadata(activeOrg, activeRepo, selectedBranch, subPath, pathReady, isPublicRepo);

  const handleRevalidate = () => {
    setDetectedMode(null);
    setSelectedTechnology(null);
    refetchMetadata();
  };

  // Helper to reset downstream state when source repo changes
  const resetDownstreamState = (options: { includeDisplayName?: boolean; includeTechnology?: boolean } = {}) => {
    setSelectedBranch('');
    setSubPath('/');
    setDetectedMode(null);
    if (options.includeTechnology) setSelectedTechnology(null);
    if (options.includeDisplayName) {
      setDisplayName('');
      displayNameAutoRef.current = false;
    }
  };

  const baseHandler = toHandler(displayName);
  const { data: nameAvailability, isFetching: isCheckingName } = useComponentNameAvailability(projectId, baseHandler);

  const effectiveHandler = (() => {
    if (!baseHandler || baseHandler.length < 3) return baseHandler;
    if (!nameAvailability) return baseHandler;
    return nameAvailability.componentNameUnique ? baseHandler : nameAvailability.alternateComponentName || baseHandler;
  })();

  const handlerValid = effectiveHandler.length >= 3 && effectiveHandler.length <= 64;

  // Technology detection
  useEffect(() => {
    if (!pathReady || isValidating) return;
    setDetectedMode(detectTechnology(repoMetadata));
  }, [repoMetadata, isValidating, pathReady]);

  useEffect(() => {
    if (detectedMode === 'mi') setSelectedTechnology('MI');
    else if (detectedMode === 'ballerina') setSelectedTechnology('BI');
    else if (detectedMode === null) setSelectedTechnology(null);
  }, [detectedMode]);

  useEffect(() => {
    setDetectedMode(null);
  }, [selectedBranch]);

  // GitHub mode: reset downstream when repo changes — declared BEFORE auto-select so that on a
  // React Query cache hit (both effects fire in the same flush), this one runs first.
  useEffect(() => {
    if (isPublicRepo) return;
    if (selectedRepo && (!displayName || displayNameAutoRef.current)) {
      setDisplayName(formatRepoNameToDisplayName(selectedRepo));
      displayNameAutoRef.current = true;
    }
    resetDownstreamState();
  }, [selectedRepo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select default branch — declared AFTER reset so it wins on a cache hit
  useEffect(() => {
    if (!branches || branches.length === 0) return;
    const stillExists = branches.some((b) => b.name === selectedBranch);
    if (!selectedBranch || !stillExists) {
      const def = branches.find((b) => b.isDefault);
      setSelectedBranch(def?.name ?? branches[0].name);
    }
  }, [branches]); // eslint-disable-line react-hooks/exhaustive-deps

  // Public mode: debounced URL parsing
  useEffect(() => {
    if (!isPublicRepo) return;
    const id = setTimeout(() => {
      if (!repoUrl) {
        setUrlError('');
        setParsedOrg('');
        setParsedRepo('');
        resetDownstreamState({ includeDisplayName: true, includeTechnology: true });
        return;
      }
      const parsed = parseGitHubUrl(repoUrl);
      if (!parsed) {
        setUrlError('Enter a valid GitHub URL, e.g. https://github.com/org/repo');
        setParsedOrg('');
        setParsedRepo('');
        return;
      }
      setUrlError('');
      if (parsed.org !== parsedOrg || parsed.repo !== parsedRepo) {
        resetDownstreamState({ includeDisplayName: true, includeTechnology: true });
        setParsedOrg(parsed.org);
        setParsedRepo(parsed.repo);
      }
    }, URL_DEBOUNCE_MS);
    return () => clearTimeout(id);
    // parsedOrg/parsedRepo intentionally omitted — compared only on change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl]);

  // Public mode: auto-populate display name from parsed repo
  useEffect(() => {
    if (!isPublicRepo) return;
    if (parsedRepo && (!displayName || displayNameAutoRef.current)) {
      setDisplayName(formatRepoNameToDisplayName(parsedRepo));
      displayNameAutoRef.current = true;
    }
    // displayName intentionally omitted to avoid overwriting manual edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedRepo]);

  // Auto-update display name when sub path selection changes
  useEffect(() => {
    if (!displayNameAutoRef.current && displayName) return;
    const sourceName = isPublicRepo ? parsedRepo : selectedRepo;
    if (!sourceName) return;
    if (subPath && subPath !== '/') {
      const lastSegment = subPath.split('/').filter(Boolean).pop();
      if (lastSegment) {
        setDisplayName(formatRepoNameToDisplayName(lastSegment));
        displayNameAutoRef.current = true;
      }
    } else {
      setDisplayName(formatRepoNameToDisplayName(sourceName));
      displayNameAutoRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subPath]);

  const orgOptions = userRepos?.map((o) => o.orgName) ?? [];
  const reposForOrg = userRepos?.find((o) => o.orgName === selectedOrg)?.repositories.map((r) => r.name) ?? [];

  // Submit handler
  const resolveDisplayType = (): DisplayType => {
    if (selectedTechnology === 'BI') {
      return selectedIntegrationType === 'automation' ? 'scheduledTask' : 'ballerinaService';
    }
    return selectedIntegrationType === 'automation' ? 'miCronjob' : 'miApiService';
  };

  const canSubmit = Boolean(activeOrg && activeRepo && selectedBranch && selectedTechnology && selectedIntegrationType && displayName.trim() && handlerValid && projectId && (isPublicRepo || isAuthenticated));

  const handleSubmit = () => {
    createComponent.mutate(
      {
        displayName: displayName.trim(),
        name: effectiveHandler,
        description,
        orgHandler: scope.org,
        projectId,
        displayType: resolveDisplayType(),
        srcGitRepoUrl: `https://github.com/${activeOrg}/${activeRepo}`,
        repositoryBranch: selectedBranch,
        repositorySubPath: subPath || '/',
        isPublicRepo,
        ...(isPublicRepo ? { enableAutoDeploy: true } : {}),
      },
      {
        onSuccess: (component) => navigate(resourceUrl(narrow(scope, component.handler), 'overview')),
        onError: () => {},
      },
    );
  };

  const backUrl = newComponentUrl(scope);

  // Render helpers

  const renderGitHubArea = () => {
    if (isCheckingAuth) {
      return (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4, minHeight: 50 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Checking GitHub connection…
          </Typography>
        </Stack>
      );
    }
    if (isAuthenticated) {
      return (
        <Box sx={{ width: '25%', minWidth: 260, mb: 4, pr: 2.5 }}>
          <Card sx={{ border: 1, borderColor: 'success.main', bgcolor: 'transparent' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ color: 'common.black', display: 'flex' }}>
                    <GitHub size={18} />
                  </Box>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }} />
                  <Typography variant="body2">Connected to GitHub</Typography>
                </Stack>
                <Tooltip title="Reconnect" placement="top">
                  <IconButton size="small" aria-label="Reconnect GitHub" onClick={() => startGitHubAuth(refetchRepos)} sx={{ color: 'text.secondary' }}>
                    <RefreshCw size={14} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      );
    }
    return (
      <Box sx={{ mb: 4 }}>
        {authStatus === 'authenticating' ? (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minHeight: 50 }}>
            <CircularProgress size={16} />
            <Typography color="text.secondary" variant="body2">
              Completing GitHub authorization…
            </Typography>
          </Stack>
        ) : (
          <Box>
            {authStatus === 'failed' && (
              <Alert severity="error" sx={{ mb: 1.5 }}>
                GitHub authorization failed. Please try again.
              </Alert>
            )}
            <Button
              variant="outlined"
              startIcon={
                <Box sx={{ color: 'common.black', display: 'flex' }}>
                  <GitHub size={16} />
                </Box>
              }
              onClick={() => startGitHubAuth(refetchRepos)}
              size="small">
              Authorize with GitHub
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  // Row 1 source pickers — switches based on sourceMode:
  const renderRepoPickers = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {isPublicRepo ? (
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            label="Repository URL"
            required
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            fullWidth
            error={!!urlError}
            helperText={urlError || (isBranchesLoading && parsedOrg ? 'Fetching branches…' : 'e.g. https://github.com/org/repo')}
            slotProps={{
              input: {
                endAdornment:
                  isBranchesLoading && parsedOrg ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} />
                    </InputAdornment>
                  ) : undefined,
              },
            }}
          />
          {!parsedOrg && (
            <Button variant="text" size="small" sx={{ mt: 1, ml: 1.5, p: 0, minWidth: 0, textTransform: 'none', fontSize: 12 }} onClick={() => setRepoUrl(SAMPLE_REPO_URL)}>
              Try with a sample
            </Button>
          )}
        </Grid>
      ) : (
        <>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Organization"
              select
              required
              value={selectedOrg}
              onChange={(e) => {
                setSelectedOrg(e.target.value);
                setSelectedRepo('');
                setSelectedBranch('');
              }}
              fullWidth
              disabled={!isAuthenticated || isReposLoading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Building2 size={18} />
                    </InputAdornment>
                  ),
                },
              }}
              helperText="GitHub organization">
              {orgOptions.map((org) => (
                <MenuItem key={org} value={org}>
                  {org}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Repository"
              select
              required
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              fullWidth
              disabled={!selectedOrg || isReposLoading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ color: 'common.black', display: 'flex' }}>
                        <GitHub size={16} />
                      </Box>
                    </InputAdornment>
                  ),
                },
              }}
              helperText="Select repository">
              {reposForOrg.map((repo) => (
                <MenuItem key={repo} value={repo}>
                  {repo}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </>
      )}

      {showBranchAndSubPath && (
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            label="Branch"
            select
            required
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            fullWidth
            disabled={!activeRepo || isBranchesLoading}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <GitBranch size={18} />
                  </InputAdornment>
                ),
              },
            }}
            helperText="Select branch">
            {(branches ?? []).map((b) => (
              <MenuItem key={b.name} value={b.name}>
                {b.name}
                {b.isDefault ? ' (default)' : ''}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}

      {showBranchAndSubPath && (
        <Grid size={{ xs: 12, md: 3 }}>
          <Stack direction="row" alignItems="flex-start" gap={0.5}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <DirectoryPickerField
                repo={activeRepo}
                value={subPath}
                onChange={(path) => {
                  setSubPath(path);
                  setDetectedMode(null);
                }}
                statusIcon={<TechDetectionIcon mode={detectedMode} isValidating={isValidating} isError={isContentsError} />}
                isValidating={isValidating}
                isError={isContentsError}
                contents={repoContents}
                isFetching={isContentsLoading}
                onRefetch={refetchContents}
                disabled={!selectedBranch}
              />
            </Box>
            {pathReady && (
              <Tooltip title="Re-validate technology detection for the selected path" placement="top">
                <span>
                  <IconButton size="small" disabled={isValidating} onClick={handleRevalidate} sx={{ mt: 1, color: 'primary.main' }}>
                    {isValidating ? <CircularProgress size={14} /> : <RefreshCw size={14} />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        </Grid>
      )}
    </Grid>
  );

  // Early returns

  if (!isPublicRepo && authStatus === 'authenticating') {
    return (
      <PageContent sx={{ pt: 5 }}>
        <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(backUrl)} sx={{ mb: 3 }}>
          Back
        </Button>
        <Typography variant="h1" sx={{ mb: 0.5 }}>
          Import an Integration
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Connect your GitHub repository to start building.
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4, minHeight: 50 }}>
          <CircularProgress size={16} />
          <Typography color="text.secondary" variant="body2">
            Completing GitHub authorization…
          </Typography>
        </Stack>
        <Skeleton variant="rounded" sx={{ width: '25%', height: 56 }} />
      </PageContent>
    );
  }

  if (createComponent.isPending || createComponent.isSuccess || createComponent.isError) {
    const integrationLabel = selectedIntegrationType === 'automation' ? 'Automation' : 'Integration as API';
    return (
      <PageContent sx={{ pt: 5, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <IntegrationCreationLoader
          label={integrationLabel}
          isPending={createComponent.isPending}
          isSuccess={createComponent.isSuccess}
          error={createComponent.isError ? (createComponent.error?.message ?? 'Something went wrong. Please try again.') : null}
          onBack={() => createComponent.reset()}
        />
      </PageContent>
    );
  }

  // Main form

  return (
    <PageContent sx={{ pt: 5 }}>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(backUrl)} sx={{ mb: 3 }}>
        Back
      </Button>

      <Typography variant="h1" sx={{ mb: 0.5 }}>
        Import an Integration
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {isPublicRepo ? 'Paste a public GitHub repository URL to get started.' : 'Connect your GitHub repository to start building.'}
      </Typography>

      {/* Auth banner — only relevant in GitHub mode */}
      {!isPublicRepo && renderGitHubArea()}

      <Box sx={{ '& .MuiFormLabel-asterisk': { color: 'error.main' } }}>
        {/* Row 1 — source pickers (mode-aware) + Branch + Directory */}
        {renderRepoPickers()}

        {/* Row 2 — Display Name + auto-generated Name */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Display Name"
              required
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                displayNameAutoRef.current = false;
              }}
              fullWidth
              error={!!displayName.trim() && !handlerValid}
              helperText={displayName.trim() && !handlerValid ? 'Must be 3–64 chars' : 'Display Name of the Integration'}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Name"
              value={effectiveHandler}
              fullWidth
              disabled
              helperText={isCheckingName ? 'Checking availability…' : 'Auto-generated identifier'}
              slotProps={{
                input: {
                  endAdornment: isCheckingName ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} />
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />
          </Grid>
        </Grid>

        {/* Row 3 — Description */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={1} helperText="Brief description" />
          </Grid>
        </Grid>

        {/* Technology */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 2, mt: 5 }}>
            Technology
          </Typography>
          <TechnologySelector selected={selectedTechnology} detectedMode={detectedMode} enabled={showBranchAndSubPath} onSelect={setSelectedTechnology} />
        </Box>

        {/* Integration Type */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" sx={{ mb: 2, mt: 5 }}>
            Integration Type
          </Typography>
          <IntegrationTypeSelector selected={selectedIntegrationType} onSelect={setSelectedIntegrationType} />
        </Box>

        <Stack direction="row" gap={2} sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={() => navigate(backUrl)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit || createComponent.isPending}>
            {createComponent.isPending ? <CircularProgress size={18} color="inherit" /> : 'Import Integration'}
          </Button>
        </Stack>
      </Box>
    </PageContent>
  );
}
