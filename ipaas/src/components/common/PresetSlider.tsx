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

import { Box, Slider, Stack, Typography } from '@wso2/oxygen-ui';
import type { JSX } from 'react';

interface PresetSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  /** Allowed stops; the slider snaps to these (step is disabled). */
  marks: number[];
  unit?: string;
  onChange?: (value: number) => void;
  viewMode?: boolean;
  disabled?: boolean;
  /** Helper text shown under the slider (edit mode). */
  description?: string;
}

/**
 * A slider that snaps to preset marks with a `value/max unit` readout — Devant's
 * RangeSlider used for health-check timings and thresholds. Reused for both the
 * read-only probe display and the editable probe form.
 */
export default function PresetSlider({ label, value, min, max, marks, unit = '', onChange, viewMode, disabled, description }: PresetSliderProps): JSX.Element {
  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {value}/{max}
          {unit ? ` ${unit}` : ''}
        </Typography>
      </Stack>
      <Box sx={{ px: 1 }}>
        <Slider value={value} min={min} max={max} step={null} marks={marks.map((v) => ({ value: v }))} disabled={disabled || viewMode} onChange={(_e, v) => onChange?.(v as number)} valueLabelDisplay={viewMode ? 'off' : 'auto'} aria-label={label} />
      </Box>
      {description && !viewMode && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}
