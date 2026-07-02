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

import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@wso2/oxygen-ui';
import type { JSX } from 'react';
import { useDeleteServer } from '../../hooks/usePlatformServices';
import type { DatabaseServer } from '../../types/platformServices';

interface DeleteServerDialogProps {
  server: DatabaseServer;
  /** Whether the org is on a paid plan — free-tier deletes don't restore the quota. */
  isSubscribed: boolean;
  onClose: () => void;
  onDeleted: (name: string) => void;
  onError: (message: string) => void;
}

/** Confirms deleting a database server. Warns free-tier orgs that the quota won't reset. */
export default function DeleteServerDialog({ server, isSubscribed, onClose, onDeleted, onError }: DeleteServerDialogProps): JSX.Element {
  const del = useDeleteServer();

  const doDelete = () =>
    del.mutate(server.id, {
      onSuccess: () => {
        onClose();
        onDeleted(server.name);
      },
      onError: (e) => {
        onClose();
        onError(e instanceof Error ? e.message : 'Failed to delete database server.');
      },
    });

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete &lsquo;{server.name}&rsquo;?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          This permanently removes the database server. This action can&apos;t be undone.
        </Typography>
        {!isSubscribed && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Deleting this resource will not reset your free-tier limit. You&apos;ll need to upgrade your subscription to create additional cloud resources.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={doDelete} disabled={del.isPending} startIcon={del.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}>
          {del.isPending ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
