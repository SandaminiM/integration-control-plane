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

import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, IconButton, PageContent, Snackbar, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { ArrowLeft, ArrowRight } from '@wso2/oxygen-ui-icons-react';
import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router';
import { useCreateComponent } from '../api/mutations';
import { useChoreoSampleImages } from '../api/queries';
import { getOrgUuidFromToken, generateAndSaveGitHubState, validateAndClearGitHubState } from '../auth/tokenManager';
import { useAuth } from '../auth/AuthContext';
import IDEMockup from '../components/IDEMockup/IDEMockup';
import PillTabs from '../components/PillTabs';
import PrebuiltCard from '../components/PrebuiltCard';
import SampleRowCard from '../components/SampleRowCard';
import IntegrationCreationLoader from '../components/IntegrationCreationLoader';
import GitIcon from '../assets/icons/GitIcon';
import GitHubIcon from '../assets/icons/GitHubIcon';
import GitLabIcon from '../assets/icons/GitLabIcon';
import BitBucketIcon from '../assets/icons/BitBucketIcon';
import AzureIcon from '../assets/icons/AzureIcon';
import { displayTypeFromSample } from '../constants/integrations';
import { GITHUB_AUTH } from '../constants/import';
import { FEATURED_SAMPLES, FEATURED_PREBUILT } from '../constants/samples';
import { CARD_HOVER_SX, PROVIDER_ICON_SX } from '../constants/styles';
import { resourceUrl, narrow, type ProjectScope } from '../nav';
import { importComponentUrl, browseSamplesUrl, buildGitHubOAuthUrl } from '../paths';
import type { Sample } from '../types/samples';
import { toHandler } from '../utils/string';
import { useProjectId } from '../hooks/useProjectId';

