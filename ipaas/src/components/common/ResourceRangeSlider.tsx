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

interface ResourceRangeSliderProps {
  /** Left-hand title, e.g. "CPU Request / Limit". */
  label: string;
  /** Unit suffix in the value readout, e.g. "CPU" or "Mi". */
  unit: string;
  min: number;
  max: number;
  step: number;
  /** Lower thumb — the resource request. */
  request: number;
  /** Upper thumb — the resource limit. */
  limit: number;
  onRequestChange?: (value: number) => void;
  onLimitChange?: (value: number) => void;
  /** Minimum distance kept between request and limit. */
  minGap?: number;
  disabled?: boolean;
  /** Read-only display (both thumbs, no interaction). */
  viewMode?: boolean;
  /** Format the request/limit numbers in the readout (defaults to `String`). */
  format?: (value: number) => string;
}

/**
 * A dual-thumb "Request / Limit" slider (Devant's DoubleSlider). The lower thumb
 * is the request, the upper the limit; a minimum gap is enforced between them.
 * Reused by Containers today and available to Scaling.
 */
export default function ResourceRangeSlider({ label, unit, min, max, step, request, limit, onRequestChange, onLimitChange, minGap = 0, disabled, viewMode, format = String }: ResourceRangeSliderProps): JSX.Element {
  const handleChange = (_e: Event, value: number | number[], activeThumb: number): void => {
    if (viewMode || !Array.isArray(value)) return;
    const [nextRequest, nextLimit] = value;
    if (activeThumb === 0) {
      // Moving the request: never within `minGap` of the limit.
      const clamped = Math.min(nextRequest, limit - minGap);
      if (clamped !== request) onRequestChange?.(clamped);
    } else {
      const clamped = Math.max(nextLimit, request + minGap);
      if (clamped !== limit) onLimitChange?.(clamped);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {format(request)}/{format(limit)} {unit}
        </Typography>
      </Stack>
      <Box sx={{ px: 1 }}>
        <Slider value={[request, limit]} min={min} max={max} step={step} disabled={disabled || viewMode} disableSwap onChange={handleChange} valueLabelDisplay={viewMode ? 'off' : 'auto'} valueLabelFormat={(v) => format(v as number)} aria-label={label} />
      </Box>
    </Box>
  );
}
