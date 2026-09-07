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

import { Button, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Clock, Play, RotateCw, Square } from '@wso2/oxygen-ui-icons-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAppNavigate } from '../../../hooks/useAppNavigate';
import { useQueryClient } from '@tanstack/react-query';
import { useExecutionConfigs, useRuntimeArguments, useTriggerComponent } from '../../../hooks/useExecutions';
import { useSchemaConfig } from '../../../hooks/useConfiguration';
import { formatTimeUntil, nextCronRunMs } from '../../../utils/cronUtils';
import type { EnvCardActionsProps } from '../../../types/integration';
import { isDeploymentHealthy } from '../../../utils/deploymentStatus';
import { useRedeployDeployment, useStopDeployment } from '../../../hooks/useDeployments';
import { IS_CLOUD } from '../../../features';
import ScheduleButton from './ScheduleButton';
import { hasMissingRequiredConfigs } from './configStatus';

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

  // SUSPENDED means the workload was stopped, never that the cron was.
  const stopMutation = useStopDeployment();
  const redeployMutation = useRedeployDeployment();
  const isActionPending = stopMutation.isPending || redeployMutation.isPending;
  const canStop = deploymentStatusV2 === 'ACTIVE';
  const canStart = deploymentStatusV2 === 'SUSPENDED';
  const isInProgress = deploymentStatusV2 === 'IN_PROGRESS';

  const handleStopDeployment = () => {
    stopMutation.mutate(
      // clearCron false: stopping the deployment must leave the schedule alone.
      { orgHandler, componentId: component.id, releaseId, ...(IS_CLOUD ? { environment: env.id } : {}), type: 'scheduledTask', clearCron: false },
      {
        onSuccess: () => onNotify({ text: 'Deployment stopped successfully', severity: 'success' }),
        onError: (err) => onNotify({ text: err instanceof Error ? err.message : 'Failed to stop deployment', severity: 'error' }),
      },
    );
  };

  const handleStartDeployment = () => {
    redeployMutation.mutate(
      { orgHandler, componentId: component.id, releaseId, type: 'scheduledTask' },
      {
        onSuccess: () => onNotify({ text: 'Deployment started successfully', severity: 'success' }),
        onError: (err) => onNotify({ text: err instanceof Error ? err.message : 'Failed to start deployment', severity: 'error' }),
      },
    );
  };

  // Cloud has no runtime-arguments endpoint, so the query stays disabled rather than always failing.
  const { data: runtimeArgs } = useRuntimeArguments(component.id, versionId, deployedCommitSha ?? '', !IS_CLOUD);
  const hasRuntimeArgs = (runtimeArgs?.length ?? 0) > 0;
  const triggerRun = useTriggerComponent();

  // Next-run countdown + cron auto-fire detection: when a scheduled run is about
  // to fire, optimistically record a trigger so the executions table updates.
  const [nextRunLabel, setNextRunLabel] = useState<string | null>(null);
  const cronFreq = scheduleConfig?.cronjobFrequency ?? null;
  const lastScheduledTriggerRef = useRef<number>(0);
  const updateNextRun = useCallback(() => {
    if (!cronFreq) {
      setNextRunLabel(null);
      return;
    }
    const ms = nextCronRunMs(cronFreq);
    if (ms !== null) {
      const diff = ms - Date.now();
      if (diff < 1000 && Date.now() - lastScheduledTriggerRef.current > 30000) {
        lastScheduledTriggerRef.current = Date.now();
        onTrigger(Date.now());
        queryClient.invalidateQueries({ queryKey: ['taskExecutions'] });
      }
      setNextRunLabel(`Next run in ${formatTimeUntil(ms)}`);
    } else {
      setNextRunLabel(null);
    }
  }, [cronFreq, queryClient, onTrigger]);
  useEffect(() => {
    updateNextRun();
    const timer = setInterval(updateNextRun, 1000);
    return () => clearInterval(timer);
  }, [updateNextRun]);

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
      <Button variant="contained" size="small" startIcon={<Play size={14} />} disabled={missingConfigs || buildDisabled || !canTest || triggerRun.isPending} onClick={handleTest}>
        Test
      </Button>
      {(canStop || isInProgress) && (
        <Tooltip title="Stop deployment">
          <span>
            <Button variant="outlined" size="small" color="error" startIcon={<Square size={14} />} onClick={handleStopDeployment} disabled={isActionPending || isInProgress}>
              Stop
            </Button>
          </span>
        </Tooltip>
      )}
      {canStart && (
        <Tooltip title="Start deployment">
          <span>
            <Button variant="outlined" size="small" color="success" startIcon={<RotateCw size={14} />} onClick={handleStartDeployment} disabled={isActionPending}>
              Start
            </Button>
          </span>
        </Tooltip>
      )}
    </>
  );
}
