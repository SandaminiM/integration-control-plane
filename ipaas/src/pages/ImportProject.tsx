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

import { Alert, Box, Button, CircularProgress, Grid, IconButton, InputAdornment, MenuItem, PageContent, Stack, TextField, Tooltip, Typography } from '@wso2/oxygen-ui';
import { ArrowLeft, Building2, Check, CheckCircle2, Edit, GitHub, GitBranch } from '@wso2/oxygen-ui-icons-react';
import GitIcon from '../assets/icons/GitIcon';
import GitProviderCards from '../components/ProjectCreate/GitProviderCards';
import { useState, useEffect, useLayoutEffect, type JSX } from 'react';
import { useNavigate } from 'react-router';
import { useCreateMonoRepoProject } from '../hooks/useProjects';
import { useCreateComponent } from '../hooks/useComponents';
import { useGitHubUserRepos, useRepoBranches, useRepoContents } from '../hooks/useRepository';
import { useOrgs, useOrgComponentLimits, useOrgSubscriptions } from '../hooks/useOrg';
import type { Project } from '../types/project';
import { useOrgUuid } from '../hooks/useOrgUuid';
import DirectoryPickerField from '../components/DirectoryPicker';
import WorkspaceModuleTable from '../components/ProjectCreate/WorkspaceModuleTable';
import { FREE_COMPONENT_LIMIT, URL_DEBOUNCE_MS } from '../constants/project';
import { useProjectHandler } from '../hooks/useProjectHandler';
import { resourceUrl, narrow, type OrgScope } from '../nav';
import { useGitHubAuth } from '../hooks/useGitHubAuth';
import { toHandler } from '../utils/string';
import { parseGitHubUrl } from '../utils/github';
import { isBallerinaWorkspace } from '../utils/technologyDetection';
import { validateProjectName, validateProjectHandler, normalizeProjectError } from '../utils/projectValidation';
import type { GitProvider, WorkspaceModule } from '../types/project';

