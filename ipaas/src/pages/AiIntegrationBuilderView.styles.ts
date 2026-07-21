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

export const CHAT_COLUMN_SX: SxProps<Theme> = {
  width: '100%',
  maxWidth: 880,
  mx: 'auto',
};

export const CHAT_MESSAGES_SX: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2.5,
};

export const AGENT_ROW_SX: SxProps<Theme> = {
  display: 'flex',
  gap: 1.75,
  alignItems: 'flex-start',
};

export const STICKY_INPUT_SX: SxProps<Theme> = {
  position: 'sticky',
  bottom: 0,
  pt: 2,
  pb: 2,
  // aligns the input's left edge with the agent reply cards
  pl: '40px',
  zIndex: 1,
};

export const INPUT_BOX_SX: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 1,
  pl: 2,
  pr: 1,
  py: 1.5,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  // theme's `background.paper` is semi-transparent in dark mode, so use a solid fill
  bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.common.white),
};
