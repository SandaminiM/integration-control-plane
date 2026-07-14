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

import { Box, Stack, Typography } from '@wso2/oxygen-ui';
import type { JSX, ReactNode } from 'react';

/** Same card chrome as the project Insights view (`pages/ProjectInsights.tsx`), shared here so all three views look like one page. */
export function InsightsCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }): JSX.Element {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
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
      {children}
    </Box>
  );
}

export function KpiTile({ label, value, sub, danger }: { label: string; value: string; sub: string; danger?: boolean }): JSX.Element {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 1, fontWeight: 500, color: danger ? 'error.main' : 'text.primary' }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {sub}
      </Typography>
    </Box>
  );
}

/** Chart wrapper matching the project page's chart styling: faint grid lines,
 * and kills the chart lib's hardcoded inline `paddingTop: 32` on the recharts
 * legend wrapper (inline style — only `!important` beats it). */
export function ChartBox({ children }: { children: ReactNode }): JSX.Element {
  return <Box sx={{ '& .recharts-cartesian-grid line': { opacity: 0.3 }, '& .recharts-legend-wrapper': { paddingTop: '0 !important' } }}>{children}</Box>;
}