export default function CreateIntegrationOptions(scope: ProjectScope): JSX.Element {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { projectId } = useProjectId(scope.project);
  const orgUuid = getOrgUuidFromToken() ?? '';

  const { data: sampleImages } = useChoreoSampleImages(orgUuid, projectId);

  const [isCloudEditorCardHovered, setIsCloudEditorCardHovered] = useState(false);
  const [selectedTab, setSelectedTab] = useState(1);
  const [deployingSample, setDeployingSample] = useState<string | null>(null);
  const [isImportAuthenticating, setIsImportAuthenticating] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'error',
  });
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' = 'error') => setSnackbar({ open: true, message, severity });

  const createComponent = useCreateComponent();

  const handleOpenCloudEditor = async () => {
    const codeServerSample = (sampleImages ?? []).find((img) => img.name === 'Code Server');
    if (!codeServerSample) {
      showSnackbar('Cloud Editor is not available. Please try again later.', 'warning');
      return;
    }
    const deploymentUrl = new URL('/editor', window.location.origin);
    deploymentUrl.searchParams.set('userId', userId);
    deploymentUrl.searchParams.set('orgUuid', orgUuid);
    deploymentUrl.searchParams.set('orgHandle', scope.org);
    deploymentUrl.searchParams.set('projectId', projectId);
    deploymentUrl.searchParams.set('componentId', 'null');
    deploymentUrl.searchParams.set('codeServerSample', JSON.stringify(codeServerSample));
    const newTab = window.open(deploymentUrl.toString(), '_blank');
    if (!newTab) {
      showSnackbar('Please allow popups for this site and try again.', 'warning');
    }
  };

  const importUrl = importComponentUrl(scope.org, scope.project);

  const handleImportClick = () => {
    const { githubAppClientId, githubAppAuthRedirectUrl } = window.API_CONFIG;
    if (!githubAppClientId) {
      navigate(importUrl);
      return;
    }
    setIsImportAuthenticating(true);

    const state = generateAndSaveGitHubState();
    const url = buildGitHubOAuthUrl(githubAppAuthRedirectUrl ?? '', githubAppClientId, state);
    const popup = window.open(url, 'github-oauth', GITHUB_AUTH.POPUP_DIMENSIONS);

    const channel = new BroadcastChannel(GITHUB_AUTH.BROADCAST_CHANNEL);
    const pollClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(pollClosed);
        channel.close();
        setIsImportAuthenticating(false);
      }
    }, GITHUB_AUTH.POPUP_POLL_INTERVAL_MS);

    channel.onmessage = (event) => {
      clearInterval(pollClosed);
      channel.close();
      const { authCode, state: returnedState } = event.data as { authCode: string | null; state: string | null };
      if (!returnedState || !validateAndClearGitHubState(returnedState)) {
        setIsImportAuthenticating(false);
        showSnackbar('GitHub authorization failed (invalid state). Please try again.');
        return;
      }
      if (!authCode) {
        setIsImportAuthenticating(false);
        showSnackbar('GitHub authorization failed. Please try again.');
        return;
      }
      navigate(importUrl, { state: { authCode } });
    };
  };

  const handleQuickDeploy = (sample: Sample) => {
    if (!projectId) return;
    setDeployingSample(sample.displayName);
    createComponent.mutate(
      {
        displayName: sample.displayName,
        name: toHandler(sample.displayName),
        description: sample.description,
        orgHandler: scope.org,
        projectId,
        displayType: displayTypeFromSample(sample.componentType, sample.buildPack),
        srcGitRepoUrl: sample.repositoryUrl,
        repositorySubPath: `${sample.subDirectory}${sample.componentPath}`,
        repositoryBranch: sample.branch ?? 'main',
        isPublicRepo: true,
        enableAutoDeploy: true,
      },
      {
        onSuccess: (component) => {
          showSnackbar('Integration created successfully!', 'success');
          setTimeout(() => navigate(resourceUrl(narrow(scope, component.handler), 'overview')), 1500);
        },
        onError: (err) => {
          showSnackbar(err.message);
          setDeployingSample(null);
        },
      },
    );
  };

  if (createComponent.isPending || createComponent.isSuccess) {
    return (
      <PageContent sx={{ pt: 5 }}>
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
        <IntegrationCreationLoader label="Integration" subLabel={deployingSample || undefined} isPending={createComponent.isPending} isSuccess={createComponent.isSuccess} />
      </PageContent>
    );
  }

  return (
    <PageContent sx={{ pt: 5 }}>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(resourceUrl(scope, 'overview'))} sx={{ mb: 3 }}>
        Back to Project Home
      </Button>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'stretch',
          gridTemplateColumns: '1fr',
          '@media (min-width: 1280px)': {
            gridTemplateColumns: '6fr 4fr',
          },
        }}>
        {/* Left column: Cloud Editor + Import */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          {/* Cloud Editor card */}
          <Box sx={{ flex: 7 }}>
            <Card sx={{ height: '100%', ...CARD_HOVER_SX }} onMouseEnter={() => setIsCloudEditorCardHovered(true)} onMouseLeave={() => setIsCloudEditorCardHovered(false)} onClick={handleOpenCloudEditor}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3, '&:last-child': { pb: 3 } }}>
                <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                  <Typography variant="h2">Create an Integration</Typography>
                  <Chip label="Beta" size="small" color="primary" variant="outlined" />
                </Stack>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                  Start developing in a complete, browser-based development environment.
                </Typography>
                {/* Fixed height for IDE mockup */}
                <Box sx={{ height: 260, overflow: 'hidden' }}>
                  <IDEMockup isHovered={isCloudEditorCardHovered} onOpenClick={handleOpenCloudEditor} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Import Integration card */}
          <Box sx={{ flex: 3 }}>
            <Card variant="outlined" sx={{ height: '100%', boxShadow: 'none', ...(isImportAuthenticating ? { pointerEvents: 'none', opacity: 0.7 } : {}) }}>
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 3,
                  gap: 3,
                  '&:last-child': { pb: 3 },
                }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h2" sx={{ mb: 0.5 }}>
                    Import an Integration
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {isImportAuthenticating ? 'Completing GitHub authorization…' : 'Connect your repository and start building instantly'}
                  </Typography>
                </Box>

                {/* Vertical divider */}
                <Box sx={{ width: '2px', alignSelf: 'stretch', bgcolor: 'divider', flexShrink: 0 }} />

                {/* Provider icon buttons */}
                <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                  {isImportAuthenticating ? (
                    <CircularProgress size={22} />
                  ) : (
                    <>
                      <Tooltip title="Import from a Public Repository" placement="top">
                        <IconButton
                          aria-label="Import from a Public Repository"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(importUrl, { state: { mode: 'public' } });
                          }}
                          sx={PROVIDER_ICON_SX}>
                          <GitIcon size={25} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Import from GitHub" placement="top">
                        <IconButton aria-label="Import from GitHub" onClick={handleImportClick} sx={PROVIDER_ICON_SX}>
                          <GitHubIcon size={22} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Import from GitLab" placement="top">
                        <IconButton aria-label="Import from GitLab" sx={PROVIDER_ICON_SX}>
                          <GitLabIcon size={22} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Import from Bitbucket" placement="top">
                        <IconButton aria-label="Import from Bitbucket" sx={PROVIDER_ICON_SX}>
                          <BitBucketIcon size={22} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Import from Azure" placement="top">
                        <IconButton aria-label="Import from Azure" sx={PROVIDER_ICON_SX}>
                          <AzureIcon size={22} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Right column: Get Started Quickly */}
        <Box sx={{ minWidth: 0 }}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
            }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, '&:last-child': { pb: 3 } }}>
              <Typography variant="h2" sx={{ mb: 0.5 }}>
                Get Started Quickly
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                Start with prebuilt integrations or simple samples to get started.
              </Typography>

              <Box sx={{ mb: 2 }}>
                <PillTabs value={selectedTab} onChange={setSelectedTab} tabs={[{ label: 'Prebuilt Integrations' }, { label: 'Samples' }]} />
              </Box>

              <Box sx={{ display: 'grid', flex: 1, minWidth: 0, '& > *': { gridArea: '1 / 1', zIndex: 1, minWidth: 0 } }}>
                {/* Prebuilt panel */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    ...(selectedTab !== 0 ? { visibility: 'hidden', pointerEvents: 'none', zIndex: 0 } : {}),
                  }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {FEATURED_PREBUILT.map((integration) => (
                      <PrebuiltCard key={integration.displayName} integration={integration} />
                    ))}
                  </Box>
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Button variant="text" color="primary" endIcon={<ArrowRight size={14} />} disabled sx={{ textTransform: 'none', pl: 0 }}>
                      Explore more prebuilt integrations
                    </Button>
                  </Box>
                </Box>

                {/* Samples panel */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    ...(selectedTab !== 1 ? { visibility: 'hidden', pointerEvents: 'none', zIndex: 0 } : {}),
                  }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {FEATURED_SAMPLES.map((sample) => (
                      <SampleRowCard key={sample.displayName} sample={sample} onDeploy={() => handleQuickDeploy(sample)} isDeploying={deployingSample === sample.displayName} />
                    ))}
                  </Box>
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Button variant="text" color="primary" endIcon={<ArrowRight size={14} />} onClick={() => navigate(browseSamplesUrl(scope.org, scope.project))} sx={{ textTransform: 'none', pl: 0 }}>
                      Explore more samples
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </PageContent>
  );
}
