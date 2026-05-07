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

import { Box, CircularProgress, Divider, Drawer, IconButton, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { CheckCircle2, Clock, GitCommitHorizontal, User, X, XCircle } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import { useReleaseMgtDeployments } from '../../../api/queries';
import { formatDistanceToNow } from '../../../utils/time';

const drawerSx = { '& .MuiDrawer-paper': { width: 480, p: 0, top: { xs: '56px', sm: '64px' }, height: 'auto', bottom: 0 } };

// "0001-01-01T00:00:00Z" is the zero-value date the backend returns when not yet deployed
const isZeroDate = (d: string) => !d || d.startsWith('0001-01-01');

interface DeploymentHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  orgUuid: string;
  projectId: string;
  componentId: string;
  versionId: string;
  environmentId: string;
  envName: string;
}

export default function DeploymentHistoryDrawer({ open, onClose, orgUuid, projectId, componentId, versionId, environmentId, envName }: DeploymentHistoryDrawerProps): JSX.Element {
  const { data: deployments = [], isLoading } = useReleaseMgtDeployments(orgUuid, projectId, componentId, versionId, environmentId);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} variant="temporary" sx={drawerSx}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack gap={0.25}>
          <Typography variant="h3">Deployment History</Typography>
          <Typography variant="caption" color="text.secondary">
            {envName}
          </Typography>
        </Stack>
        <Tooltip title="Close">
          <IconButton size="small" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!isLoading && deployments.length === 0 && (
          <Box sx={{ px: 2.5, pt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No deployment history found for this environment.
            </Typography>
          </Box>
        )}

        {!isLoading &&
          deployments.map((dep, idx) => {
            const isSuccess = dep.status === 'SUCCESS';
            const isFailed = dep.status === 'FAILED';

            // deployed_at is a zero date when the deployment hasn't completed; fall back to created_at
            const time = !isZeroDate(dep.deployed_at) ? dep.deployed_at : dep.created_at;

            return (
              <Box key={dep.id ?? idx}>
                <Stack direction="row" gap={1.5} sx={{ px: 2.5, py: 2 }}>
                  {/* Status icon */}
                  <Box sx={{ pt: 0.25, flexShrink: 0 }}>{isSuccess ? <CheckCircle2 size={16} color="#36B475" /> : isFailed ? <XCircle size={16} color="#FD6B6B" /> : <Clock size={16} style={{ opacity: 0.5 }} />}</Box>

                  <Stack gap={0.5} sx={{ minWidth: 0 }}>
                    {/* Status + release name */}
                    <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                      <Typography variant="body2" fontWeight={600}>
                        {isSuccess ? 'Success' : isFailed ? 'Failed' : 'Pending'}
                      </Typography>
                      {dep.release_name && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {dep.release_name}
                        </Typography>
                      )}
                    </Stack>

                    {/* Time */}
                    {time && (
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(time)}
                      </Typography>
                    )}

                    {/* Commit hash */}
                    {dep.commit_hash && (
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <GitCommitHorizontal size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {dep.commit_hash.substring(0, 9)}
                        </Typography>
                      </Stack>
                    )}

                    {/* Comment */}
                    {dep.comment && (
                      <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dep.comment}
                      </Typography>
                    )}

                    {/* Deployed by */}
                    {dep.deployed_by && (
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <User size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                        <Typography variant="caption" color="text.secondary">
                          {dep.deployed_by}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Stack>
                {idx < deployments.length - 1 && <Divider />}
              </Box>
            );
          })}
      </Box>
    </Drawer>
  );
}