export default function ImportProject(scope: OrgScope): JSX.Element {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');

  const [gitProvider, setGitProvider] = useState<GitProvider | null>(null);
  const isPublicRepo = gitProvider === 'public';
  const providerSelected = gitProvider !== null;

  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');

  const [repoUrl, setRepoUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [parsedOrg, setParsedOrg] = useState('');
  const [parsedRepo, setParsedRepo] = useState('');

  const [selectedBranch, setSelectedBranch] = useState('');
  const [subPath, setSubPath] = useState('/');

  const [isWorkspace, setIsWorkspace] = useState(false);
  const [workspaceModules, setWorkspaceModules] = useState<WorkspaceModule[]>([]);

  const [isImporting, setIsImporting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeOrg = isPublicRepo ? parsedOrg : selectedOrg;
  const activeRepo = isPublicRepo ? parsedRepo : selectedRepo;
  const showBranchAndSubPath = !!(activeOrg && activeRepo);
  const pathReady = !!(activeOrg && activeRepo && selectedBranch);

  // colSize: 4 fields (GitHub + branch + subpath) → md:3; otherwise → md:4
  const colSize = !isPublicRepo && showBranchAndSubPath ? 3 : 4;

  const { data: orgs = [] } = useOrgs();
  const orgUuid = useOrgUuid() ?? orgs.find((o) => o.handle === scope.org)?.uuid ?? '';
  const { data: orgLimits } = useOrgComponentLimits(orgUuid);
  const { data: subscriptions } = useOrgSubscriptions(orgUuid);
  const isUpgraded = (subscriptions ?? []).some((s) => s.subscriptionType === 'devant-subscription' && s.subscriptionStatus === 'active');
  const orgBillableCount = isUpgraded ? 0 : (orgLimits?.billableComponentCount ?? 0);
  const quotaRemaining = isUpgraded ? undefined : Math.max(0, FREE_COMPONENT_LIMIT - orgBillableCount);

  const { handler: effectiveHandler, handlerEdited, isCheckingAvailability, availability, startEditing, stopEditing, onHandlerChange } = useProjectHandler(displayName);
  const { authStatus, startGitHubAuth } = useGitHubAuth();
  const createMonoRepoProject = useCreateMonoRepoProject();
  const createComponent = useCreateComponent();

  const reposEnabled = !isPublicRepo && authStatus === 'done';
  const { data: userRepos, isLoading: isReposLoading, refetch: refetchRepos } = useGitHubUserRepos(reposEnabled);
  const isAuthenticated = !isPublicRepo && !!userRepos && userRepos.length > 0;
  const isCheckingAuth = !isPublicRepo && reposEnabled && isReposLoading;

  const { data: branches, isLoading: isBranchesLoading } = useRepoBranches(activeOrg, activeRepo, isPublicRepo);
  const { data: repoContents = [], isLoading: isContentsLoading, isError: isContentsError, refetch: refetchContents } = useRepoContents(activeOrg, activeRepo, selectedBranch, isPublicRepo);

  // Auto-select default branch; preserve an already-valid selection on refetch
  useEffect(() => {
    if (!branches || branches.length === 0) return;
    const stillExists = branches.some((b) => b.name === selectedBranch);
    if (!selectedBranch || !stillExists) {
      const def = branches.find((b) => b.isDefault);
      setSelectedBranch(def?.name ?? branches[0].name);
    }
  }, [branches]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isPublicRepo) return;
    setSelectedBranch('');
    setSubPath('/');
    setIsWorkspace(false);
    setWorkspaceModules([]);
  }, [selectedRepo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIsWorkspace(false);
    setWorkspaceModules([]);
  }, [selectedBranch]);

  useEffect(() => {
    if (!isPublicRepo) return;
    const id = setTimeout(() => {
      if (!repoUrl) {
        setUrlError('');
        setParsedOrg('');
        setParsedRepo('');
        setSelectedBranch('');
        setSubPath('/');
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
        setSelectedBranch('');
        setSubPath('/');
        setParsedOrg(parsed.org);
        setParsedRepo(parsed.repo);
      }
    }, URL_DEBOUNCE_MS);
    return () => clearTimeout(id);
    // parsedOrg/parsedRepo intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl]);

  useEffect(() => {
    if (!pathReady || isContentsLoading) {
      setIsWorkspace(false);
      setWorkspaceModules([]);
      return;
    }
    let nodes = repoContents;
    if (subPath && subPath !== '/') {
      const cleanPath = subPath.replace(/^\//, '');
      const target = repoContents.find((n) => n.path === cleanPath || n.subPath === cleanPath);
      nodes = target?.children ?? [];
    }
    const workspace = isBallerinaWorkspace(nodes);
    setIsWorkspace(workspace);
    if (!workspace) setWorkspaceModules([]);
  }, [repoContents, subPath, pathReady, isContentsLoading]);

  // Stabilize scrollbar gutter to prevent layout shift when content height changes
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('scrollbar-gutter', 'stable');
    return () => {
      document.documentElement.style.removeProperty('scrollbar-gutter');
    };
  }, []);

  const handleProviderSelect = (provider: GitProvider) => {
    setGitProvider(provider);
  };

  const nameError = displayName ? validateProjectName(displayName) : null;
  const handlerError = effectiveHandler ? validateProjectHandler(effectiveHandler) : null;
  const handlerTaken = availability && !availability.handlerUnique ? 'This name is already taken.' : null;

  const availabilityReady = !effectiveHandler || effectiveHandler.length < 2 || availability !== undefined;
  const canSubmit = !!displayName.trim() && !nameError && !!effectiveHandler && !handlerError && !handlerTaken && !isCheckingAvailability && availabilityReady && pathReady && isWorkspace && workspaceModules.length > 0;

  const handleImport = async () => {
    setIsImporting(true);
    setSubmitError(null);

    // Step 1: create the project. Any failure here is surfaced immediately.
    let project: Project;
    try {
      project = await createMonoRepoProject.mutateAsync({
        name: displayName.trim(),
        handler: effectiveHandler,
        description: description.trim(),
        orgHandler: scope.org,
        repository: activeRepo,
        gitOrganization: activeOrg,
        branch: selectedBranch,
        directoryPath: subPath === '/' ? '' : subPath.replace(/^\//, ''),
        gitProvider: isPublicRepo ? 'public' : 'github',
        isPublicRepo,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setSubmitError(normalizeProjectError(message));
      setIsImporting(false);
      return;
    }

    // Step 2: create workspace module components. The project already exists, so individual
    // component failures don't block navigation — the user can manage them from the project page.
    if (workspaceModules.length > 0) {
      const srcGitRepoUrl = `https://github.com/${activeOrg}/${activeRepo}`;
      await Promise.allSettled(
        workspaceModules.map((module) =>
          createComponent.mutateAsync({
            displayName: module.displayName || module.name,
            name: toHandler(module.displayName || module.name),
            description: '',
            orgHandler: scope.org,
            projectId: project.id,
            displayType: module.integrationType === 'automation' ? 'scheduledTask' : 'ballerinaService',
            srcGitRepoUrl,
            repositoryBranch: selectedBranch,
            repositorySubPath: module.path,
            isPublicRepo,
          }),
        ),
      );
    }

    navigate(resourceUrl(narrow(scope, project.handler), 'overview'));
  };

  const renderHandlerHelperText = () => {
    if (isCheckingAvailability) return 'Checking availability…';
    if (handlerTaken) {
      const alt = availability?.alternateHandlerCandidate;
      return alt ? `This name is already taken. Try "${alt}" instead.` : handlerTaken;
    }
    return handlerError ?? 'Auto-generated identifier';
  };

  const renderGitHubAuthArea = () => {
    if (isCheckingAuth) {
      return (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3, minHeight: 40 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Checking GitHub connection…
          </Typography>
        </Stack>
      );
    }
    if (isAuthenticated) return null;
    if (authStatus === 'authenticating') {
      return (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3, minHeight: 40 }}>
          <CircularProgress size={16} />
          <Typography color="text.secondary" variant="body2">
            Completing GitHub authorization…
          </Typography>
        </Stack>
      );
    }
    if (authStatus === 'failed') {
      return (
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 3 }}>
          <Typography variant="body2" color="error.main">
            GitHub authorization failed.
          </Typography>
          <Button variant="text" size="small" sx={{ p: 0, minWidth: 0 }} onClick={() => startGitHubAuth(refetchRepos)}>
            Try again
          </Button>
        </Stack>
      );
    }
    return (
      <Box sx={{ mb: 3 }}>
        {authStatus === 'done' && (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            No repositories found. Please check your GitHub access.
          </Alert>
        )}
        <Button
          variant="outlined"
          size="small"
          startIcon={
            <Box sx={{ color: 'common.black', display: 'flex' }}>
              <GitHub size={16} />
            </Box>
          }
          onClick={() => startGitHubAuth(refetchRepos)}>
          {authStatus === 'done' ? 'Reconnect GitHub' : 'Authorize with GitHub'}
        </Button>
      </Box>
    );
  };

  const orgOptions = userRepos?.map((o) => o.orgName) ?? [];
  const reposForOrg = userRepos?.find((o) => o.orgName === selectedOrg)?.repositories.map((r) => r.name) ?? [];

  const renderRepoPickers = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {isPublicRepo ? (
        <Grid size={{ xs: 12, md: colSize }}>
          <TextField
            label="Repository URL"
            required
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            fullWidth
            error={!!urlError}
            helperText={
              urlError || (
                <>
                  Only public GitHub repositories are supported.
                  <br />
                  e.g. https://github.com/org/repo
                </>
              )
            }
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <GitIcon size={16} />
                  </InputAdornment>
                ),
                endAdornment:
                  isBranchesLoading && parsedOrg ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} />
                    </InputAdornment>
                  ) : undefined,
              },
            }}
          />
        </Grid>
      ) : (
        <>
          <Grid size={{ xs: 12, md: colSize }}>
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
          <Grid size={{ xs: 12, md: colSize }}>
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
        <Grid size={{ xs: 12, md: colSize }}>
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
        <Grid size={{ xs: 12, md: colSize }}>
          <DirectoryPickerField repo={activeRepo} value={subPath} onChange={(path) => setSubPath(path)} isError={isContentsError} contents={repoContents} isFetching={isContentsLoading} onRefetch={refetchContents} disabled={!selectedBranch} />
          {isWorkspace && pathReady && !isContentsLoading && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.75, ml: 1.5 }}>
              <Box sx={{ color: 'success.main', display: 'flex' }}>
                <CheckCircle2 size={14} />
              </Box>
              <Typography variant="caption" color="success.main" fontWeight={500}>
                Ballerina Workspace Detected
              </Typography>
            </Stack>
          )}
        </Grid>
      )}
    </Grid>
  );

  return (
    <PageContent sx={{ pt: 5, '& .MuiFormLabel-asterisk': { color: 'error.main' } }}>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => window.history.back()} sx={{ mb: 2 }}>
        Back to Home
      </Button>

      <Typography variant="h1" sx={{ mb: 1 }}>
        Import a Project
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Choose a repository with your existing Ballerina workspace project.
      </Typography>

      {submitError && (
        <Alert severity="error" role="alert" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      {/* Source Repository — always visible first */}
      {!providerSelected ? (
        <Box sx={{ mb: 4 }}>
          <GitProviderCards
            onGitHubSelect={() => {
              handleProviderSelect('github');
              startGitHubAuth(refetchRepos);
            }}
            onPublicSelect={() => handleProviderSelect('public')}
          />
        </Box>
      ) : (
        <Box sx={{ mb: 1 }}>
          {gitProvider === 'github' && renderGitHubAuthArea()}
          {renderRepoPickers()}
          {pathReady && !isContentsLoading && !isContentsError && !isWorkspace && (
            <Alert severity="info" sx={{ mb: 3 }}>
              No Ballerina workspace detected in the selected directory. Select a directory that contains a Ballerina workspace (a root <code>Ballerina.toml</code> with subdirectories that each have their own <code>Ballerina.toml</code>).
            </Alert>
          )}
        </Box>
      )}

      {/* Project Details — shown after workspace detection */}
      {isWorkspace && (
        <>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            Project Details
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Display Name"
                required
                placeholder="Enter Project Name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setSubmitError(null);
                }}
                fullWidth
                error={!!nameError}
                helperText={nameError ?? 'Name of the project'}
                slotProps={{ htmlInput: { 'aria-label': 'Display Name' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Name"
                value={effectiveHandler}
                onChange={(e) => onHandlerChange(e.target.value)}
                fullWidth
                disabled={!handlerEdited}
                error={!!handlerError || !!handlerTaken}
                helperText={renderHandlerHelperText()}
                slotProps={{
                  htmlInput: { 'aria-label': 'Name' },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        {isCheckingAvailability ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Tooltip title={handlerEdited ? 'Done' : 'Edit name'} placement="top">
                            <IconButton size="small" aria-label={handlerEdited ? 'Confirm name' : 'Edit name'} onClick={() => (handlerEdited ? stopEditing() : startEditing())} sx={handlerEdited ? { color: 'success.main' } : { color: 'primary.main' }}>
                              {handlerEdited ? <Check size={16} /> : <Edit size={16} />}
                            </IconButton>
                          </Tooltip>
                        )}
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Description (Optional)" placeholder="Enter description here" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={1} slotProps={{ htmlInput: { 'aria-label': 'Description' } }} />
            </Grid>
          </Grid>
        </>
      )}

      {/* Configure Integrations — shown after workspace detection */}
      {isWorkspace && <WorkspaceModuleTable repoName={activeRepo} repoContents={repoContents} modules={workspaceModules} onChange={setWorkspaceModules} quotaRemaining={quotaRemaining} alertWhenEmpty />}

      <Stack direction="row" gap={2} sx={{ mt: 2 }}>
        <Button variant="outlined" onClick={() => window.history.back()} disabled={isImporting}>
          Cancel
        </Button>
        {isWorkspace && (
          <Button variant="contained" onClick={handleImport} disabled={!canSubmit || isImporting} startIcon={isImporting ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {isImporting ? 'Importing…' : 'Import'}
          </Button>
        )}
      </Stack>
    </PageContent>
  );
}
