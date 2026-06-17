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
import type { OperationTileColors } from './OperationTile';
import { OPERATION_DESCRIPTION_SX, OPERATION_HEADER_LABEL_SX, operationBadgeSx, operationHeaderRowSx } from './styles';

interface OperationHeaderProps {
  /** Text inside the coloured badge (e.g. `'GET'`, `'TOOL'`). */
  badgeLabel: string;
  /** Operation path or tool name shown next to the badge. */
  label: string;
  colors: OperationTileColors;
  /** Optional description shown below the badge + label row. */
  description?: string;
}

/**
 * In-drawer header that mirrors the {@link OperationTile} row (coloured badge +
 * path / name), optionally followed by a description. Rendered at the top of an
 * operation drawer's content so the drawer visually echoes the tile that opened
 * it. The reusable counterpart of devant's `OperationViews/OperationHeader`.
 */
export default function OperationHeader({ badgeLabel, label, colors, description }: OperationHeaderProps): ReactNode {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" alignItems="center" gap={1.5} sx={operationHeaderRowSx(colors)}>
        <Box sx={operationBadgeSx(colors, 64)}>{badgeLabel}</Box>
        <Typography variant="body2" sx={OPERATION_HEADER_LABEL_SX}>
          {label}
        </Typography>
      </Stack>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={OPERATION_DESCRIPTION_SX}>
          Description: {description}
        </Typography>
      )}
    </Box>
  );
}
