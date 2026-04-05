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

import { Button, Chip, CircularProgress, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tooltip, Typography } from '@wso2/oxygen-ui';
import { GitBranch, GitCommit, Settings } from '@wso2/oxygen-ui-icons-react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useDeployDeploymentTrack, useTriggerBuild } from '../../api/mutations';
import { useComponentDeployment, type GqlCommit, type GqlDeploymentStatus, type GqlRepository } from '../../api/queries';
import { BuildDrawerType } from '../../constants/build';
import { useBuildAutoEffects } from '../../hooks/useBuildAutoEffects';
import { formatDistanceToNow } from '../../utils/time';
import BuildRightDrawer from './BuildRightDrawer';
import BuildStatusLabel from './BuildStatusLabel';

interface BuildHistoryProps {
  orgHandler: string;
  orgUuid: string;
  componentId: string;
  versionId: string;
  envId: string;
  branch: string;
  deploymentPipelineId: string;
  builds: GqlDeploymentStatus[];
  buildsLoading: boolean;
  commits: GqlCommit[];
  commitsLoading: boolean;
  repository: GqlRepository | null;
}

export default function BuildHistory({ orgHandler, orgUuid, componentId, versionId, envId, branch, deploymentPipelineId, builds, buildsLoading, commits, commitsLoading, repository }: BuildHistoryProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<BuildDrawerType | null>(null);
  const [selectedBuild, setSelectedBuild] = useState<GqlDeploymentStatus | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [searchParams, setSearchParams] = useSearchParams();
  const triggerBuild = useTriggerBuild();
  const deployTrack = useDeployDeploymentTrack();
  const { data: componentDeployment } = useComponentDeployment(orgHandler, orgUuid, componentId, versionId, envId);

  const handleAutoOpen = useCallback((build: GqlDeploymentStatus) => {
    setSelectedBuild(build);
    setDrawerType(BuildDrawerType.BuildLogs);
    setDrawerOpen(true);
  }, []);

  const { justTriggered, setJustTriggered, hasInProgress, markAsOpened } = useBuildAutoEffects({
    builds,
    deploymentPipelineId,
    envId,
    componentId,
    versionId,
    imageId: componentDeployment?.build?.buildId ?? '',
    deployFn: deployTrack.mutate,
    onAutoOpen: handleAutoOpen,
  });

  useEffect(() => {
    const buildId = Number(searchParams.get('buildId'));
    if (buildId && builds.length > 0) {
      const match = builds.find((b) => b.id === buildId);
      if (match) {
        markAsOpened(match.id);
        setSelectedBuild(match);
        setDrawerType(BuildDrawerType.BuildLogs);
        setDrawerOpen(true);
      }
    }
  }, [builds, searchParams, markAsOpened]);

  const latestCommit = commits.find((c) => c.isLatest) ?? commits[0] ?? null;

  const isBuilding = triggerBuild.isPending || hasInProgress || justTriggered;

  const handleBuildLatest = () => {
    if (!latestCommit || !envId) return;
    setJustTriggered(true);
    triggerBuild.mutate({ componentId, versionId, envId, sha: latestCommit.sha, branch, shaDate: latestCommit.author?.date ?? '', gitRefType: 'commit' });
  };

  const handleViewDetails = (build: GqlDeploymentStatus) => {
    setSelectedBuild(build);
    setDrawerType(BuildDrawerType.BuildLogs);
    setDrawerOpen(true);
    setSearchParams({ buildId: String(build.id) }, { replace: true });
  };

  const handleSelectCommit = () => {
    setDrawerType(BuildDrawerType.CommitSelector);
    setDrawerOpen(true);
  };

  const handleOpenConfig = () => {
    setDrawerType(BuildDrawerType.BuildConfig);
    setDrawerOpen(true);
  };

  const handleCommitBuild = (commit: GqlCommit) => {
    if (!envId) return;
    setJustTriggered(true);
    triggerBuild.mutate({ componentId, versionId, envId, sha: commit.sha, branch, shaDate: commit.author?.date ?? '', gitRefType: 'commit' });
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDrawerType(null);
    setSearchParams({}, { replace: true });
  };

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h1">Build History</Typography>

        <Stack direction="row" alignItems="center" gap={1}>
          <Tooltip title={hasInProgress ? 'A build is already in progress' : !latestCommit ? 'No commits available' : ''}>
            <span>
              <Button variant="outlined" size="small" startIcon={<GitBranch size={14} />} onClick={handleSelectCommit} disabled={isBuilding || commitsLoading || commits.length === 0}>
                Show Commits
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={hasInProgress ? 'A build is already in progress' : !latestCommit ? 'No commits available' : ''}>
            <span>
              <Button
                variant="contained"
                size="small"
                onClick={handleBuildLatest}
                disabled={isBuilding || !latestCommit}
                startIcon={isBuilding ? <CircularProgress color="inherit" size={14} /> : undefined}>
                {isBuilding ? 'Building' : 'Build Latest'}
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={isBuilding ? 'A build is already in progress' : 'Build configuration'}>
            <span>
              <IconButton size="small" onClick={handleOpenConfig} disabled={!repository || isBuilding}>
                <Settings size={18} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Build ID</TableCell>
              <TableCell>Commit</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Time</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {buildsLoading && builds.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}

            {!buildsLoading && builds.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary" variant="body2">
                    No builds yet. Click &ldquo;Build Latest&rdquo; to start your first build.
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {builds.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((build) => (
              <TableRow key={build.id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      #{build.id}
                    </Typography>
                    <Chip
                      label={build.isAutoDeploy ? 'Automatic' : 'Manual'}
                      size="small"
                      variant="outlined"
                      color={build.isAutoDeploy ? 'primary' : 'info'}
                      sx={{ fontSize: '0.65rem', height: (theme) => theme.spacing(2.25) }}
                    />
                  </Stack>
                </TableCell>

                <TableCell>
                  {build.sourceCommitId ? (
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <GitCommit size={12} style={{ opacity: 0.55 }} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {build.sourceCommitId.slice(0, 7)}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      —
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <BuildStatusLabel status={build.status} conclusion={build.conclusionV2 || build.conclusion} />
                </TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {build.started_at ? formatDistanceToNow(build.started_at) : '—'}
                  </Typography>
                </TableCell>

                <TableCell align="right">
                  <Button variant="text" size="small" onClick={() => handleViewDetails(build)} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={builds.length}
        page={page}
        onPageChange={(_e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50]}
      />

      <BuildRightDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        drawerType={drawerType}
        selectedBuild={selectedBuild ?? (drawerType === BuildDrawerType.BuildLogs ? builds[0] ?? null : null)}
        componentId={componentId}
        versionId={versionId}
        commits={commits}
        commitsLoading={commitsLoading}
        onCommitBuild={handleCommitBuild}
        isBuildTriggering={isBuilding}
        repository={repository}
      />
    </>
  );
}
