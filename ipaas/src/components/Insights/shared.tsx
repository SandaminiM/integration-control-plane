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

import { Box, Button, ListingTable, MenuItem, Paper, Skeleton, Stack, StatCard, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@wso2/oxygen-ui';
import { Download } from '@wso2/oxygen-ui-icons-react';
import { AreaChart } from '@wso2/oxygen-ui-charts-react';
import type { JSX, ReactNode } from 'react';
import { INSIGHTS_RANGES, KPI_ICONS } from '../../constants/insights';
import type { InsightsRange } from '../../types/insights';

const TOGGLE_SX = { px: 1.5, textTransform: 'none' } as const;

/** Same card chrome as the project Insights view (`pages/ProjectInsights.tsx`), shared here so all three views look like one page.
 * `plain` keeps the surface as a bordered Box — used by cards wrapping a table, which bring their own surface. */
export function InsightsCard({ title, subtitle, action, children, fill = true, plain = false }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; fill?: boolean; plain?: boolean }): JSX.Element {
  const header = (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1.5} sx={{ mb: 2 }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );

  if (plain) {
    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5, height: fill ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
        {header}
        {children}
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: fill ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
      {header}
      {children}
    </Paper>
  );
}

/** Chart wrapper matching the project page's chart styling: faint grid lines,
 * and kills the chart lib's hardcoded inline `paddingTop: 32` on the recharts
 * legend wrapper (inline style — only `!important` beats it). `padded` adds the
 * 24px top gap the project/automation trend cards use above their charts. */
export function ChartBox({ children, padded = false }: { children: ReactNode; padded?: boolean }): JSX.Element {
  return (
    <Box sx={{ ...(padded ? { paddingTop: '24px' } : null), '& .recharts-cartesian-grid line': { opacity: 0.3 }, '& .recharts-legend-wrapper': { paddingTop: '0 !important', top: '0 !important' } }}>{children}</Box>
  );
}

interface TrendAreaChartProps {
  data: unknown[];
  xKey?: string;
  xName?: string;
  yName?: string;
  height?: number;
  areas: { key: string; name: string; color: string; stackId?: string }[];
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  /** add the 24px top gap the project/automation trend cards use */
  padded?: boolean;
  /** show a skeleton placeholder instead of the chart while data loads */
  loading?: boolean;
}

/** Stacked/overlaid area trend chart — fills the repeated AreaChart boilerplate
 * shared by every insights trend widget (grid, top legend, monotone areas at
 * 0.2 fill opacity, tooltip). */
export function TrendAreaChart({ data, xKey = 'label', xName, yName, height, areas, margin, padded = false, loading = false }: TrendAreaChartProps): JSX.Element {
  if (loading) return <Skeleton variant="rounded" height={height ?? 320} />;
  return (
    <ChartBox padded={padded}>
      <AreaChart
        data={data}
        xAxisDataKey={xKey}
        xAxis={{ show: true, name: xName }}
        yAxis={{ show: true, name: yName }}
        height={height}
        colors={areas.map((a) => a.color)}
        areas={areas.map((a) => ({ dataKey: a.key, name: a.name, type: 'monotone', stackId: a.stackId, stroke: a.color, fill: a.color, fillOpacity: 0.2 }))}
        legend={{ show: true, verticalAlign: 'top' }}
        margin={margin ?? { top: 16 }}
        tooltip={{ show: true }}
        grid={{ show: true }}
      />
    </ChartBox>
  );
}

interface InsightsControlsProps {
  envOptions: { id: string; name: string }[];
  envId: string;
  onEnvChange: (id: string) => void;
  range: InsightsRange;
  onRangeChange: (r: InsightsRange) => void;
  onReport: () => void;
}

/** Environment select + range toggle + Report button cluster shared by the
 * project and integration insights pages. */
export function InsightsControls({ envOptions, envId, onEnvChange, range, onRangeChange, onReport }: InsightsControlsProps): JSX.Element {
  return (
    <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
      {envOptions.length > 0 && (
        <TextField select size="small" value={envId} onChange={(e) => onEnvChange(e.target.value)} sx={{ minWidth: 160 }}>
          {envOptions.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.name}
            </MenuItem>
          ))}
        </TextField>
      )}
      <ToggleButtonGroup exclusive size="small" value={range} onChange={(_, v: InsightsRange | null) => v && onRangeChange(v)}>
        {INSIGHTS_RANGES.map((r) => (
          <ToggleButton key={r.value} value={r.value} sx={TOGGLE_SX}>
            {r.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Button variant="contained" size="small" startIcon={<Download size={16} />} onClick={onReport}>
        Report
      </Button>
    </Stack>
  );
}

/** KPI stat-card row shared by all three insights views. While `loading`, each
 * card keeps its label + icon and shows a skeleton in place of the value.
 * StatCard renders `value` straight into a Typography, so a node works at
 * runtime; its prop type is string|number, hence the localized cast. */
export function KpiCards({ kpis, loading = false, lgColumns = 4 }: { kpis: { key: string; label: string; value: string }[]; loading?: boolean; lgColumns?: number }): JSX.Element {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: `repeat(${lgColumns}, 1fr)` }, gap: 2 }}>
      {kpis.map((k) => (
        <StatCard
          key={k.key}
          label={k.label}
          icon={KPI_ICONS[k.key]?.icon}
          iconColor={KPI_ICONS[k.key]?.color}
          value={loading ? ((<Skeleton variant="text" width={72} sx={{ fontSize: (t) => t.typography.h5.fontSize }} />) as unknown as string) : k.value}
        />
      ))}
    </Box>
  );
}

/** Skeleton body rows for a ListingTable while its data loads (headers stay real). */
export function TableSkeletonRows({ rows = 5, cols }: { rows?: number; cols: number }): JSX.Element {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <ListingTable.Row key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <ListingTable.Cell key={c}>
              <Skeleton variant="text" />
            </ListingTable.Cell>
          ))}
        </ListingTable.Row>
      ))}
    </>
  );
}
