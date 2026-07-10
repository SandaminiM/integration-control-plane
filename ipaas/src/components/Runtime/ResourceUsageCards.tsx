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

import { Card, CardContent, Grid, Stack, Typography } from '@wso2/oxygen-ui';
import { type JSX } from 'react';
import { formatBytes, formatVcpu } from '../../utils/podMetrics';
import type { CalculatedUsage } from '../../types/runtime';
import UsageBar from './UsageBar';

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
} as const;

export default function ResourceUsageCards({ usage }: { usage: CalculatedUsage }): JSX.Element {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card elevation={0} sx={cardSx}>
          <CardContent>
            <Stack gap={1.5}>
              <Typography variant="h6">CPU Usage</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatVcpu(usage.cpu.used)} of {formatVcpu(usage.cpu.limits)} total allocated vCPU used
              </Typography>
              <UsageBar percent={usage.cpu.usagePercent} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card elevation={0} sx={cardSx}>
          <CardContent>
            <Stack gap={1.5}>
              <Typography variant="h6">Memory Usage</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatBytes(usage.memory.used)} of {formatBytes(usage.memory.limits)} total allocated memory used
              </Typography>
              <UsageBar percent={usage.memory.usagePercent} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
