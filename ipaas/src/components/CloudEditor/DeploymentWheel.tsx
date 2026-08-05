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

import { Box, CircularProgress, Typography } from '@wso2/oxygen-ui';
import { Check } from '@wso2/oxygen-ui-icons-react';
import type { ReactNode } from 'react';
import type { CloudEditorStep } from '../../types/cloudEditor';
import { CLOUD_EDITOR_WHEEL_ROW_HEIGHT } from '../../constants/cloudEditor';
import { WHEEL_ICON_SX, WHEEL_INNER_SX, WHEEL_ROW_SX, WHEEL_VIEWPORT_SX } from './DeploymentWheel.styles';

/**
 * iOS-timer-style wheel: the active step is centred; completed steps scroll up,
 * upcoming steps sit below, both fading toward the edges.
 */
export default function DeploymentWheel({ steps, activeIndex }: { steps: CloudEditorStep[]; activeIndex: number }): ReactNode {
  return (
    <Box sx={WHEEL_VIEWPORT_SX}>
      <Box sx={WHEEL_INNER_SX} style={{ transform: `translateY(calc(50% - ${(activeIndex + 0.5) * CLOUD_EDITOR_WHEEL_ROW_HEIGHT}px))` }}>
        {steps.map((step, idx) => {
          const absOffset = Math.abs(idx - activeIndex);
          const opacity = absOffset === 0 ? 1 : Math.max(0.22, 1 - 0.18 * absOffset);
          const blurPx = absOffset === 0 ? 0 : Math.min(5, 0.9 * absOffset);
          const state = idx < activeIndex ? 'complete' : idx === activeIndex ? 'active' : 'pending';
          return (
            <Box key={step.key} sx={WHEEL_ROW_SX} style={{ opacity, filter: blurPx ? `blur(${blurPx}px)` : 'none' }}>
              <Box sx={WHEEL_ICON_SX}>
                {state === 'complete' && <Check size={16} />}
                {state === 'active' && <CircularProgress size={14} thickness={5} />}
              </Box>
              <Typography variant="body1" noWrap sx={{ color: state === 'active' ? 'text.primary' : state === 'complete' ? 'text.secondary' : 'text.disabled', fontWeight: state === 'active' ? 600 : 400 }}>
                {step.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
