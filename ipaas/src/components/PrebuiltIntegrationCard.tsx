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

import { Box, Chip, Typography } from '@wso2/oxygen-ui';
import type { JSX } from 'react';
import { formatComponentType } from '../constants/integrations';
import type { PrebuiltIntegration } from '../types/samples';
import AppAvatar from './AppAvatar';

interface PrebuiltIntegrationCardProps {
  integration: PrebuiltIntegration;
  selected: boolean;
  onClick: () => void;
}

/** Arrow / double-arrow SVG between app icons */
function FlowArrow({ bidirectional }: { bidirectional: boolean }): JSX.Element {
  return (
    <Box sx={{ mx: 0.75, color: 'text.disabled', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {bidirectional ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 5h10L9 3m2 2L9 7M13 9H3l2 2M3 9l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10M9 4l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </Box>
  );
}

export default function PrebuiltIntegrationCard({ integration, selected, onClick }: PrebuiltIntegrationCardProps): JSX.Element {
  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          if (e.key === ' ' || e.key === 'Spacebar') e.preventDefault();
          onClick();
        }
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2.5,
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: 2,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'border-color 0.15s, background-color 0.15s',
        bgcolor: selected ? 'primary.50' : 'background.paper',
        '&:hover': { borderColor: 'primary.main' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}>
      {/* App icon flow */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, mr: 2, pl: 1 }}>
        {integration.applications.map((app, i) => (
          <Box key={app} sx={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && <FlowArrow bidirectional={integration.bidirectional} />}
            <AppAvatar name={app} size={32} />
          </Box>
        ))}
      </Box>

      {/* Text */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="primary.main" sx={{ display: 'block', mb: 0.25, fontWeight: 500 }}>
          {formatComponentType(integration.componentType)}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>
          {integration.displayName}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
          {integration.description}
        </Typography>
        {integration.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {integration.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} label={tag} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
