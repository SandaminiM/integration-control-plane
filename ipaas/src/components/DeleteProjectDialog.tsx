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

import { useState, type JSX } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Skeleton } from '@wso2/oxygen-ui';
import TextField from './common/TextField';
import { useComponents } from '../hooks/useComponents';
import { useDeleteProject } from '../hooks/useProjects';
import type { Project } from '../types/project';
import { projectDeleteBlockedMessage } from '../utils/projectDeletion';

interface DeleteProjectDialogProps {
  org: string;
  project: Project;
  onClose: () => void;
}

/** Confirms a project delete by name, and refuses it while the project still holds integrations. */
export default function DeleteProjectDialog({ org, project, onClose }: DeleteProjectDialogProps): JSX.Element {
  const remove = useDeleteProject();
  const { data: components, isLoading } = useComponents(org, project.id);
  const [confirmText, setConfirmText] = useState('');
  const [failed, setFailed] = useState(false);
  const blocking = components?.length ?? 0;

  const handleDelete = () =>
    remove.mutate(project.id, {
      onSuccess: onClose,
      onError: (e) => {
        console.error('Failed to delete project', e);
        setFailed(true);
      },
    });

  return (
    <Dialog open onClose={remove.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Are you sure you want to remove the project &lsquo;<strong>{project.name}</strong>&rsquo; ?
      </DialogTitle>
      <DialogContent>
        {failed && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to delete the project. Please try again.
          </Alert>
        )}
        {isLoading ? (
          <Skeleton variant="rounded" height={56} />
        ) : blocking > 0 ? (
          <Alert severity="warning">{projectDeleteBlockedMessage(blocking)}</Alert>
        ) : (
          <>
            <DialogContentText sx={{ mb: 2 }}>This action will be irreversible and all related details will be lost. Please type in the project name below to confirm.</DialogContentText>
            <TextField value={confirmText} onChange={(e) => setConfirmText(e.target.value)} fullWidth placeholder="Enter project name to confirm" autoFocus />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={remove.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={isLoading || blocking > 0 || confirmText.trim() !== project.name || remove.isPending}
          startIcon={remove.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}>
          {remove.isPending ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
