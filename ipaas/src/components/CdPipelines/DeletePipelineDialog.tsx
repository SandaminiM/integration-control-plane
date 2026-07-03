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

import { Alert, Button, CircularProgress, Stack, Typography } from '@wso2/oxygen-ui';
import { AlertTriangle } from '@wso2/oxygen-ui-icons-react';
import type { ReactNode } from 'react';
import { useDeleteDeploymentPipeline, usePipelineDeletionEligibility } from '../../hooks/useDeploymentPipelines';
import ConfirmDeleteDialog from '../ConfirmDeleteDialog';
import type { DeploymentPipeline } from '../../types/deploymentPipeline';

interface DeletePipelineDialogProps {
  pipeline: DeploymentPipeline;
  onClose: () => void;
  onDeleted: (name: string) => void;
  onError: (message: string) => void;
}

/**
 * Confirms deleting a deployment pipeline. Runs the deletion-eligibility check
 * on open; if the pipeline is in use, lists the blocking projects and disables
 * the action.
 */
export default function DeletePipelineDialog({ pipeline, onClose, onDeleted, onError }: DeletePipelineDialogProps): ReactNode {
  const { data: eligibility, isLoading, isError, refetch } = usePipelineDeletionEligibility(pipeline.id);
  const del = useDeleteDeploymentPipeline();

  const doDelete = () =>
    del.mutate(pipeline.id, {
      onSuccess: () => {
        onClose();
        onDeleted(pipeline.name);
      },
      onError: (e) => {
        onClose();
        onError(e.message);
      },
    });

  return (
    <ConfirmDeleteDialog
      title={
        <>
          Delete <strong>&lsquo;{pipeline.name}&rsquo;</strong>?
        </>
      }
      onConfirm={doDelete}
      onClose={onClose}
      isPending={del.isPending}
      confirmDisabled={!eligibility?.isDeletable}>
      {isLoading ? (
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ py: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Checking whether this pipeline can be deleted…
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
      ) : eligibility.isDeletable ? (
        <Typography variant="body2" color="text.secondary">
          This permanently removes the pipeline. This action can&apos;t be undone.
        </Typography>
      ) : (
        <Alert severity="warning" icon={<AlertTriangle size={20} />}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            This pipeline is in use and can&apos;t be deleted.
          </Typography>
          <Typography variant="body2">Used by: {eligibility.usedProjects.map((p) => p.name).join(', ')}</Typography>
        </Alert>
      )}
    </ConfirmDeleteDialog>
  );
}
