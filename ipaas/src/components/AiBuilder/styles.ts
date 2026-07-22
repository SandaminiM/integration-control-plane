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

import type { SxProps, Theme } from '@wso2/oxygen-ui';

// Chat-bubble shape shared by every agent reply card: sharp top-left corner
// mirrors the user bubble's sharp top-right corner.
export const RESPONSE_CARD_SX: SxProps<Theme> = {
  p: 2,
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  borderTopLeftRadius: 0.25,
};

export const RESPONSE_CARD_ERROR_SX: SxProps<Theme> = {
  ...RESPONSE_CARD_SX,
  borderColor: 'error.main',
};

export const RESPONSE_CARD_ACTIONS_SX: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 1,
};

export const PLAN_STEP_NUMBER_SX: SxProps<Theme> = {
  width: 26,
  height: 26,
  borderRadius: '50%',
  bgcolor: (theme) => `${theme.palette.primary.main}1f`,
  color: 'primary.main',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 700,
};

export const PLAN_STEP_CONNECTOR_SX: SxProps<Theme> = {
  width: '2px',
  flex: 1,
  minHeight: 14,
  my: 0.5,
  bgcolor: (theme) => `${theme.palette.primary.main}33`,
};

export const LOADING_DOT_SX = (index: number): SxProps<Theme> => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  bgcolor: 'primary.main',
  opacity: 0.6,
  animation: `ai-dot-pulse 1.5s ease-in-out ${index * 0.2}s infinite`,
  '@keyframes ai-dot-pulse': {
    '0%, 100%': { opacity: 0.6 },
    '50%': { opacity: 1 },
  },
});

export const LOADING_SKELETON_SX = (width: string): SxProps<Theme> => ({
  height: 8,
  width,
  bgcolor: 'action.hover',
  borderRadius: 1,
  animation: 'ai-skeleton-shimmer 2s infinite',
  '@keyframes ai-skeleton-shimmer': {
    '0%': { opacity: 0.5 },
    '50%': { opacity: 1 },
    '100%': { opacity: 0.5 },
  },
});
