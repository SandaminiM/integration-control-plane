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

import { Box, MenuItem, Skeleton, Stack, TextField, Typography } from '@wso2/oxygen-ui';
import { BarChart } from '@wso2/oxygen-ui-charts-react';
import { useState, type JSX } from 'react';
import { InsightsCard, ChartBox } from './shared';
import { UNIT_BY_KIND } from '../../constants/insights';
import type { InsightsRange, IntegrationKind, ProjectActivityData } from '../../types/insights';

const ALL = 'all';

/** "Activity over time" — a single bar chart across all integration types with a
 * type filter (top-right). "All" groups every type's per-bucket count in its own
 * color (with a custom legend beneath); picking a type shows that type alone as
 * wider bars. The chart's built-in legend is avoided — enabling it blanks this
 * wrapper — so the legend is rendered by us. */
export function ActivityOverTime({ chart, range, loading = false }: { chart: ProjectActivityData; range: InsightsRange; loading?: boolean }): JSX.Element {
  const [sel, setSel] = useState<string>(ALL);
  const showAll = sel === ALL;
  const series = showAll ? chart.series : chart.series.filter((s) => s.key === sel);
  // "All": stack every type into one bar per bucket — a bucket's bar divides into
  // as many segments as there are types with a non-zero count that day. `radius: 0`
  // is required (the wrapper defaults an omitted radius to [4,4,0,0], which recharts
  // renders as empty for stacked segments). Single type: one rounded, wider bar.
  const bars = series.map((s) => ({
    dataKey: s.key,
    name: s.label,
    fill: s.color,
    ...(showAll ? { stackId: 'activity', radius: 0 as const } : { radius: [2, 2, 0, 0] as [number, number, number, number] }),
  }));

  const unit = showAll ? 'activity' : UNIT_BY_KIND[sel as IntegrationKind];
  const subtitle = `All ${unit} over last ${range}`;

  const filter = (
    <TextField select size="small" value={sel} onChange={(e) => setSel(e.target.value)} inputProps={{ 'aria-label': 'Integration type' }} sx={{ minWidth: 190 }}>
      <MenuItem value={ALL}>All types</MenuItem>
      {chart.series.map((s) => (
        <MenuItem key={s.key} value={s.key}>
          {s.label}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <InsightsCard title="Activity over time" subtitle={subtitle} action={filter}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {loading ? (
        <Skeleton variant="rounded" height={300} />
      ) : (
        <>
          <ChartBox>
            <BarChart
              data={chart.points}
              xAxisDataKey="label"
              xAxis={{ show: true }}
              yAxis={{ show: true }}
              height={300}
              bars={bars}
              legend={{ show: false }}
              grid={{ show: true }}
              tooltip={{ show: true }}
              barGap={1}
              barCategoryGap={'20%'}
              maxBarSize={56}
              margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
            />
          </ChartBox>
          {showAll && (
            <Stack direction="row" flexWrap="wrap" gap={1.5} justifyContent="center" sx={{ mt: 3, mb: 1 }}>
              {chart.series.map((s) => (
                <Stack key={s.key} direction="row" alignItems="center" gap={0.75}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: s.color, flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary">
                    {s.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </>
      )}
      </Box>
    </InsightsCard>
  );
}
