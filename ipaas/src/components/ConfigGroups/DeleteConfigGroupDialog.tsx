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

import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@wso2/oxygen-ui';
import { useState, type JSX } from 'react';
import { useDeleteConfigGroup } from '../../hooks/useConfigGroups';
import type { ConfigGroup } from '../../types/configGroups';

interface DeleteConfigGroupDialogProps {
  group: ConfigGroup;
  onClose: () => void;
  onDeleted: (name: string) => void;
  onError: (message: string) => void;
}

const SOURCE = 'configuration group';

/**
 * Type-to-confirm delete, mirroring Devant's DeleteConfirmDialog: the user must type the
 * group's name to enable the irreversible delete.
 */
export default function DeleteConfigGroupDialog({ group, onClose, onDeleted, onError }: DeleteConfigGroupDialogProps): JSX.Element {
  const del = useDeleteConfigGroup();
  const name = group.groupDisplayName || group.groupName;
  const [input, setInput] = useState('');
  const confirmed = input === name;

  const doDelete = () => {
    if (!confirmed) return;
    del.mutate(group.groupUuid, {
      onSuccess: () => {
        onClose();
        onDeleted(name);
      },
      onError: (e) => {
        onClose();
        onError(e instanceof Error ? e.message : 'Failed to delete configuration group.');
      },
    });
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Are you sure you want to remove the {SOURCE} &lsquo;{name}&rsquo;?
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This action is irreversible and all related details will be lost. Integrations still referencing this group may fail to resolve its configurations. Please type the {SOURCE} name below to confirm.
        </Typography>
        <Box>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') doDelete();
            }}
            placeholder={`Enter ${SOURCE} name to confirm`}
            inputProps={{ 'aria-label': 'Confirm name' }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={del.isPending}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={doDelete} disabled={!confirmed || del.isPending} startIcon={del.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}>
          {del.isPending ? 'Removing…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
