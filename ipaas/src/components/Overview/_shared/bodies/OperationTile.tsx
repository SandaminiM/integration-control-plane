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

import { Box, Button, Drawer, IconButton, Stack, Typography } from '@wso2/oxygen-ui';
import { X } from '@wso2/oxygen-ui-icons-react';
import { useState, type ReactNode } from 'react';

/**
 * Colour configuration for an operation tile + its drawer header. Each consumer
 * supplies its own palette — Integration as API uses per-HTTP-method colours,
 * MCP Server uses the brand primary. Values may be theme tokens
 * (e.g. `'primary.main'`) or raw CSS colours (e.g. `'#0095FF'`); both resolve
 * through MUI's `sx`.
 */
export interface OperationTileColors {
  /** Badge background. */
  badgeBg: string;
  /** Badge text colour (default white). */
  badgeText?: string;
  /** Tile / header border colour (defaults to `badgeBg`, matching the API method tiles). */
  border?: string;
  /** Optional tile / header background. */
  cardBg?: string;
}

interface OperationTileProps {
  /** Text inside the coloured badge (e.g. `'GET'`, `'TOOL'`). */
  badgeLabel: string;
  /** Operation path or tool name shown next to the badge. */
  label: string;
  colors: OperationTileColors;
  /** Body rendered inside the right drawer (use `OperationHeader` at its top). */
  drawerContent: ReactNode;
  /** Drawer title (default `'Details'`). */
  drawerTitle?: ReactNode;
  /** Drawer width in px (default 720; MCP tools use a narrower drawer). */
  drawerWidth?: number;
}

/**
 * Generic operation row used across Overview env-card bodies: a coloured type
 * badge, the operation path / name, and a "View Details" action that opens a
 * right drawer. The reusable counterpart of devant's `OperationViews/OperationTile`
 * — Integration as API and MCP Server share this, differing only in `colors`
 * and `drawerContent`.
 */
export default function OperationTile({ badgeLabel, label, colors, drawerContent, drawerTitle = 'Details', drawerWidth = 720 }: OperationTileProps): ReactNode {
  const [open, setOpen] = useState(false);
  const borderColor = colors.border ?? colors.badgeBg;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 0.75, mb: 0.75, border: '0.5px solid', borderColor, borderRadius: 0.5, bgcolor: colors.cardBg, '&:last-child': { mb: 0 } }}>
        <Box sx={{ bgcolor: colors.badgeBg, color: colors.badgeText ?? '#fff', fontWeight: 700, fontSize: '11px', minWidth: 72, px: 1, py: 0.5, borderRadius: 0.5, textAlign: 'center', flexShrink: 0 }}>{badgeLabel}</Box>
        <Typography sx={{ flex: 1, fontSize: '13px', fontWeight: 500, wordBreak: 'break-word', color: 'text.primary' }}>{label}</Typography>
        <Button variant="text" size="small" onClick={() => setOpen(true)} sx={{ fontSize: '12px', flexShrink: 0, textTransform: 'none' }}>
          View Details
        </Button>
      </Box>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        variant="temporary"
        sx={{ '& .MuiDrawer-paper': { width: drawerWidth, maxWidth: '100vw', position: 'fixed', top: 64, height: 'calc(100% - 64px)', borderLeft: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Typography variant="h5">{drawerTitle}</Typography>
          <IconButton size="small" onClick={() => setOpen(false)} aria-label="Close">
            <X size={18} />
          </IconButton>
        </Stack>
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>{open && drawerContent}</Box>
      </Drawer>
    </>
  );
}
