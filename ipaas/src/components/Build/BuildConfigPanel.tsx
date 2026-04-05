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

import { Box, Button, CircularProgress, Divider, FormControlLabel, Link, Stack, Switch, Typography } from '@wso2/oxygen-ui';
import { GitBranch, GitFork } from '@wso2/oxygen-ui-icons-react';
import { useState } from 'react';
import { useUpdateBuildpackConfigs } from '../../api/mutations';
import type { GqlRepository } from '../../api/queries';
import { gitProviderLabel, repoUrl, Row } from '../../utils/build';

interface BuildConfigPanelProps {
  repository: GqlRepository;
  componentId: string;
  versionId: string;
}

export default function BuildConfigPanel({ repository, componentId, versionId }: BuildConfigPanelProps) {
  const { organizationApp, nameApp, branch, appSubPath, gitProvider, buildpackConfig } = repository;
  const url = repoUrl(repository);

  const versionConfig = buildpackConfig?.find((c) => c.versionId === versionId) ?? buildpackConfig?.[0];
  const [isUnitTestEnabled, setIsUnitTestEnabled] = useState(versionConfig?.isUnitTestEnabled ?? false);
  const [savedUnitTestEnabled, setSavedUnitTestEnabled] = useState(versionConfig?.isUnitTestEnabled ?? false);

  const updateBuildpackConfigs = useUpdateBuildpackConfigs();

  const handleSaveBuildConfig = () => {
    updateBuildpackConfigs.mutate(
      {
        componentId,
        versionId,
        buildContext: versionConfig?.buildContext ?? '',
        languageVersion: versionConfig?.languageVersion ?? '',
        environmentVariables: [],
        isUnitTestEnabled,
        pullLatestSubmodules: versionConfig?.pullLatestSubmodules ?? false,
        enableTrivyScan: versionConfig?.enableTrivyScan ?? false,
      },
      { onSuccess: () => setSavedUnitTestEnabled(isUnitTestEnabled) },
    );
  };

  const isDirty = isUnitTestEnabled !== savedUnitTestEnabled;

  return (
    <Stack gap={2}>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Stack gap={1.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Source Repository
          </Typography>

          <Divider />

          <Row label="Provider">
            <Typography variant="body2">{gitProviderLabel(gitProvider)}</Typography>
          </Row>

          <Row label="Repository">
            {url ? (
              <Link href={url} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {organizationApp}/{nameApp}
              </Link>
            ) : (
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {organizationApp}/{nameApp}
              </Typography>
            )}
          </Row>

          <Row label="Branch">
            <Stack direction="row" alignItems="center" gap={0.5}>
              <GitBranch size={13} style={{ opacity: 0.6 }} />
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {branch || '—'}
              </Typography>
            </Stack>
          </Row>

          {appSubPath && (
            <Row label="Build Path">
              <Stack direction="row" alignItems="center" gap={0.5}>
                <GitFork size={13} style={{ opacity: 0.6 }} />
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {appSubPath}
                </Typography>
              </Stack>
            </Row>
          )}
        </Stack>
      </Box>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Stack gap={1.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Build Options
          </Typography>

          <Divider />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack gap={0.25}>
              <Typography variant="body2">Run Unit Tests</Typography>
              <Typography variant="caption" color="text.secondary">
                Execute unit tests as part of the build process
              </Typography>
            </Stack>
            <FormControlLabel
              control={<Switch checked={isUnitTestEnabled} onChange={(e) => setIsUnitTestEnabled(e.target.checked)} size="small" />}
              label=""
              sx={{ m: 0 }}
            />
          </Stack>

          <Stack direction="row" justifyContent="flex-end" sx={{ pt: 0.5 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveBuildConfig}
              disabled={!isDirty || updateBuildpackConfigs.isPending}
              startIcon={updateBuildpackConfigs.isPending ? <CircularProgress color="inherit" size={14} /> : undefined}
            >
              {updateBuildpackConfigs.isPending ? 'Saving' : 'Save'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
