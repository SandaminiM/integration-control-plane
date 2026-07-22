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

import { Box, Button, Typography } from '@wso2/oxygen-ui';
import { ArrowRight } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import type { PrebuiltIntegration } from '../../types/prebuilt';
import type { PrebuiltMatchResponse } from '../../types/aiBuilder';
import AppIconsRow from '../AppIconsRow';
import { ResponseCard } from './ResponseCard';
import { renderBold } from './renderBold';

interface PrebuiltMatchCardProps {
  response: PrebuiltMatchResponse;
  onConfigureDeploy: (integration: PrebuiltIntegration) => void;
}

export function PrebuiltMatchCard({ response, onConfigureDeploy }: PrebuiltMatchCardProps): JSX.Element {
  const integration = response.integrations[0];

  if (!integration) {
    return (
      <ResponseCard>
        <Typography variant="body2">No prebuilt integration found.</Typography>
      </ResponseCard>
    );
  }

  return (
    <ResponseCard
      actions={
        <Button variant="contained" color="primary" size="small" endIcon={<ArrowRight size={14} />} onClick={() => onConfigureDeploy(integration)}>
          Configure &amp; Deploy
        </Button>
      }>
      {response.message && (
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          {renderBold(response.message)}
        </Typography>
      )}

      <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <AppIconsRow applications={integration.applications} bidirectional={integration.bidirectional} avatarSize={24} bgcolor="action.hover" />
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {integration.displayName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {integration.applications.join(' • ')}
        </Typography>
      </Box>
    </ResponseCard>
  );
}
