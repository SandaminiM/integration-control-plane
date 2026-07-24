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

import type { CSSProperties } from 'react';
import type { SxProps, Theme } from '@wso2/oxygen-ui';

// Orange border + soft glow are always present; both intensify on focus, and a
// traveling conic-gradient ring animates around the border (see index.css
// @property --ai-glow-angle).
export const landingCardSx =
  (focused: boolean): SxProps<Theme> =>
  (theme) => {
    const c = theme.palette.primary.main;
    const cLight = theme.palette.primary.light;
    return {
      height: '100%',
      position: 'relative',
      borderRadius: 1,
      p: 1,
      border: '1.5px solid',
      borderColor: focused ? 'transparent' : `${c}66`,
      boxShadow: focused ? `0 0 18px 0 ${c}59` : `0 0 10px 0 ${c}26`,
      transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: '-1.5px',
        borderRadius: 'inherit',
        padding: '1.5px',
        background: `conic-gradient(from var(--ai-glow-angle), ${c}00 0%, ${c} 12%, ${cLight} 25%, ${c} 38%, ${c}00 50%, ${c}00 100%)`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        opacity: focused ? 1 : 0.5,
        transition: 'opacity 0.3s ease',
        animation: 'ai-glow-rotate 2.5s linear infinite',
        pointerEvents: 'none',
      },
    };
  };

export const EXAMPLE_CHIP_SX: SxProps<Theme> = {
  textTransform: 'none',
  color: 'text.secondary',
  borderColor: 'divider',
  borderRadius: 5,
  fontSize: '0.75rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'block',
  maxWidth: 260,
  flexShrink: 1,
  minWidth: 0,
};

export const PROMPT_TEXTAREA_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: 160,
  padding: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: '0.8125rem',
  lineHeight: 1.6,
  resize: 'none',
  color: 'inherit',
};
