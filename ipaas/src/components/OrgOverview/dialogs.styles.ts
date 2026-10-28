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

import { LIT_ICON_SX, primaryTint as tint } from '../../constants/styles';

type PrimaryTheme = { palette: { primary: { main: string } } };

export const dialogPaper = {
  borderRadius: 1.5,
  p: { xs: 1, sm: 2 },
} as const;

export const dialogHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 3,
} as const;

export const closeButton = {
  width: 36,
  height: 36,
  flexShrink: 0,
  border: 1,
  borderColor: 'divider',
  borderRadius: 1,
  color: 'text.secondary',
  '&:hover': { color: 'text.primary' },
} as const;

export const optionGrid = {
  display: 'grid',
  gap: 1.75,
  mt: 3.5,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
} as const;

// A plain Card, as API Manager uses, so the theme supplies the acrylic background, border and blur.
export const optionCard = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 2.25,
  p: 2.75,
  cursor: 'default',
  borderRadius: 1.25,
  transition: 'all 0.18s ease',
  '&:hover': {
    borderColor: tint(45),
    transform: 'translateY(-2px)',
    boxShadow: (t: PrimaryTheme) => `0 12px 32px ${tint(12)(t)}`,
  },
  '&:hover .catalog-arrow': { color: 'primary.main' },
} as const;

export const optionCardTop = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
} as const;

export const optionIcon = {
  ...LIT_ICON_SX,
  width: 44,
  height: 44,
} as const;

export const optionArrow = {
  display: 'flex',
  color: 'text.disabled',
  transition: 'color 0.18s ease',
} as const;

// Inside the content box, so its right edge lines up with the dropdown's.
export const pickerActions = {
  display: 'flex',
  justifyContent: 'flex-end',
  mt: 3,
  mb: 1,
} as const;
