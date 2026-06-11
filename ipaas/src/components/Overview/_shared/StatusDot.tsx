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
import type { ReactNode } from 'react';

const STATUS_DOT_MAP: Record<string, { label: string; dotColor: string }> = {
  ACTIVE: { label: 'Active', dotColor: 'success.main' },
  ERROR: { label: 'Error', dotColor: 'error.main' },
  IN_PROGRESS: { label: 'In Progress', dotColor: 'warning.main' },
  SUSPENDED: { label: 'Suspended', dotColor: 'text.disabled' },
  NOT_DEPLOYED: { label: 'Not Deployed', dotColor: 'text.disabled' },
};

/**
 * Presentational deployment-status dot + label. Renders nothing for an unknown
 * or absent status. Composed by the types that surface a deployment status
 * (e.g. integration-as-api); types without a status concept simply don't use it.
 */
export default function StatusDot({ status }: { status?: string | null }): ReactNode {
  const dot = status ? STATUS_DOT_MAP[status] : null;
  if (!dot) return null;
  return (
    <Stack direction="row" alignItems="center" gap={0.75} sx={{ flexShrink: 0 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dot.dotColor, flexShrink: 0 }} />
      <Typography variant="body2" color="text.secondary">
        {dot.label}
      </Typography>
    </Stack>
  );
}
