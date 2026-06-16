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
  const borderColor = colors.border ?? colors.badgeBg;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ border: '0.5px solid', borderColor, borderRadius: 0.5, px: 1.5, py: 1, bgcolor: colors.cardBg }}>
        <Box sx={{ bgcolor: colors.badgeBg, color: colors.badgeText ?? '#fff', fontWeight: 700, fontSize: '11px', minWidth: 64, px: 1, py: 0.5, borderRadius: 0.5, textAlign: 'center', flexShrink: 0 }}>{badgeLabel}</Box>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500, wordBreak: 'break-word', color: 'text.primary' }}>
          {label}
        </Typography>
      </Stack>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, px: 0.5 }}>
          Description: {description}
        </Typography>
      )}
    </Box>
  );
}
