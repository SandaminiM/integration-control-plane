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

import { Alert, Avatar, Box, Chip, ListingTable, MenuItem, PageContent, PageTitle, Stack, TextField, Typography, useTheme } from '@wso2/oxygen-ui';
import { Zap, Globe, XCircle } from '@wso2/oxygen-ui-icons-react';
import { useMemo, useState, type JSX } from 'react';
import { useNavigate } from 'react-router';
import { useOrgUuid } from '../hooks/useOrgUuid';
import { useProjectId } from '../hooks/useProjects';
import { useComponents } from '../hooks/useComponents';
import { useEnvironments } from '../hooks/useEnvironments';
import { useInsightsEnvironments } from '../hooks/useInsights';
import { useProjectInsights, useProjectLatencyTrend } from '../hooks/useProjectInsights';
import { useIntegrationDeploymentStatuses } from '../hooks/useDeployments';
import { identifyIntegration } from '../utils/identifyIntegration';
import { downloadProjectInsightsCsv } from '../utils/insightsCsv';
import { API_LIKE_TYPES, DEPLOYMENT_STATUS_CHIP, INSIGHTS_KIND_LABEL, PROJECT_CHART, TYPE_TO_KIND } from '../constants/insights';
import { InsightsCard, InsightsControls, KpiCards, TableSkeletonRows, TrendAreaChart } from '../components/Insights/shared';
import type { InsightsApiRef, InsightsRange } from '../types/insights';
import type { ProjectScope } from '../nav';

