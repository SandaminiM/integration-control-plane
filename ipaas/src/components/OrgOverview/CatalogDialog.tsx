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

import type { JSX } from 'react';
import { Box, Card, Dialog, DialogContent, IconButton, Tooltip, Typography } from '@wso2/oxygen-ui';
import { ArrowUpRight, X } from '@wso2/oxygen-ui-icons-react';
import type { CatalogGroup } from '../../constants/orgCatalog';
import * as styles from './dialogs.styles';

interface CatalogDialogProps {
  group: CatalogGroup | null;
  onClose: () => void;
}

export default function CatalogDialog({ group, onClose }: CatalogDialogProps): JSX.Element {
  return (
    <Dialog open={group !== null} onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: styles.dialogPaper } }}>
      {group && (
        <DialogContent>
          <Box sx={styles.dialogHeader}>
            <Box>
              <Typography variant="h4" fontWeight={600} sx={{ mb: 0.75 }}>
                What do you want to create?
              </Typography>
              <Typography color="text.secondary">{group.description}</Typography>
            </Box>
            <IconButton aria-label="Close" onClick={onClose} sx={styles.closeButton}>
              <X size={16} />
            </IconButton>
          </Box>
          <Box sx={styles.optionGrid}>
            {group.options.map((option) => (
              <Tooltip key={option.id} title="Coming soon" placement="top" followCursor>
                <Card sx={styles.optionCard}>
                  <Box sx={styles.optionCardTop}>
                    <Box sx={styles.optionIcon}>{option.icon}</Box>
                    <Box className="catalog-arrow" sx={styles.optionArrow}>
                      <ArrowUpRight size={18} />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.75 }}>
                      {option.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      {option.description}
                    </Typography>
                  </Box>
                </Card>
              </Tooltip>
            ))}
          </Box>
        </DialogContent>
      )}
    </Dialog>
  );
}
