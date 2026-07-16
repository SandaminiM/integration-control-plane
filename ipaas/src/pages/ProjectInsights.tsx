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

import { Alert, Avatar, Box, Button, Chip, CircularProgress, ListingTable, MenuItem, PageContent, PageTitle, Skeleton, Stack, StatCard, TextField, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@wso2/oxygen-ui';
import { Download, Zap, Globe, AlertTriangle, XCircle } from '@wso2/oxygen-ui-icons-react';
import { AreaChart } from '@wso2/oxygen-ui-charts-react';
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
import type { InsightsApiRef, InsightsRange } from '../types/insights';
import type { ProjectScope } from '../nav';

const RANGES: { value: InsightsRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '3mo', label: '3mo' },
];

// Pastel set validated with the dataviz palette checker: lightness band,
// chroma floor and adjacent-pair CVD pass; low surface contrast relieved by legends/tooltips.
const CHART = { api: '#E8964A', auto: '#64B5F6', error: '#E57373', success: '#81C784', failure: '#E57373', timeout: '#D9A63F' };

const KPI_ICONS: Record<string, { icon: JSX.Element; color: 'primary' | 'error' | 'info' | 'warning' }> = {
  traffic: { icon: <Globe size={24} />, color: 'primary' },
  executions: { icon: <Zap size={24} />, color: 'info' },
  errorRequests: { icon: <AlertTriangle size={24} />, color: 'error' },
  failedExecutions: { icon: <XCircle size={24} />, color: 'error' },
};

const DEPLOYMENT_STATUS_CHIP: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  ACTIVE: { label: 'Active', color: 'success' },
  IN_PROGRESS: { label: 'In Progress', color: 'warning' },
  ERROR: { label: 'Error', color: 'error' },
  SUSPENDED: { label: 'Suspended', color: 'default' },
  NOT_DEPLOYED: { label: 'Not Deployed', color: 'default' },
};

function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }): JSX.Element {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1.5} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

