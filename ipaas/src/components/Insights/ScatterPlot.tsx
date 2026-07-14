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

import { Box, useTheme } from '@wso2/oxygen-ui';
import { type JSX } from 'react';

export interface ScatterPlotPoint {
  label: string;
  /** y-value in the chart's own unit (e.g. seconds) */
  value: number;
  color: string;
  tooltip?: string;
}

interface ScatterPlotProps {
  points: ScatterPlotPoint[];
  height?: number;
  /** appended to the y-axis tick labels, e.g. 's' */
  yUnit?: string;
}

/**
 * Minimal scatter chart — one point per run, connected by a faint trend line.
 * `@wso2/oxygen-ui-charts-react` has no scatter chart type (only Area/Bar/Pie/
 * Line/RadialBar/Radar), so this is a small self-contained SVG, in the same
 * spirit as the source design's own hand-rolled `mkScatter`.
 */
export default function ScatterPlot({ points, height = 220, yUnit = '' }: ScatterPlotProps): JSX.Element {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const gridColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const axisColor = dark ? 'rgba(208,211,226,0.55)' : 'rgba(64,64,75,0.55)';

  if (points.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box component="span" sx={{ fontSize: 13, color: 'text.secondary' }}>
          No executions in range
        </Box>
      </Box>
    );
  }

  const w = 560;
  const H = height;
  const pl = 42;
  const pr = 14;
  const pt = 14;
  const pb = 26;
  const n = points.length;
  const maxY = Math.max(1, ...points.map((p) => p.value)) * 1.2;

  const x = (i: number) => pl + ((w - pl - pr) * (n <= 1 ? 0 : i)) / Math.max(1, n - 1);
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / maxY);

  const gridLines = 4;
  const gridEls = Array.from({ length: gridLines + 1 }, (_, g) => {
    const yy = pt + ((H - pt - pb) * g) / gridLines;
    const val = maxY * (1 - g / gridLines);
    return (
      <g key={g}>
        <line x1={pl} x2={w - pr} y1={yy} y2={yy} stroke={gridColor} />
        <text x={pl - 7} y={yy + 3} textAnchor="end" fontSize={10} fill={axisColor}>
          {Math.round(val)}
          {yUnit}
        </text>
      </g>
    );
  });

  const step = Math.max(1, Math.ceil(n / 6));
  const xLabels = points
    .map((p, i) => (i % step === 0 ? { i, label: p.label } : null))
    .filter((v): v is { i: number; label: string } => v !== null)
    .map(({ i, label }) => (
      <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={9.5} fill={axisColor}>
        {label}
      </text>
    ));

  const linePath = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');

  return (
    <Box sx={{ height, width: '100%' }}>
      <svg viewBox={`0 0 ${w} ${H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
        {gridEls}
        <path d={linePath} fill="none" stroke={theme.palette.warning.main} strokeWidth={1.2} opacity={0.3} />
        {xLabels}
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={3.6} fill={p.color} stroke={dark ? '#111' : '#fff'} strokeWidth={1}>
            {p.tooltip && <title>{p.tooltip}</title>}
          </circle>
        ))}
      </svg>
    </Box>
  );
}
