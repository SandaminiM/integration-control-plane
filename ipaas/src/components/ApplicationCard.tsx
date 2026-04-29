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
import { CheckCircle } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import AppAvatar from './AppAvatar';

interface ApplicationCardProps {
  name: string;
  selected: boolean;
  onClick: () => void;
  avatarSize?: number;
}

export default function ApplicationCard({ name, selected, onClick, avatarSize = 40 }: ApplicationCardProps): JSX.Element {
  const isLarge = avatarSize > 40;
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
        flexDirection: 'column',
        alignItems: 'center',
        gap: isLarge ? 1.5 : 1,
        p: isLarge ? 2.5 : 1.5,
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: 1,
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
        transition: 'border-color 0.15s, background-color 0.15s',
        bgcolor: selected ? 'primary.50' : 'background.paper',
        '&:hover': { borderColor: 'primary.main' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        minWidth: isLarge ? 110 : 80,
      }}>
      {selected && (
        <Box sx={{ position: 'absolute', top: 6, right: 6, color: 'primary.main', display: 'flex' }}>
          <CheckCircle size={16} />
        </Box>
      )}
      <AppAvatar name={name} size={avatarSize} />
      <Typography variant={isLarge ? 'body2' : 'caption'} fontWeight={600} textAlign="center" sx={{ lineHeight: 1.2 }}>
        {name}
      </Typography>
    </Box>
  );
}
