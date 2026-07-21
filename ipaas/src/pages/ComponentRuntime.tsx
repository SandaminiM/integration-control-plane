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

import { Box, CircularProgress, MenuItem, PageContent, Select, Typography } from '@wso2/oxygen-ui';
import { useEffect, useMemo, useState, type JSX } from 'react';
import ComingSoon from './ComingSoon';
import DeploymentTrackBar from '../components/DeploymentTrackBar';
import PodInsightsTable from '../components/Runtime/PodInsightsTable';
import ResourceUsageCards from '../components/Runtime/ResourceUsageCards';
import RuntimeOverview from '../components/Runtime/RuntimeOverview';
import { useComponentByHandler } from '../hooks/useComponents';
import { useComponentDeployment } from '../hooks/useDeployments';
import { useEnvironments } from '../hooks/useEnvironments';
import { useOrgUuid } from '../hooks/useOrgUuid';
import { useProjectId } from '../hooks/useProjects';
import { isRuntimeEnabled, useComponentPodMetrics, useComponentPods, useReleaseDetails, useRedeployRelease } from '../hooks/useRuntime';
import { DeploymentStatus } from '../types/deployment';
import { calculateAggregateUsage } from '../utils/podMetrics';
import type { ComponentScope } from '../nav';

export default function ComponentRuntime({ org, project, component }: ComponentScope): JSX.Element {
  const orgUuid = useOrgUuid();
  const { projectId, isLoading: loadingProject } = useProjectId(project);
  const { data: comp, isLoading: loadingComponent } = useComponentByHandler(projectId, component);

  const tracks = useMemo(() => comp?.deploymentTracks ?? [], [comp?.deploymentTracks]);
  const [trackId, setTrackId] = useState('');
  useEffect(() => {
    if (tracks.length) setTrackId((prev) => (prev && tracks.some((t) => t.id === prev) ? prev : (tracks.find((t) => t.latest)?.id ?? tracks[0].id)));
  }, [tracks]);

  const { data: environments = [], isLoading: loadingEnvironments, isError: environmentsError } = useEnvironments(orgUuid ?? '', projectId);
  const [envId, setEnvId] = useState('');
  useEffect(() => {
    if (environments.length) setEnvId((prev) => (prev && environments.some((e) => e.id === prev) ? prev : environments[0].id));
  }, [environments]);

  const componentId = comp?.id ?? '';
  const { data: deployment } = useComponentDeployment(org, orgUuid ?? '', componentId, trackId, envId, { refetchInterval: 15_000 });
  const releaseId = deployment?.releaseId ?? '';
  const status = deployment?.deploymentStatusV2 ?? DeploymentStatus.NotDeployed;

  const { data: release } = useReleaseDetails(projectId, componentId, releaseId);
  const clusterId = release?.environment?.environment_clusters?.[0]?.cluster_id ?? '';
  const namespace = release?.environment?.namespace ?? '';
  const isDeployed = status !== DeploymentStatus.NotDeployed && !!releaseId && release?.undeployed !== true;

  const pods = useComponentPods(projectId, clusterId, releaseId, namespace);
  const metrics = useComponentPodMetrics(projectId, clusterId, releaseId, namespace);
  const usage = useMemo(() => calculateAggregateUsage(pods.data ?? [], metrics.data ?? []), [pods.data, metrics.data]);

  const redeploy = useRedeployRelease();
  const onRedeploy = () => redeploy.mutate({ projectId, componentId, releaseId });

  const isLoading = loadingProject || loadingComponent || loadingEnvironments;

  if (!isRuntimeEnabled()) {
    return <ComingSoon title="Coming Soon" description="Runtime management is currently under development." />;
  }

  if (isLoading) {
    return (
      <PageContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
          <CircularProgress />
        </Box>
      </PageContent>
    );
  }

  if (!comp) {
    return (
      <PageContent>
        <Typography color="error">Integration not found.</Typography>
      </PageContent>
    );
  }

  if (environmentsError) {
    return (
      <PageContent>
        <Typography color="error">Failed to load environments. Please try again.</Typography>
      </PageContent>
    );
  }

  const envSelect = (
    <Select
      size="small"
      value={environments.some((e) => e.id === envId) ? envId : ''}
      onChange={(e) => setEnvId(e.target.value as string)}
      inputProps={{ 'aria-label': 'Environment' }}
      sx={{ fontSize: '0.8125rem', '& .MuiSelect-select': { py: 0.5, px: 1.5 }, minWidth: 140 }}>
      {environments.map((e) => (
        <MenuItem key={e.id} value={e.id}>
          {e.name}
        </MenuItem>
      ))}
    </Select>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {tracks.length > 0 && <DeploymentTrackBar tracks={tracks} selectedId={trackId} onChange={setTrackId} orgHandler={org} projectHandler={project} componentHandler={component} extra={envSelect} />}
      <PageContent>
        <Typography variant="h1" sx={{ mb: 3 }}>
          Runtime
        </Typography>
        <RuntimeOverview
          componentName={comp.displayName || comp.name || component}
          status={status}
          lastDeployedAt={release?.latest_deployment?.deployment_history?.CreatedAt ?? deployment?.build?.deployedAt}
          lastDeployedMessage={release?.latest_deployment?.deployment_history?.change_message}
          componentId={componentId}
          releaseId={releaseId}
          namespace={namespace}
          imageUrl={deployment?.imageUrl ?? undefined}
          isDeployed={isDeployed}
          redeploying={redeploy.isPending}
          canRedeploy={!!releaseId}
          onRedeploy={onRedeploy}
        />

        {isDeployed && (
          <>
            <PodInsightsTable
              pods={pods.data}
              metrics={metrics.data}
              replicas={release?.replicas ?? 0}
              isLoading={pods.isLoading}
              isError={pods.isError}
              isFetching={pods.isFetching || metrics.isFetching}
              onRefresh={() => {
                pods.refetch();
                metrics.refetch();
              }}
            />
            <Box sx={{ mt: 4 }}>
              <ResourceUsageCards usage={usage} />
            </Box>
          </>
        )}
      </PageContent>
    </Box>
  );
}
