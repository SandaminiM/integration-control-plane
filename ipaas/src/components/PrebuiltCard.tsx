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

import { Box, Tooltip, Typography } from '@wso2/oxygen-ui';
import type { JSX } from 'react';
import type { PrebuiltIntegration } from '../types/samples';
import AppAvatar from './AppAvatar';

export default function PrebuiltCard({ integration, onClick }: { integration: PrebuiltIntegration; onClick?: () => void }): JSX.Element {
  return (
    <Tooltip title="Prebuilt Integration Configuration is coming soon" placement="top" arrow>
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
        {/* Application icon flow */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            bgcolor: 'action.hover',
            p: 1,
            borderRadius: 1,
            flexShrink: 0,
          }}>
          {integration.applications.map((app, index) => (
            <Box key={app} sx={{ display: 'flex', alignItems: 'center' }}>
              <AppAvatar name={app} />
              {index < integration.applications.length - 1 && (
                <Box sx={{ mx: 0.5, color: 'text.disabled', display: 'flex', alignItems: 'center' }}>
                  {integration.bidirectional ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 5h10L9 3m2 2L9 7M13 9H3l2 2M3 9l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M9 4l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Box>

        {/* Text */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600}>
            {integration.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {integration.applications.join(' • ')}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}
