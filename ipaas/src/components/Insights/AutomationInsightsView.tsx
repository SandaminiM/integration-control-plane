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

import { Box, Skeleton, Stack, StatCard, Typography } from '@wso2/oxygen-ui';
import { AlertTriangle, Clock, Timer, XCircle, Zap } from '@wso2/oxygen-ui-icons-react';
import { AreaChart } from '@wso2/oxygen-ui-charts-react';
import { type JSX } from 'react';
import { useOrgUuid } from '../../hooks/useOrgUuid';
import { useComponentDeployment } from '../../hooks/useDeployments';
import { useAutomationInsights, OUTCOME_COLOR } from '../../hooks/useAutomationInsights';
import AutomationExecutions from '../AutomationExecutions';
import Heatmap from './Heatmap';
import { ChartBox, InsightsCard } from './shared';
import type { Component } from '../../types/component';
import type { Environment } from '../../types/environment';
import type { InsightsEnvironment, InsightsRange } from '../../types/insights';

const KPI_ICONS: Record<string, { icon: JSX.Element; color: 'primary' | 'error' | 'info' | 'warning' }> = {
  total: { icon: <Zap size={24} />, color: 'primary' },
  failed: { icon: <XCircle size={24} />, color: 'error' },
  errorRate: { icon: <AlertTriangle size={24} />, color: 'error' },
  avgDuration: { icon: <Clock size={24} />, color: 'info' },
  p95Duration: { icon: <Timer size={24} />, color: 'info' },
};

interface AutomationInsightsViewProps {
  component: Component;
  env: Environment;
  insightsEnv: InsightsEnvironment | null;
  versionId: string;
  projectId: string;
  orgHandler: string;
  projectHandler: string;
  range: InsightsRange;
}

/**
 * Integration-level insights for an automation. Matches the source design's
 * automation view: KPI row, execution-duration scatter, failures-by-time
 * heatmap, and a daily execution trend — all shaped from the insights
 * backend's component-scoped automation queries (see `useAutomationInsights`),
 * the same way devant's own integration insights page fetches them. The
 * "Executions" table + drawer reuses `AutomationExecutions` as-is (already
 * real: `useTaskExecutions` + `ExecutionDrawer`/`LogsDrawer`) rather than
 * reimplementing a parallel "attempts" concept that has no backing data model.
 */
export default function AutomationInsightsView({ component, env, insightsEnv, versionId, projectId, orgHandler, projectHandler, range }: AutomationInsightsViewProps): JSX.Element {
  const orgUuid = useOrgUuid() ?? '';
  const { data: deployment, isLoading: loadingDeployment } = useComponentDeployment(orgHandler, orgUuid, component.id, versionId, env.id);
  const releaseId = deployment?.releaseId ?? '';

  const { data, isLoading, enabled } = useAutomationInsights(orgUuid, projectId, insightsEnv, component.id, range);

  // First-load skeletons — mirror the project page's pattern so the page
  // doesn't flash empty charts while the insights bundle loads.
  if (enabled && isLoading) {
    return (
      <Stack gap={2}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={96} />
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.5fr 0.5fr' }, gap: 2 }}>
          <Skeleton variant="rounded" height={340} />
          <Skeleton variant="rounded" height={340} />
        </Box>
        <Skeleton variant="rounded" height={400} />
        <Skeleton variant="rounded" height={280} />
      </Stack>
    );
  }

  return (
    <Stack gap={2}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2 }}>
        {data.kpis.map((k) => (
          <StatCard key={k.key} value={k.value} label={k.label} icon={KPI_ICONS[k.key]?.icon} iconColor={KPI_ICONS[k.key]?.color} />
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.5fr 0.5fr' }, gap: 2 }}>
        <InsightsCard title="Execution Duration Over Time" subtitle="Run duration per execution (seconds)">
          <ChartBox>
            <AreaChart
              data={data.scatter.map((p) => ({ label: p.label, duration: p.durationSec }))}
              xAxisDataKey="label"
              xAxis={{ show: true, name: 'Date' }}
              yAxis={{ show: true, name: 'Duration (s)' }}
              height={320}
              colors={['#64B5F6']}
              areas={[{ dataKey: 'duration', name: 'Duration (s)', type: 'monotone', stroke: '#64B5F6', fill: '#64B5F6', fillOpacity: 0.2 }]}
              legend={{ show: true, verticalAlign: 'top' }}
              margin={{ top: 16 }}
              tooltip={{ show: true }}
              grid={{ show: true }}
            />
          </ChartBox>
        </InsightsCard>
        <InsightsCard title="Failures by Time" subtitle="Day of week × hour of day">
          <Box sx={{ flex: 1, display: 'flex', paddingTop: '64px' }}>
            <Heatmap data={data.heatmap} color={OUTCOME_COLOR.failure} everyCol={4} cellWidth={30} cellHeight={30} />
          </Box>
        </InsightsCard>
      </Box>

      <InsightsCard title="Execution Trend" subtitle="Runs per day by outcome">
        <Box sx={{ paddingTop: '24px', '& .recharts-cartesian-grid line': { opacity: 0.3 }, '& .recharts-legend-wrapper': { paddingTop: '0 !important', top: '0 !important' } }}>
          <AreaChart
            data={data.trend}
            xAxisDataKey="label"
            xAxis={{ show: true, name: 'Date' }}
            yAxis={{ show: true, name: 'Executions' }}
            height={320}
            colors={[OUTCOME_COLOR.success, OUTCOME_COLOR.failure, OUTCOME_COLOR.timeout]}
            areas={[
              { dataKey: 'success', name: 'Success', type: 'monotone', stackId: 'outcome', stroke: OUTCOME_COLOR.success, fill: OUTCOME_COLOR.success, fillOpacity: 0.2 },
              { dataKey: 'failure', name: 'Failed', type: 'monotone', stackId: 'outcome', stroke: OUTCOME_COLOR.failure, fill: OUTCOME_COLOR.failure, fillOpacity: 0.2 },
              { dataKey: 'timeout', name: 'Timeout', type: 'monotone', stackId: 'outcome', stroke: OUTCOME_COLOR.timeout, fill: OUTCOME_COLOR.timeout, fillOpacity: 0.2 },
            ]}
            legend={{ show: true, verticalAlign: 'top' }}
            margin={{ top: 16 }}
            tooltip={{ show: true }}
            grid={{ show: true }}
          />
        </Box>
      </InsightsCard>

      <InsightsCard title="Executions" subtitle="Click a row to inspect arguments & logs">
        {loadingDeployment || isLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            Loading…
          </Typography>
        ) : (
          <AutomationExecutions
            releaseId={releaseId}
            projectId={projectId}
            componentId={component.id}
            deploymentTrackId={versionId}
            environmentId={env.id}
            orgHandler={orgHandler}
            projectHandler={projectHandler}
            componentHandler={component.handler}
            envCritical={env.critical ?? false}
          />
        )}
      </InsightsCard>
    </Stack>
  );
}