function downloadInsightsCsv(
  projectName: string,
  envName: string,
  range: string,
  data: {
    kpis: { label: string; value: string }[];
    trend: { label: string; apiRequests: number; automationRuns: number; automationErrors: number; errors: number }[];
    integrations: { name: string; type: string; successCount: string; errorCount: string; latency: string; last: string; status: string }[];
  },
): void {
  const esc = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const row = (...cells: unknown[]) => cells.map(esc).join(',');
  const lines: string[] = [
    row('Project Insights Report'),
    row('Project', projectName),
    row('Environment', envName),
    row('Period', range),
    row('Generated', new Date().toISOString()),
    '',
    row('KPI', 'Value'),
    ...data.kpis.map((k) => row(k.label, k.value)),
    '',
    row('Bucket', 'API Requests', 'API Errors', 'Automation Runs', 'Automation Failures'),
    ...data.trend.map((p) => row(p.label, p.apiRequests, p.errors, p.automationRuns, p.automationErrors)),
    '',
    row('Integration', 'Type', 'Success Count', 'Error Count', 'Avg Latency', 'Last Run', 'Status'),
    ...data.integrations.map((r) =>
      row(r.name, r.type === 'auto' ? 'Automation' : r.type === 'rag' ? 'RAG Ingestion' : r.type === 'agent' ? 'AI Agent' : r.type === 'mcp' ? 'MCP Server' : r.type === 'webhook' ? 'Webhook' : 'Integration as API', r.successCount, r.errorCount, r.latency, r.last, r.status),
    ),
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `insights-${projectName}-${envName}-${range}.csv`.replace(/\s+/g, '-').toLowerCase();
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ProjectInsights({ org, project }: ProjectScope): JSX.Element {
  const theme = useTheme();
  const navigate = useNavigate();
  const orgUuid = useOrgUuid() ?? '';
  const { projectId, project: projectData, isLoading } = useProjectId(project);

  const { data: components } = useComponents(org, projectId);
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
        .filter(({ type }) => ['integration-as-api', 'ai-agent', 'mcp-server', 'webhook'].includes(type))
        .map(({ c, type }) => ({
          id: c.id,
          name: c.displayName || c.name,
          handler: c.handler,
          apiId: c.apiId ?? '',
          kind: (type === 'ai-agent' ? 'agent' : type === 'mcp-server' ? 'mcp' : type === 'webhook' ? 'webhook' : 'api') as InsightsApiRef['kind'],
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

  if (isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', py: 8 }} />;

  if (real.enabled && real.isLoading) {
    return (
      <PageContent>
        <PageTitle>
          <PageTitle.Header>Usage Insights</PageTitle.Header>
        </PageTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={104} />
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <Skeleton variant="rounded" height={380} />
          <Skeleton variant="rounded" height={380} />
        </Box>
        <Skeleton variant="rounded" height={240} />
      </PageContent>
    );
  }

  // const total = data.trend.reduce((a, p) => a + p.apiRequests, 0);
  const activeEnvName = envOptions.find((e) => e.id === activeEnv)?.name ?? activeEnv;
  const handleDownloadReport = () => {
    const enrichedIntegrations = data.integrations.map((r) => ({
      ...r,
      status: r.deleted ? 'Deleted' : (DEPLOYMENT_STATUS_CHIP[statusMap?.[r.id] ?? 'NOT_DEPLOYED']?.label ?? 'Not Deployed'),
    }));
    downloadInsightsCsv(projectData?.name ?? project, activeEnvName, range, { ...data, integrations: enrichedIntegrations });
  };

  return (
    <PageContent>
      {/* ---------- Header + controls row beneath it ---------- */}
      <PageTitle>
        <PageTitle.Header>Usage Insights</PageTitle.Header>
      </PageTitle>

      <Stack direction="row" alignItems="center" justifyContent="flex-end" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
        <TextField select size="small" value={activeEnv} onChange={(e) => setEnvId(e.target.value)} sx={{ minWidth: 160 }}>
          {envOptions.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.name}
            </MenuItem>
          ))}
        </TextField>
        <ToggleButtonGroup exclusive size="small" value={range} onChange={(_, v: InsightsRange | null) => v && setRange(v)}>
          {RANGES.map((r) => (
            <ToggleButton key={r.value} value={r.value} sx={{ px: 1.5, textTransform: 'none' }}>
              {r.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button variant="contained" size="small" startIcon={<Download size={16} />} onClick={handleDownloadReport}>
          Report
        </Button>
      </Stack>

      {/* ---------- KPI row ---------- */}
      {/* Always rendered — with no live data yet, each KPI's raw value defaults
          to 0 (see useProjectInsights' placeholder `raw`) instead of hiding
          the whole row. */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        {data.kpis.map((k) => (
          <StatCard key={k.key} value={k.value} label={k.label} icon={KPI_ICONS[k.key]?.icon} iconColor={KPI_ICONS[k.key]?.color} />
        ))}
      </Box>

      {/* ---------- Trend charts ---------- */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <Card title="Executions & Errors Trend" subtitle="Automation runs with failed executions">
          <Box sx={{ paddingTop: '24px', '& .recharts-cartesian-grid line': { opacity: 0.3 }, '& .recharts-legend-wrapper': { paddingTop: '0 !important', top: '0 !important' } }}>
            <AreaChart
              data={data.trend}
              xAxisDataKey="label"
              xAxis={{show: true, name: 'Date'}}
              yAxis={{show: true, name: 'Executions & Errors'}}
              height={320}
              colors={[CHART.auto, CHART.error]}
              areas={[
                { dataKey: 'automationRuns', name: 'Executions', type: 'monotone', stroke: CHART.auto, fill: CHART.auto, fillOpacity: 0.2 },
                { dataKey: 'automationErrors', name: 'Errors', type: 'monotone', stroke: CHART.error, fill: CHART.error, fillOpacity: 0.2 },
              ]}
              legend={{ show: true, verticalAlign: 'top' }}
              margin={{ top: 16 }}
              tooltip={{ show: true }}
              grid={{ show: true }}
            />
          </Box>
        </Card>
        <Card
          title={trendMode === 'latency' ? 'API Latency Trend' : trendMode === 'traffic' ? 'API Traffic Trend' : 'API Requests & Errors Trend'}
          subtitle={trendMode === 'latency' ? 'Average latency (ms)' : trendMode === 'traffic' ? 'Successful vs error responses' : 'API traffic with error volume'}
          action={
            <TextField select size="small" value={trendMode} onChange={(e) => setTrendMode(e.target.value as 'requests' | 'traffic' | 'latency')} sx={{ minWidth: 140 }}>
              <MenuItem value="requests">API Requests</MenuItem>
              <MenuItem value="traffic">Traffic</MenuItem>
              <MenuItem value="latency">Latency</MenuItem>
            </TextField>
          }>
          <Box sx={{ paddingTop: '24px', '& .recharts-cartesian-grid line': { opacity: 0.3 }, '& .recharts-legend-wrapper': { paddingTop: '0 !important', top: '0 !important' } }}>
            {trendMode === 'latency' ? (
              latencyTrend.isLoading ? (
                <Skeleton variant="rounded" height={320} />
              ) : (
                <AreaChart
                  data={latencyTrend.data}
                  xAxisDataKey="label"
                  xAxis={{ show: true, name: 'Date' }}
                  yAxis={{ show: true, name: 'Latency (ms)' }}
                  height={320}
                  colors={[CHART.api]}
                  areas={[{ dataKey: 'latency', name: 'Avg Latency (ms)', type: 'monotone', stroke: CHART.api, fill: CHART.api, fillOpacity: 0.2 }]}
                  legend={{ show: true, verticalAlign: 'top' }}
                  margin={{ top: 16 }}
                  tooltip={{ show: true }}
                  grid={{ show: true }}
                />
              )
            ) : trendMode === 'traffic' ? (
              <AreaChart
                data={data.trend.map((p) => ({ label: p.label, success: Math.max(0, p.apiRequests - p.errors), errors: p.errors }))}
                xAxisDataKey="label"
                xAxis={{ show: true, name: 'Date' }}
                yAxis={{ show: true, name: 'Traffic' }}
                height={320}
                colors={[CHART.success, CHART.error]}
                areas={[
                  { dataKey: 'success', name: 'Success', type: 'monotone', stackId: 'traffic', stroke: CHART.success, fill: CHART.success, fillOpacity: 0.2 },
                  { dataKey: 'errors', name: 'Errors', type: 'monotone', stackId: 'traffic', stroke: CHART.error, fill: CHART.error, fillOpacity: 0.2 },
                ]}
                legend={{ show: true, verticalAlign: 'top' }}
                margin={{ top: 16 }}
                tooltip={{ show: true }}
                grid={{ show: true }}
              />
            ) : (
              <AreaChart
                data={data.trend}
                xAxisDataKey="label"
                xAxis={{ show: true, name: 'Date' }}
                yAxis={{ show: true, name: 'Requests & Errors' }}
                height={320}
                colors={[CHART.api, CHART.error]}
                areas={[
                  { dataKey: 'apiRequests', name: 'API requests', type: 'monotone', stroke: CHART.api, fill: CHART.api, fillOpacity: 0.2 },
                  { dataKey: 'errors', name: 'Errors', type: 'monotone', stroke: CHART.error, fill: CHART.error, fillOpacity: 0.2 },
                ]}
                legend={{ show: true, verticalAlign: 'top' }}
                margin={{ top: 16 }}
                tooltip={{ show: true }}
                grid={{ show: true }}
              />
            )}
          </Box>
        </Card>
      </Box>

      {/* ---------- Integrations table ---------- */}
      <Card title="Integrations" subtitle={`Integration as API and Automation type Integrations`}>
        {!hasIntegrations ? (
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
                {data.integrations.map((row) => (
                  <ListingTable.Row
                    key={row.id}
                    hover={!!row.handler}
                    onClick={row.handler ? () => navigate(`/organizations/${org}/projects/${project}/components/${row.handler}/insights/usage`) : undefined}
                    sx={row.handler ? { cursor: 'pointer' } : undefined}>
                    <ListingTable.Cell>
                      <Stack direction="row" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 30, height: 30, bgcolor: 'action.selected', color: 'text.secondary' }}>{row.type === 'auto' || row.type === 'rag' ? <Zap size={15} /> : <Globe size={15} />}</Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {row.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.desc}
                          </Typography>
                        </Box>
                      </Stack>
                    </ListingTable.Cell>
                    <ListingTable.Cell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={row.type === 'auto' ? 'Automation' : row.type === 'rag' ? 'RAG Ingestion' : row.type === 'agent' ? 'AI Agent' : row.type === 'mcp' ? 'MCP Server' : row.type === 'webhook' ? 'Webhook' : 'Integration as API'}
                      />
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
                ))}
              </ListingTable.Body>
            </ListingTable>
          </ListingTable.Container>
        )}
      </Card>
    </PageContent>
  );
}
