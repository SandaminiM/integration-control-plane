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

import { Button, Tooltip } from '@wso2/oxygen-ui';
import { List, RotateCw, Square } from '@wso2/oxygen-ui-icons-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useRedeployDeployment, useStopDeployment } from '../../../hooks/useDeployments';
import { IS_CLOUD } from '../../../features';
import type { EnvCardActionsProps } from '../../../types/integration';
import ServiceLogsDrawer from '../integration-as-api/ServiceLogsDrawer';

/**
 * MCP Server's right-header slot: View Logs + Stop/Start — gated on deployment
 * status. No Test button for now (the MCP playground is deferred; the Test tab
 * shows Coming Soon). Stop/Start poll via `requestPoll` and report via `onNotify`.
 */
export default function EnvCardActions({ component, env, versionId, releaseId, orgHandler, hasDeployment, deploymentStatusV2, releaseMgtReleaseId, releaseMgtDeploymentId, onNotify, requestPoll }: EnvCardActionsProps): ReactNode {
  const [logsOpen, setLogsOpen] = useState(false);
  const stopMutation = useStopDeployment();
  const redeployMutation = useRedeployDeployment();
  const isActionPending = stopMutation.isPending || redeployMutation.isPending;

  const canStop = deploymentStatusV2 === 'ACTIVE' || deploymentStatusV2 === 'ERROR';
  const canStart = deploymentStatusV2 === 'SUSPENDED';
  const isInProgress = deploymentStatusV2 === 'IN_PROGRESS';

  const handleStop = () => {
    stopMutation.mutate(
      // cloud: OpenChoreo's stop endpoint is per-environment; wip ignores it.
      { orgHandler, componentId: component.id, releaseId, ...(IS_CLOUD ? { environment: env.id } : {}), type: 'service', clearCron: false },
      {
        onSuccess: () => {
          requestPoll();
          onNotify({ text: 'Deployment stopped successfully', severity: 'success' });
        },
        onError: (err) => onNotify({ text: err instanceof Error ? err.message : 'Failed to stop deployment', severity: 'error' }),
      },
    );
  };

  const handleRedeploy = () => {
    redeployMutation.mutate(
      { orgHandler, componentId: component.id, releaseId, type: 'service', releaseMgtReleaseId, releaseMgtDeploymentId },
      {
        onSuccess: () => {
          requestPoll();
          onNotify({ text: 'Deployment started successfully', severity: 'success' });
        },
        onError: (err) => onNotify({ text: err instanceof Error ? err.message : 'Failed to start deployment', severity: 'error' }),
      },
    );
  };

  return (
    <>
      {hasDeployment && (
        <Button variant="text" size="small" startIcon={<List size={14} />} onClick={() => setLogsOpen(true)} sx={{ textTransform: 'none' }}>
          View Logs
        </Button>
      )}
      {(canStop || isInProgress) && (
        <Tooltip title="Stop deployment">
          <span>
            <Button variant="outlined" size="small" color="error" startIcon={<Square size={14} />} onClick={handleStop} disabled={isActionPending || isInProgress}>
              Stop
            </Button>
          </span>
        </Tooltip>
      )}
      {canStart && (
        <Tooltip title="Start deployment">
          <span>
            <Button variant="outlined" size="small" color="success" startIcon={<RotateCw size={14} />} onClick={handleRedeploy} disabled={isActionPending}>
              Start
            </Button>
          </span>
        </Tooltip>
      )}
      <ServiceLogsDrawer open={logsOpen} onClose={() => setLogsOpen(false)} componentId={component.id} environmentId={env.id} envName={env.name} versionId={versionId} />
    </>
  );
}