export default function ProjectInsights({ org, project }: ProjectScope): JSX.Element {
  const theme = useTheme();
  const navigate = useNavigate();
  const orgUuid = useOrgUuid() ?? '';
  const { projectId, project: projectData, isLoading } = useProjectId(project);

  const { data: components, isLoading: loadingComponents } = useComponents(org, projectId);
  const { data: envs } = useInsightsEnvironments(orgUuid, projectId);
  const { data: projectEnvs } = useEnvironments(orgUuid, projectId);

  const [range, setRange] = useState<InsightsRange>('7d');
  const [envId, setEnvId] = useState<string>('');
  const [trendMode, setTrendMode] = useState<'requests' | 'traffic' | 'latency'>('requests');

  // API-like integrations (Integration as API, AI Agent, MCP Server, Webhook) ride
  // the API insights path since they all publish APIM-tracked APIs, while
  // events/proxies stay excluded. RAG ingestion rides the automation one.
  const apis = useMemo(
    () =>
      (components ?? [])
        .map((c) => ({ c, type: identifyIntegration(c.displayType, c.componentSubType).type }))
        .filter(({ type }) => API_LIKE_TYPES.includes(type))
        .map(({ c, type }) => ({
          id: c.id,
          name: c.displayName || c.name,
          handler: c.handler,
          apiId: c.apiId ?? '',
          kind: (TYPE_TO_KIND[type] ?? 'api') as InsightsApiRef['kind'],
        })),
    [components],
  );
  // RAG Ingestion components run as jobs too — the insights backend's automation
  // queries include them, so they ride the same automation path with kind 'rag'.
  const automations = useMemo(
    () =>
      (components ?? [])
        .map((c) => ({ c, type: identifyIntegration(c.displayType, c.componentSubType).type }))
        .filter(({ type }) => type === 'automation' || type === 'rag-ingestion')
        .map(({ c, type }) => ({ id: c.id, name: c.displayName || c.name, handler: c.handler, kind: (type === 'rag-ingestion' ? 'rag' : 'auto') as 'auto' | 'rag' })),
    [components],
  );
  const hasIntegrations = apis.length + automations.length > 0;

  const envOptions = useMemo(() => envs?.map((e) => ({ id: e.externalEnvId || e.id, name: e.name })) ?? [{ id: 'production', name: 'Production' }], [envs]);
  const activeEnv = envId || envOptions[0]?.id || 'production';
  const selectedEnv = useMemo(() => envs?.find((e) => (e.externalEnvId || e.id) === activeEnv) ?? null, [envs, activeEnv]);

  const deploymentEnvId = useMemo(() => (projectEnvs ?? []).find((e) => e.name === selectedEnv?.name)?.id ?? projectEnvs?.[0]?.id ?? '', [projectEnvs, selectedEnv]);
  const allIntegrations = useMemo(() => [...apis, ...automations].map((c) => ({ id: c.id, handler: c.handler })), [apis, automations]);
  const { data: statusMap } = useIntegrationDeploymentStatuses(org, orgUuid, projectId, allIntegrations, deploymentEnvId);

  const real = useProjectInsights(orgUuid, projectId, selectedEnv, apis, automations, range);
  const latencyTrend = useProjectLatencyTrend(orgUuid, projectId, selectedEnv, range, trendMode === 'latency');

  const data = real.data;

  const loading = isLoading || loadingComponents || (real.enabled && real.isLoading);

  const activeEnvName = envOptions.find((e) => e.id === activeEnv)?.name ?? activeEnv;
  const handleDownloadReport = () => {
    const integrations = data.integrations.map((r) => ({
      name: r.name,
      typeLabel: INSIGHTS_KIND_LABEL[r.type],
      successCount: r.successCount,
      errorCount: r.errorCount,
      latency: r.latency,
      last: r.last,
      status: r.deleted ? 'Deleted' : (DEPLOYMENT_STATUS_CHIP[statusMap?.[r.id] ?? 'NOT_DEPLOYED']?.label ?? 'Not Deployed'),
    }));
    downloadProjectInsightsCsv(projectData?.name ?? project, activeEnvName, range, { kpis: data.kpis, trend: data.trend, integrations });
  };

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Usage Insights</PageTitle.Header>
      </PageTitle>

      <Stack direction="row" alignItems="center" justifyContent="flex-end" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
        <InsightsControls envOptions={envOptions} envId={activeEnv} onEnvChange={setEnvId} range={range} onRangeChange={setRange} onReport={handleDownloadReport} />
      </Stack>

      <Box sx={{ mb: 2 }}>
        <KpiCards kpis={data.kpis} loading={loading} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <InsightsCard title="Executions & Errors Trend" subtitle="Automation runs with failed executions">
          <TrendAreaChart
            padded
            loading={loading}
            data={data.trend}
            xName="Date"
            yName="Executions & Errors"
            height={320}
            areas={[
              { key: 'automationRuns', name: 'Executions', color: PROJECT_CHART.auto },
              { key: 'automationErrors', name: 'Errors', color: PROJECT_CHART.error },
            ]}
          />
        </InsightsCard>
        <InsightsCard
          title={trendMode === 'latency' ? 'API Latency Trend' : trendMode === 'traffic' ? 'API Traffic Trend' : 'API Requests & Errors Trend'}
          subtitle={trendMode === 'latency' ? 'Average latency (ms)' : trendMode === 'traffic' ? 'Successful vs error responses' : 'API traffic with error volume'}
          action={
            <TextField select size="small" value={trendMode} onChange={(e) => setTrendMode(e.target.value as 'requests' | 'traffic' | 'latency')} sx={{ minWidth: 140 }}>
              <MenuItem value="requests">API Requests</MenuItem>
              <MenuItem value="traffic">Traffic</MenuItem>
              <MenuItem value="latency">Latency</MenuItem>
            </TextField>
          }>
          <Box sx={{ paddingTop: '24px' }}>
            {trendMode === 'latency' ? (
              <TrendAreaChart loading={latencyTrend.isLoading || loading} data={latencyTrend.data} xName="Date" yName="Latency (ms)" height={320} areas={[{ key: 'latency', name: 'Avg Latency (ms)', color: PROJECT_CHART.api }]} />
            ) : trendMode === 'traffic' ? (
              <TrendAreaChart
                loading={loading}
                data={data.trend.map((p) => ({ label: p.label, success: Math.max(0, p.apiRequests - p.errors), errors: p.errors }))}
                xName="Date"
                yName="Traffic"
                height={320}
                areas={[
                  { key: 'success', name: 'Success', color: PROJECT_CHART.success, stackId: 'traffic' },
                  { key: 'errors', name: 'Errors', color: PROJECT_CHART.error, stackId: 'traffic' },
                ]}
              />
            ) : (
              <TrendAreaChart
                loading={loading}
                data={data.trend}
                xName="Date"
                yName="Requests & Errors"
                height={320}
                areas={[
                  { key: 'apiRequests', name: 'API requests', color: PROJECT_CHART.api },
                  { key: 'errors', name: 'Errors', color: PROJECT_CHART.error },
                ]}
              />
            )}
          </Box>
        </InsightsCard>
      </Box>

      <InsightsCard fill={false} title="Summary by Integration" subtitle={`Summary of Insights in ${activeEnvName}`}>
        {!loading && !hasIntegrations ? (
          <Alert severity="info">There are no integrations to display.</Alert>
        ) : (
          <ListingTable.Container sx={{ maxHeight: 'none', height: 'auto' }}>
            <ListingTable>
              <ListingTable.Head>
                <ListingTable.Row>
                  <ListingTable.Cell>Integration Name</ListingTable.Cell>
                  <ListingTable.Cell>Integration Type</ListingTable.Cell>
                  <ListingTable.Cell align="right">Success Count</ListingTable.Cell>
                  <ListingTable.Cell align="right">Error Count</ListingTable.Cell>
                  <ListingTable.Cell align="right">Avg Latency</ListingTable.Cell>
                  <ListingTable.Cell>Status</ListingTable.Cell>
                </ListingTable.Row>
              </ListingTable.Head>
              <ListingTable.Body>
                {loading ? (
                  <TableSkeletonRows cols={6} />
                ) : (
                  data.integrations.map((row) => {
                  const isAggregate = row.id === 'deleted-aggregate';
                  return (
                    <ListingTable.Row
                      key={row.id}
                      hover={!!row.handler}
                      onClick={row.handler ? () => navigate(`/organizations/${org}/projects/${project}/components/${row.handler}/insights/usage`) : undefined}
                      sx={isAggregate ? { bgcolor: 'rgba(189, 123, 123, 0.08)' } : row.handler ? { cursor: 'pointer' } : undefined}>
                      <ListingTable.Cell>
                        <Stack direction="row" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: 'action.selected', color: 'text.secondary' }}>{isAggregate ? <XCircle size={15} /> : row.type === 'auto' || row.type === 'rag' ? <Zap size={15} /> : <Globe size={15} />}</Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {row.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {isAggregate ? 'Combined totals from integrations removed from the project' : row.desc}
                            </Typography>
                          </Box>
                        </Stack>
                      </ListingTable.Cell>
                      <ListingTable.Cell>
                        {isAggregate ? (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        ) : (
                          <Chip size="small" variant="outlined" label={INSIGHTS_KIND_LABEL[row.type]} />
                        )}
                      </ListingTable.Cell>
                      <ListingTable.Cell align="right">{row.successCount}</ListingTable.Cell>
                      <ListingTable.Cell align="right" sx={{ color: row.errorCount !== '—' && row.errorCount !== '0' ? theme.palette.error.main : undefined }}>
                        {row.errorCount}
                      </ListingTable.Cell>
                      <ListingTable.Cell align="right">{row.latency}</ListingTable.Cell>
                      <ListingTable.Cell>
                        {row.deleted ? (
                          <Chip size="small" label="Deleted" variant="outlined" />
                        ) : (
                          (() => {
                            const s = DEPLOYMENT_STATUS_CHIP[statusMap?.[row.id] ?? 'NOT_DEPLOYED'] ?? DEPLOYMENT_STATUS_CHIP.NOT_DEPLOYED;
                            return <Chip size="small" label={s.label} color={s.color === 'default' ? undefined : s.color} variant="outlined" />;
                          })()
                        )}
                      </ListingTable.Cell>
                    </ListingTable.Row>
                  );
                  })
                )}
              </ListingTable.Body>
            </ListingTable>
          </ListingTable.Container>
        )}
      </InsightsCard>
    </PageContent>
  );
}
