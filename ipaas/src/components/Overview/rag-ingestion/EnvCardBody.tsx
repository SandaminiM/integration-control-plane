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

import { Box, Divider, Tab, Tabs, Typography } from '@wso2/oxygen-ui';
import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { EnvCardBodyProps } from '../../../types/integration';
import EnvCardSkeleton from '../_shared/EnvCardSkeleton';
import AutomationExecutions from '../../AutomationExecutions';
import RagRetrievalChat from './RagRetrievalChat';

type RagTab = 'executions' | 'retrieval';

/**
 * RAG Ingestion's content-only body: an Executions | Retrieval tab switcher.
 * Executions reuses the shared cronjob execution-history table; Retrieval is a
 * chat window that queries the project's RAG Retrieval Service. Both appear only
 * once the ingestion is deployed. No Card/header chrome — the shell frames it.
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
  pendingTriggerTime,
  pendingTriggerArgs,
  onTriggerResolved,
  onTrigger,
  onNotify,
}: EnvCardBodyProps): ReactNode {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<RagTab>('executions');

  if (loadingDeployment) return <EnvCardSkeleton />;

  return (
    <>
      <Divider sx={{ my: 2 }} />

      {!hasDeployment ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Deploy this ingestion to view executions and test retrieval.
        </Typography>
      ) : (
        <>
          <Tabs value={tab} onChange={(_e, value: RagTab) => setTab(value)} sx={{ minHeight: 0, mb: 2 }}>
            <Tab value="executions" label="Executions" sx={{ minHeight: 0 }} />
            <Tab value="retrieval" label="Retrieval" sx={{ minHeight: 0 }} />
          </Tabs>

          {tab === 'executions' && (
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

          {tab === 'retrieval' && (
            <Box sx={{ minHeight: 320 }}>
              <RagRetrievalChat ingestionComponentId={component.id} orgHandler={orgHandler} projectId={projectId} envId={env.id} envCritical={env.critical ?? false} />
            </Box>
          )}
        </>
      )}
    </>
  );
}
