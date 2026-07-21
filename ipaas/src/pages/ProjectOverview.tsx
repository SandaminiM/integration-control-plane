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

import { Alert, Avatar, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, PageContent, Stack, TextField, Typography } from '@wso2/oxygen-ui';
import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router';
import Authorized from '../components/Authorized';
import InlineEditField from '../components/InlineEditField';
import ProjectSettingsTabs from '../components/Settings/ProjectSettingsTabs';
import { Permissions } from '../constants/permissions';
import { useAccessControl } from '../contexts/AccessControlContext';
import { useProjectId, useProjects, useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import type { Project } from '../types/project';
import { projectsRedirectUrl } from '../paths';
import type { ProjectScope } from '../nav';

function ProjectOverviewForm({ org, project }: { org: string; project: Project }): JSX.Element {
  const navigate = useNavigate();
  const { data: allProjects = [] } = useProjects();
  const { hasAnyPermission } = useAccessControl();
  const update = useUpdateProject();
  const remove = useDeleteProject();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canManage = hasAnyPermission([Permissions.PROJECT_MANAGE], project.id);

  const validateName = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return 'Project name is required.';
    if (allProjects.some((p) => p.id !== project.id && p.name.trim().toLowerCase() === trimmed.toLowerCase())) return 'A project with this name already exists.';
    return '';
  };

  const saveField = (patch: { name?: string; description?: string }) =>
    update.mutateAsync({ id: project.id, name: patch.name ?? project.name, description: patch.description ?? project.description ?? '', version: project.version }).then(
      () => setAlert({ type: 'success', message: 'Project updated.' }),
      (e) => {
        setAlert({ type: 'error', message: e instanceof Error ? e.message : 'Failed to update the project.' });
        throw e;
      },
    );

  const handleDelete = () =>
    remove.mutate(project.id, {
      onSuccess: () => navigate(projectsRedirectUrl(org)),
      onError: (e) => {
        setDeleting(false);
        setAlert({ type: 'error', message: e instanceof Error ? e.message : 'Failed to delete the project.' });
      },
    });

  return (
    <>
      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 4 }}>
          {alert.message}
        </Alert>
      )}

      <Stack component="header" direction="row" alignItems="center" gap={2} sx={{ my: 5 }}>
        <Avatar sx={{ width: 56, height: 56, fontSize: 24, bgcolor: 'text.primary', color: 'background.paper' }}>{project.name?.[0]?.toUpperCase() ?? 'P'}</Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {project.name}
          </Typography>
          {project.createdDate && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Created on {new Date(project.createdDate).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </Stack>

      <Stack gap={3} sx={{ maxWidth: 640 }}>
        <Stack direction="row" gap={2} alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            <InlineEditField label="Name" value={project.name} editable={canManage} validate={validateName} onSave={(v) => saveField({ name: v })} />
          </Box>
          <TextField label="Handle" value={project.handler} fullWidth disabled helperText=" " sx={{ flex: 1 }} />
        </Stack>
        <InlineEditField label="Description" value={project.description ?? ''} placeholder="No description" multiline editable={canManage} onSave={(v) => saveField({ description: v })} />
      </Stack>

      <Authorized permissions={Permissions.PROJECT_MANAGE}>
        <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'error.main', borderRadius: 1, maxWidth: 640 }}>
          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Delete this project</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Permanently delete the project and all its integrations. This cannot be undone.
          </Typography>
          <Button variant="outlined" color="error" onClick={() => setDeleting(true)}>
            Delete Project
          </Button>
        </Box>
      </Authorized>

      {deleting && (
        <Dialog
          open
          onClose={() => {
            setDeleting(false);
            setConfirmText('');
          }}
          maxWidth="sm"
          fullWidth>
          <DialogTitle>Delete &lsquo;{project.name}&rsquo;?</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              This permanently deletes the project and everything in it. Type <strong>{project.name}</strong> to confirm.
            </DialogContentText>
            <TextField value={confirmText} onChange={(e) => setConfirmText(e.target.value)} fullWidth placeholder={project.name} autoFocus />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDeleting(false);
                setConfirmText('');
              }}
              disabled={remove.isPending}>
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={handleDelete} disabled={confirmText.trim() !== project.name || remove.isPending} startIcon={remove.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}>
              {remove.isPending ? 'Deleting…' : 'Delete Project'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

export default function ProjectOverview({ org, project }: ProjectScope): JSX.Element {
  const { project: data, isLoading } = useProjectId(project);

  return (
    <PageContent>
      <ProjectSettingsTabs active="project-overview" />
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
          <CircularProgress />
        </Box>
      ) : !data ? (
        <Typography>Project not found</Typography>
      ) : (
        <ProjectOverviewForm key={data.id} org={org} project={data} />
      )}
    </PageContent>
  );
}
