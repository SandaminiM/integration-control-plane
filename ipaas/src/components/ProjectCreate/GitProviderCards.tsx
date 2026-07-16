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

import { Box, Card, CardActionArea, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { GitHub, Bitbucket, GitLab } from '@wso2/oxygen-ui-icons-react';
import { type JSX } from 'react';
import GitIcon from '../../assets/icons/GitIcon';
import { IS_CLOUD } from '../../features';

interface GitProviderCardsProps {
  onGitHubSelect: () => void;
  onPublicSelect: () => void;
}

export default function GitProviderCards({ onGitHubSelect, onPublicSelect }: GitProviderCardsProps): JSX.Element {
  // Cloud only: private GitHub needs the platform GitHub App, so environments
  // without a configured client id can only import public repos. Other
  // variants always render the card enabled, as before.
  const gitHubEnabled = !IS_CLOUD || !!window.API_CONFIG.githubAppClientId;
  const gitHubCard = (
    <Card variant="outlined" sx={{ flex: 1, ...(gitHubEnabled ? {} : { height: '100%', opacity: 0.5 }) }}>
      <CardActionArea onClick={onGitHubSelect} disabled={!gitHubEnabled} sx={{ p: 2, ...(gitHubEnabled ? {} : { height: '100%' }) }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
          <Box sx={{ color: 'common.black', display: 'flex', flexShrink: 0 }}>
            <GitHub size={22} />
          </Box>
          <Typography variant="body2" fontWeight={500}>
            Authorize With GitHub
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
          Connect a private GitHub repository
        </Typography>
      </CardActionArea>
    </Card>
  );

  return (
    <Stack direction="row" gap={2}>
      {/* GitHub */}
      {gitHubEnabled ? (
        gitHubCard
      ) : (
        <Tooltip title="Private GitHub repositories are not enabled in this environment" placement="top">
          <Box sx={{ flex: 1 }}>{gitHubCard}</Box>
        </Tooltip>
      )}

      {/* Bitbucket — coming soon */}
      <Tooltip title="Bitbucket integration is coming soon" placement="top">
        <Box sx={{ flex: 1 }}>
          <Card variant="outlined" sx={{ height: '100%', opacity: 0.5 }}>
            <CardActionArea disabled sx={{ p: 2, height: '100%' }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                <Box sx={{ display: 'flex', flexShrink: 0 }}>
                  <Bitbucket size={22} />
                </Box>
                <Typography variant="body2" fontWeight={500}>
                  Authorize With Bitbucket
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                Connect a Bitbucket repository
              </Typography>
            </CardActionArea>
          </Card>
        </Box>
      </Tooltip>

      {/* GitLab — coming soon */}
      <Tooltip title="GitLab integration is coming soon" placement="top">
        <Box sx={{ flex: 1 }}>
          <Card variant="outlined" sx={{ height: '100%', opacity: 0.5 }}>
            <CardActionArea disabled sx={{ p: 2, height: '100%' }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                <Box sx={{ display: 'flex', flexShrink: 0 }}>
                  <GitLab size={22} />
                </Box>
                <Typography variant="body2" fontWeight={500}>
                  Authorize With GitLab
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                Connect a GitLab repository
              </Typography>
            </CardActionArea>
          </Card>
        </Box>
      </Tooltip>

      {/* Public Git Repository */}
      <Card variant="outlined" sx={{ flex: 1 }}>
        <CardActionArea onClick={onPublicSelect} sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
            <Box sx={{ display: 'flex', flexShrink: 0 }}>
              <GitIcon size={22} />
            </Box>
            <Typography variant="body2" fontWeight={500}>
              Use Public Git Repository
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
            Use a public Git repository URL
          </Typography>
        </CardActionArea>
      </Card>
    </Stack>
  );
}
