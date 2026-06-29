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

import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@wso2/oxygen-ui';
import { AlertTriangle } from '@wso2/oxygen-ui-icons-react';
import type { ReactNode } from 'react';
import { useCredentialDeleteEligibility, useDeleteGitCredential } from '../../../hooks/useCredentials';
import type { GitCredential } from '../../../types/credentials';

/**
 * Confirms deleting a git credential. Runs the deletion-eligibility check on open;
 * if the credential is in use, lists the blocking components and disables the action.
 */
export default function DeleteCredentialDialog({ credential, onClose, onDeleted, onError }: { credential: GitCredential; onClose: () => void; onDeleted: (name: string) => void; onError: (message: string) => void }): ReactNode {
  const { data: eligibility, isLoading, isError, refetch } = useCredentialDeleteEligibility(credential.id);
  const del = useDeleteGitCredential();

  const doDelete = () =>
    del.mutate(credential.id, {
      onSuccess: () => {
        onClose();
        onDeleted(credential.name);
      },
      onError: (e) => {
        onClose();
        onError(e.message);
      },
    });

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete &lsquo;{credential.name}&rsquo;?</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Stack direction="row" alignItems="center" gap={1.5} sx={{ py: 2 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Checking whether this credential can be deleted…
            </Typography>
          </Stack>
        ) : isError || !eligibility ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }>
            Couldn&apos;t check deletion eligibility.
          </Alert>
        ) : eligibility.canDelete ? (
          <Typography variant="body2" color="text.secondary">
            This permanently removes the credential. This action can&apos;t be undone.
          </Typography>
        ) : (
          <Alert severity="warning" icon={<AlertTriangle size={20} />}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              This credential is in use and can&apos;t be deleted.
            </Typography>
            {eligibility.components.map((c) => (
              <Typography key={c.projectName} variant="body2">
                {c.projectName}: {c.componentNames.join(', ')}
              </Typography>
            ))}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={doDelete} disabled={!eligibility?.canDelete || del.isPending} startIcon={del.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}>
          {del.isPending ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
