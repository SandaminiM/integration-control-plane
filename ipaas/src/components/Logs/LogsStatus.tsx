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
import { AUTO_FETCH_INTERVAL } from '../../utils/logs';
import { statusDotSx, statusPillSx } from './LogsStatus.styles';

export interface LogsStatusProps {
  live: boolean;
  /** Set when a query fails: turns the dot red and replaces the refresh note. */
  failure?: string;
  /** Why refresh is paused, when it is not simply switched off. */
  pausedNote?: string;
}

export default function LogsStatus({ live, failure, pausedNote = 'auto refresh is off' }: LogsStatusProps): JSX.Element {
  const label = failure ? 'Error' : live ? 'Live' : 'Paused';
  const note = failure ?? (live ? `refreshing every ${AUTO_FETCH_INTERVAL / 1000}s` : pausedNote);
  return (
    <Box role="status" aria-live="polite" sx={statusPillSx}>
      <Box component="span" aria-hidden sx={statusDotSx(failure ? 'error' : live ? 'live' : 'paused')} />
      <Typography component="span" variant="body2" sx={{ fontWeight: 600, ml: 0.5 }}>
        {label}
      </Typography>
      <Typography component="span" variant="body2" color="text.secondary">
        {note}
      </Typography>
    </Box>
  );
}
