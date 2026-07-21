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

import { Box, Skeleton, Stack, Typography, Paper } from '@wso2/oxygen-ui';
import { BarChart } from '@wso2/oxygen-ui-charts-react';
import type { JSX } from 'react';
import { InsightsCard, ChartBox } from './shared';
import type { ProjectActivityChart } from '../../types/insights';

/** "Activity over time" — one bar chart per integration type, each in its own
 * native unit and scale. Header per mini shows a color dot + title + unit on the
 * left and the bucket-summed total on the right. */
export function ActivityOverTime({ charts, loading = false }: { charts: ProjectActivityChart[]; loading?: boolean }): JSX.Element {
  return (
    <InsightsCard title="Activity over time" subtitle="Requests, runs, invocations and events over selected period">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {charts.map((c) => (
          <Paper key={c.key} sx={{ borderRadius: 0.75, p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c.color, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {c.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {c.unit}
                </Typography>
              </Stack>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {c.total}
              </Typography>
            </Stack>
            {loading ? (
              <Skeleton variant="rounded" height={200} />
            ) : (
              <ChartBox>
                <BarChart data={c.points} xAxisDataKey="label" xAxis={{ show: true }} yAxis={{ show: true }} height={150} bars={[{ dataKey: 'count', name: c.title, fill: c.color, radius: [2, 2, 0, 0] }]} legend={{ show: false }} grid={{ show: true }} tooltip={{ show: true }} margin={{ top: 8, right: 12, left: -16, bottom: 0 }} />
              </ChartBox>
            )}
          </Paper>
        ))}
      </Box>
    </InsightsCard>
  );
}
