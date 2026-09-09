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

import { Button, Stack, Typography } from '@wso2/oxygen-ui';
import { Clock, Play } from '@wso2/oxygen-ui-icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAppNavigate } from '../../../hooks/useAppNavigate';
import { useQueryClient } from '@tanstack/react-query';
import { useExecutionConfigs, useRuntimeArguments, useTriggerComponent } from '../../../hooks/useExecutions';
import { useSchemaConfig } from '../../../hooks/useConfiguration';
import type { EnvCardActionsProps } from '../../../types/integration';
import { isDeploymentHealthy } from '../../../utils/deploymentStatus';
import { IS_CLOUD } from '../../../features';
import { hasMissingRequiredConfigs } from './configStatus';
import ScheduleButton from './ScheduleButton';
import { formatTimeUntil, nextCronRunMs } from '../../../utils/cronUtils';

/**
 * Automation's right-header slot. Test only leaves the card when the task takes runtime arguments.
 */
export default function EnvCardActions({
  component,
  env,
  projectId,
  versionId,
  orgHandler,
  projectHandler,
  componentHandler,
  releaseId,
  buildId,
  deploymentPipelineId,
  envTemplateId,
  deployedCommitSha,
  isBuildInProgress,
  deploymentStatusV2,
  onNotify,
  onTrigger,
}: EnvCardActionsProps): ReactNode {
  const queryClient = useQueryClient();
  const navigate = useAppNavigate();

  const { data: scheduleConfig } = useExecutionConfigs(component.id, releaseId, env.id);
  const { data: schemaConfig } = useSchemaConfig(projectId, component.id, envTemplateId, versionId, deployedCommitSha);
  const missingConfigs = useMemo(() => hasMissingRequiredConfigs(schemaConfig), [schemaConfig]);

  // Automation's Run/Schedule are always disabled while a build is in progress.
  const buildDisabled = !!isBuildInProgress;
  // A stopped schedule leaves the CronJob deployed, so this only excludes a stopped deployment.
  const canTest = isDeploymentHealthy(deploymentStatusV2);

  // Countdown only: the cron says when a run is due, not that it fired, so predicting one strands an in-progress row.
  const [nextRunLabel, setNextRunLabel] = useState<string | null>(null);
  const cronFreq = scheduleConfig?.cronjobFrequency ?? null;
  const updateNextRun = useCallback(() => {
    const ms = cronFreq ? nextCronRunMs(cronFreq) : null;
    setNextRunLabel(ms === null ? null : `Next run in ${formatTimeUntil(ms)}`);
  }, [cronFreq]);
  useEffect(() => {
    updateNextRun();
    const timer = setInterval(updateNextRun, 1000);
    return () => clearInterval(timer);
  }, [updateNextRun]);

  // Cloud has no runtime-arguments endpoint, so the query stays disabled rather than always failing.
  const { data: runtimeArgs, isLoading: runtimeArgsLoading } = useRuntimeArguments(component.id, versionId, deployedCommitSha ?? '', !IS_CLOUD);
  const hasRuntimeArgs = (runtimeArgs?.length ?? 0) > 0;
  const triggerRun = useTriggerComponent();

  const goToTestPage = () => navigate(`/organizations/${orgHandler}/projects/${projectHandler}/components/${componentHandler}/test`);

  const handleTest = () => {
    if (hasRuntimeArgs) {
      goToTestPage();
      return;
    }
    triggerRun.mutate(
      { orgHandler, projectId, componentId: component.id, releaseId, args: [] },
      {
        onSuccess: () => {
          onNotify({ text: 'Execution triggered successfully', severity: 'success' });
          // Surfaces the run in this card's executions table before the list refetches.
          onTrigger(Date.now());
          queryClient.invalidateQueries({ queryKey: ['taskExecutions'] });
        },
        onError: (err) => onNotify({ text: err instanceof Error ? err.message : 'Failed to trigger execution', severity: 'error' }),
      },
    );
  };

  return (
    <>
      {nextRunLabel && (
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mr: 0.5 }}>
          <Clock size={14} />
          <Typography variant="body2" color="text.secondary">
            {nextRunLabel}
          </Typography>
        </Stack>
      )}
      <ScheduleButton
        envId={env.id}
        envName={env.name}
        componentId={component.id}
        orgHandler={orgHandler}
        releaseId={releaseId}
        buildId={buildId}
        versionId={versionId}
        deploymentPipelineId={deploymentPipelineId}
        hasSchedule={!!scheduleConfig?.cronjobFrequency}
        disabled={missingConfigs || buildDisabled}
        onSaveSuccess={() => onNotify({ text: 'Schedule updated successfully', severity: 'success' })}
        onSaveError={() => onNotify({ text: 'Failed to save schedule. Please try again.', severity: 'error' })}
        onStopSuccess={() => onNotify({ text: 'Schedule stopped successfully', severity: 'success' })}
      />
      <Button variant="contained" size="small" startIcon={<Play size={14} />} disabled={missingConfigs || buildDisabled || !canTest || triggerRun.isPending || runtimeArgsLoading} onClick={handleTest}>
        Test
      </Button>
    </>
  );
}
