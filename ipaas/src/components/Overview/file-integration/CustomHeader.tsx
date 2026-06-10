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

import { Chip, IconButton, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { RefreshCw } from '@wso2/oxygen-ui-icons-react';
import type { ReactNode } from 'react';
import type { CustomHeaderProps } from '../../../types/integration';

/**
 * File-integration's bespoke header. A file integration has no deployment
 * status dot, no commit line and no actions — its meaningful per-env signal is
 * the runtime log stream — so it opts out of the generic `EnvCardHeader` frame
 * and shows only the env name, a Critical chip, and the (shell-owned) Refresh.
 */
export default function CustomHeader({ env, isRefreshing, onRefresh }: CustomHeaderProps): ReactNode {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography variant="h6">{env.name}</Typography>
        {env.critical && <Chip label="Critical" size="small" color="warning" variant="outlined" />}
      </Stack>
      <Tooltip title="Refresh logs">
        <span>
          <IconButton size="small" onClick={onRefresh} aria-label="Refresh logs" disabled={isRefreshing}>
            <RefreshCw size={16} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none', transformOrigin: 'center' }} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
