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
import type { PipelineStage } from '../../types/aiBuilder';
import { STAGE_LABELS } from '../../constants/aiBuilder';
import { LOADING_DOT_SX, LOADING_SKELETON_SX } from './styles';

const SKELETON_WIDTHS = ['75%', '60%', '80%'];

export function LoadingState({ currentStage }: { currentStage: PipelineStage | null }): JSX.Element {
  const label = currentStage ? (STAGE_LABELS[currentStage] ?? 'Analyzing…') : 'Analyzing your scenario…';

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, borderTopLeftRadius: 0.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={LOADING_DOT_SX(i)} />
          ))}
        </Box>
        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {SKELETON_WIDTHS.map((width) => (
          <Box key={width} sx={LOADING_SKELETON_SX(width)} />
        ))}
      </Box>
    </Box>
  );
}
