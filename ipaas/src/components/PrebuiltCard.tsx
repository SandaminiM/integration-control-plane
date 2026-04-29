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

import { Box, Typography } from '@wso2/oxygen-ui';
import type { JSX } from 'react';
import type { PrebuiltIntegration } from '../types/samples';
import AppIconsRow from './AppIconsRow';

export default function PrebuiltCard({ integration, onClick }: { integration: PrebuiltIntegration; onClick?: () => void }): JSX.Element {
  return (
      <Box
        onClick={onClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          p: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          bgcolor: 'background.paper',
          cursor: onClick ? 'pointer' : 'default',
          userSelect: 'none',
          gap: 1.5,
          transition: 'border-color 0.15s',
          ...(onClick ? { '&:hover': { borderColor: 'primary.main' } } : {}),
        }}>
        <AppIconsRow
          applications={integration.applications}
          bidirectional={integration.bidirectional}
          bgcolor="action.hover"
          avatarSize={28}
        />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600}>
            {integration.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {integration.applications.join(' • ')}
          </Typography>
        </Box>
      </Box>
  );
}
