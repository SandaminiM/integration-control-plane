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

import { Box, Drawer, IconButton, Stack, Typography } from '@wso2/oxygen-ui';
import { X } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useState } from 'react';
import type { GqlCommit, GqlDeploymentStatus, GqlRepository } from '../../api/queries';
import { BUILD_DRAWER_TITLES, BuildDrawerType } from '../../constants/build';
import BuildConfigPanel from './BuildConfigPanel';
import BuildDetails from './BuildDetails';
import CommitSelector from './CommitSelector';

interface BuildRightDrawerProps {
  open: boolean;
  onClose: () => void;
  drawerType: BuildDrawerType | null;
  selectedBuild: GqlDeploymentStatus | null;
  componentId: string;
  versionId: string;
  commits: GqlCommit[];
  commitsLoading: boolean;
  onCommitBuild: (commit: GqlCommit) => void;
  isBuildTriggering: boolean;
  repository: GqlRepository | null;
  onNotify: (message: string, severity: 'success' | 'error') => void;
}

export default function BuildRightDrawer({ open, onClose, drawerType, selectedBuild, componentId, versionId, commits, commitsLoading, onCommitBuild, isBuildTriggering, repository, onNotify }: BuildRightDrawerProps) {
  const title = drawerType ? BUILD_DRAWER_TITLES[drawerType] : '';
  const [logsOpen, setLogsOpen] = useState(false);

  // Reset log panel state whenever the drawer type changes or drawer closes
  useEffect(() => { setLogsOpen(false); }, [drawerType, open]);

  const renderContent = () => {
    if (drawerType === BuildDrawerType.BuildLogs && selectedBuild) {
      return <BuildDetails componentId={componentId} versionId={versionId} build={selectedBuild} onLogsToggle={setLogsOpen} />;
    }
    if (drawerType === BuildDrawerType.CommitSelector) {
      return (
        <CommitSelector
          commits={commits}
          commitsLoading={commitsLoading}
          onBuild={(commit) => {
            onCommitBuild(commit);
            onClose();
          }}
          isBuildTriggering={isBuildTriggering}
        />
      );
    }
    if (drawerType === BuildDrawerType.BuildConfig && repository) {
      return <BuildConfigPanel repository={repository} componentId={componentId} versionId={versionId} onClose={onClose} onNotify={onNotify} />;
    }
    return null;
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} variant="temporary" sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: logsOpen ? 720 : 480 } } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton size="small" aria-label="close" onClick={onClose}>
          <X size={16} />
        </IconButton>
      </Stack>

      <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2 }}>{renderContent()}</Box>
    </Drawer>
  );
}
