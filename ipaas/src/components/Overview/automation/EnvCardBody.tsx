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

import { Box, Divider, Typography } from '@wso2/oxygen-ui';
import { useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useExecutionConfigs } from '../../../hooks/useExecutions';
import { describeCron } from '../../../utils/cronUtils';
import ScheduleButton from '../_shared/ScheduleButton';
import * as styles from './EnvCardBody.styles';
import { useSchemaConfig } from '../../../hooks/useConfiguration';
import { hasMissingRequiredConfigs } from '../_shared/configStatus';
import type { EnvCardBodyProps } from '../../../types/integration';
import EnvCardSkeleton from '../_shared/EnvCardSkeleton';
import AutomationExecutions from '../../AutomationExecutions';
import DeploymentNotice from '../../DeploymentNotice';
import AutomationInsights from './AutomationInsights';

/**
 * Automation's content-only body: a schedule-description banner, the executions
 * table (with the shell-owned optimistic queued-row state), and per-env
 * insights for critical environments. No Card/header chrome — the shell frames it.
 */
export default function EnvCardBody({
  component,
  env,
  projectId,
  versionId,
  releaseId,
  orgHandler,
  projectHandler,
  componentHandler,
  hasDeployment,
  loadingDeployment,
  deploymentStatusV2,
  envTemplateId,
  deployedCommitSha,
  deploymentPipelineId,
  buildId,
  isBuildInProgress,
  pendingTriggerTime,
  pendingTriggerArgs,
  onTriggerResolved,
  onTrigger,
  onNotify,
}: EnvCardBodyProps): ReactNode {
  const queryClient = useQueryClient();
  const { data: scheduleConfig } = useExecutionConfigs(component.id, releaseId, env.id);
  const hasSchedule = !!scheduleConfig?.cronjobFrequency;
  const scheduleDescription = hasSchedule ? `${describeCron(scheduleConfig!.cronjobFrequency!)}, in time zone ${scheduleConfig?.cronjobTimezone || 'UTC'}` : 'This automation doesn’t have an active schedule. Add one to run it automatically.';
  const { data: schemaConfig } = useSchemaConfig(projectId, component.id, envTemplateId, versionId, deployedCommitSha);
  const missingConfigs = useMemo(() => hasMissingRequiredConfigs(schemaConfig), [schemaConfig]);

  const showInsights = !!env.critical && !!releaseId;

  if (loadingDeployment) return <EnvCardSkeleton />;

  return (
    <>
      <Divider sx={{ my: 2 }} />

      {hasDeployment && (
        <Box sx={styles.scheduleRow}>
          <Box sx={styles.scheduleDescription}>
            <Typography variant="body2">{scheduleDescription}</Typography>
          </Box>
          <ScheduleButton
            envId={env.id}
            envName={env.name}
            componentId={component.id}
            orgHandler={orgHandler}
            releaseId={releaseId}
            buildId={buildId}
            versionId={versionId}
            deploymentPipelineId={deploymentPipelineId}
            hasSchedule={hasSchedule}
            disabled={missingConfigs || !!isBuildInProgress}
            onSaveSuccess={() => onNotify({ text: 'Schedule updated successfully', severity: 'success' })}
            onSaveError={() => onNotify({ text: 'Failed to save schedule. Please try again.', severity: 'error' })}
            onStopSuccess={() => onNotify({ text: 'Schedule stopped successfully', severity: 'success' })}
          />
        </Box>
      )}

      {!loadingDeployment && hasDeployment && (
        <AutomationExecutions
          releaseId={releaseId}
          projectId={projectId}
          componentId={component.id}
          deploymentTrackId={versionId}
          environmentId={env.id}
          orgHandler={orgHandler}
          projectHandler={projectHandler}
          componentHandler={componentHandler}
          envCritical={env.critical ?? false}
          deploymentStatusV2={deploymentStatusV2}
          pendingTriggerTime={pendingTriggerTime}
          pendingTriggerArgs={pendingTriggerArgs}
          onTriggerResolved={onTriggerResolved}
          onRunSuccess={() => {
            onNotify({ text: 'Execution triggered successfully', severity: 'success' });
            onTrigger(Date.now());
            queryClient.invalidateQueries({ queryKey: ['taskExecutions'] });
          }}
        />
      )}

      {!loadingDeployment && !hasDeployment && <DeploymentNotice hasDeployment={false} envCritical={!!env.critical} />}

      {showInsights && <AutomationInsights releaseId={releaseId} executionScope={{ componentId: component.id, envId: env.id, projectId }} />}
    </>
  );
}
