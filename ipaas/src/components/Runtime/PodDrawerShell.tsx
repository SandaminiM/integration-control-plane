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

import { Box, Drawer, IconButton, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Maximize2, Minimize2, X } from '@wso2/oxygen-ui-icons-react';
import { useState, type JSX, type ReactNode } from 'react';
import * as styles from './PodDrawerShell.styles';

interface PodDrawerShellProps {
  open: boolean;
  onClose: () => void;
  /** Fires after the slide-out finishes, so the caller can drop the selected pod. */
  onExited?: () => void;
  title: ReactNode;
  children: ReactNode;
}

/**
 * Right drawer used by both pod drawers. Pod events and log lines are wide, so the
 * header carries an expand toggle that takes the drawer to the full window width.
 */
export default function PodDrawerShell({ open, onClose, onExited, title, children }: PodDrawerShellProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const handleClose = () => {
    (document.activeElement as HTMLElement)?.blur();
    onClose();
  };

  const handleExited = () => {
    setExpanded(false);
    onExited?.();
  };

  const expandLabel = expanded ? 'Exit full width' : 'Expand to full width';

  return (
    <Drawer anchor="right" open={open} onClose={handleClose} variant="temporary" SlideProps={{ onExited: handleExited }} sx={styles.drawer(expanded)}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={styles.header}>
        <Typography variant="h5" sx={styles.title}>
          {title}
        </Typography>
        <Stack direction="row" alignItems="center" gap={0.5} sx={styles.headerActions}>
          <Tooltip title={expandLabel}>
            <IconButton size="small" aria-label={expandLabel} onClick={() => setExpanded((prev) => !prev)}>
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </IconButton>
          </Tooltip>
          <IconButton size="small" aria-label="close" onClick={handleClose}>
            <X size={16} />
          </IconButton>
        </Stack>
      </Stack>

      <Box sx={styles.body}>{children}</Box>
    </Drawer>
  );
}
