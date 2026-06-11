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

import { Stack, Typography } from '@wso2/oxygen-ui';
import { Clock } from '@wso2/oxygen-ui-icons-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useExecutionConfigs, useTriggerComponent } from '../../../hooks/useExecutions';
import { useSchemaConfig } from '../../../hooks/useConfiguration';
import { formatTimeUntil, nextCronRunMs } from '../../../utils/cronUtils';
import type { EnvCardActionsProps } from '../../../types/integration';
import ScheduleButton from './ScheduleButton';
import RunButton from './RunButton';
import RunWithArgsDialog from './RunWithArgsDialog';
import { hasMissingRequiredConfigs } from './configStatus';

/**
 * Automation's right-header slot: the next-run label (with cron auto-fire
 * detection), Schedule controls, and Run / Run-with-args. Owns the trigger
 * mutation + schedule config; reports outcomes via `onNotify` and records
 * optimistic runs via `onTrigger` (the shell relays those to the body's table).
 */
export default function EnvCardActions({ component, env, projectId, versionId, orgHandler, releaseId, deploymentPipelineId, envTemplateId, deployedCommitSha, isBuildInProgress, onNotify, onTrigger }: EnvCardActionsProps): ReactNode {
  const queryClient = useQueryClient();
  const trigger = useTriggerComponent();
  const [runWithArgsOpen, setRunWithArgsOpen] = useState(false);

  const { data: scheduleConfig } = useExecutionConfigs(component.id, releaseId, env.id, projectId);
  const { data: schemaConfig } = useSchemaConfig(projectId, component.id, envTemplateId, versionId, deployedCommitSha);
  const missingConfigs = useMemo(() => hasMissingRequiredConfigs(schemaConfig), [schemaConfig]);

  // Automation's Run/Schedule are always disabled while a build is in progress.
  const buildDisabled = !!isBuildInProgress;

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

  const handleRun = () => {
    trigger.mutate(
      { orgHandler, projectId, componentId: component.id, releaseId, args: [] },
      {
        onSuccess: () => {
          onNotify({ text: 'Execution triggered successfully', severity: 'success' });
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
        versionId={versionId}
        deploymentPipelineId={deploymentPipelineId}
        hasSchedule={!!scheduleConfig?.cronjobFrequency}
        disabled={missingConfigs || buildDisabled}
        onSaveSuccess={() => onNotify({ text: 'Schedule updated successfully', severity: 'success' })}
        onSaveError={() => onNotify({ text: 'Failed to save schedule. Please try again.', severity: 'error' })}
        onStopSuccess={() => onNotify({ text: 'Schedule stopped successfully', severity: 'success' })}
      />
      <RunButton envCritical={env.critical} disabled={missingConfigs || buildDisabled} pending={trigger.isPending} onRun={handleRun} onRunWithArgs={() => setRunWithArgsOpen(true)} />
      <RunWithArgsDialog
        open={runWithArgsOpen}
        onClose={() => setRunWithArgsOpen(false)}
        onRunSuccess={(args) => {
          onNotify({ text: 'Execution triggered successfully', severity: 'success' });
          onTrigger(Date.now(), args);
          queryClient.invalidateQueries({ queryKey: ['taskExecutions'] });
        }}
        envCritical={env.critical}
        orgHandler={orgHandler}
        projectId={projectId}
        componentId={component.id}
        releaseId={releaseId}
      />
    </>
  );
}
