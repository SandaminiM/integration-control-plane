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
import UsageBar from './UsageBar';

const cell = { minWidth: 140 } as const;

interface PodUsageCellProps {
  used: number;
  limit: number;
  display: string;
}

/** Used-vs-limit figure with the matching bar, for the CPU and Memory columns. */
export default function PodUsageCell({ used, limit, display }: PodUsageCellProps): JSX.Element {
  const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
  return (
    <Box sx={cell}>
      <Typography variant="caption" color="text.secondary">
        {display}
      </Typography>
      <UsageBar percent={percent} />
    </Box>
  );
}
