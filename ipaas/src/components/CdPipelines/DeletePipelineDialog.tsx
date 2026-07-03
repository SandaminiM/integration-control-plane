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

import { Typography } from '@wso2/oxygen-ui';
import type { ReactNode } from 'react';
import { useDeleteDeploymentPipeline, usePipelineDeletionEligibility } from '../../hooks/useDeploymentPipelines';
import ConfirmDeleteDialog from '../ConfirmDeleteDialog';
import DeletionEligibilityContent from '../DeletionEligibilityContent';
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
      <DeletionEligibilityContent
        entityLabel="pipeline"
        isLoading={isLoading}
        isError={isError || !eligibility}
        canDelete={!!eligibility?.isDeletable}
        onRetry={() => refetch()}
        blockedDetails={<Typography variant="body2">Used by: {eligibility?.usedProjects.map((p) => p.name).join(', ')}</Typography>}
      />
    </ConfirmDeleteDialog>
  );
}
