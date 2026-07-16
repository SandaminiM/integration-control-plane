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

import { Alert, Box, Chip, ListingTable, MenuItem, Skeleton, Stack, StatCard, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@wso2/oxygen-ui';
import { Activity, AlertTriangle, Globe, XCircle } from '@wso2/oxygen-ui-icons-react';
import { AreaChart, PieChart } from '@wso2/oxygen-ui-charts-react';
import { useState, type JSX, type ReactNode } from 'react';
import { useApiInsights } from '../../hooks/useApiInsights';
import { ChartBox, InsightsCard } from './shared';
import type { InsightsApiRef, InsightsEnvironment, InsightsRange, ApiInsightsTab, AvailabilityKind } from '../../types/insights';

interface ApiInsightsViewProps {
  orgUuid: string;
  projectId: string;
  insightsEnv: InsightsEnvironment | null;
  apiRef: InsightsApiRef;
  range: InsightsRange;
  /** Rendered at the right end of the tabs row (env/range/report controls from the page). */
  actions?: ReactNode;
}

const TABS: { value: ApiInsightsTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'latency', label: 'Latency' },
  { value: 'errors', label: 'Errors' },
];

const CHART = { requests: '#E8964A', errors: '#E57373', latency: '#64B5F6', p95: '#E8964A', median: '#64B5F6', auth: '#E57373', target: '#9575CD', throttled: '#D9A63F', other: '#64B5F6' };
const AVAILABILITY_COLOR: Record<AvailabilityKind, string> = { available: '#81C784', limited: '#D9A63F', down: '#E57373' };

const METRIC_SERIES = {
  requests: { dataKey: 'requests', name: 'Requests', color: CHART.requests },
  errors: { dataKey: 'errors', name: 'Errors', color: CHART.errors },
  latency: { dataKey: 'latency', name: 'Latency (ms)', color: CHART.latency },
} as const;

const KPI_ICONS: Record<string, { icon: JSX.Element; color: 'primary' | 'error' | 'info' | 'warning' }> = {
  traffic: { icon: <Globe size={24} />, color: 'primary' },
  latency: { icon: <Activity size={24} />, color: 'info' },
  errorRate: { icon: <AlertTriangle size={24} />, color: 'error' },
  errorCount: { icon: <XCircle size={24} />, color: 'error' },
};

function SlowestApiBars({ rows }: { rows: { name: string; latencyMs: number }[] }): JSX.Element {
  if (rows.length === 0)
    return (
      <Typography variant="body2" color="text.secondary">
        No data in range
      </Typography>
    );
  const max = Math.max(...rows.map((r) => r.latencyMs), 1);
  return (
    <Stack gap={1.25} sx={{ mt: 0.5 }}>
      {rows.map((r) => (
        <Stack key={r.name} direction="row" alignItems="center" gap={1.5}>
          <Typography variant="caption" sx={{ width: 180, flexShrink: 0, fontFamily: 'monospace', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {r.name}
          </Typography>
          <Box sx={{ flex: 1, height: 9, borderRadius: '5px', bgcolor: 'action.hover', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${Math.round((r.latencyMs / max) * 100)}%`, borderRadius: '5px', background: 'linear-gradient(90deg,#E8964A 0%,#E57373 100%)' }} />
          </Box>
          <Typography variant="caption" sx={{ width: 60, textAlign: 'right' }}>
            {r.latencyMs} ms
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

// Per-status-code list with proxy/target split — replaces a 2-row heatmap
// that rendered as a cramped strip of squares with clipped row labels.
// Each bar shows the code's proxy-vs-target share (full-width 100% split),
// not its magnitude relative to other codes.
function StatusCodeBars({ heatmap }: { heatmap: { rows: string[]; cols: string[]; cells: { row: number; col: number; value: number }[]; max: number } }): JSX.Element {
  const codes = heatmap.cols
    .map((code, ci) => {
      const at = (ri: number) => heatmap.cells.find((c) => c.row === ri && c.col === ci)?.value ?? 0;
      return { code, proxy: at(0), target: at(1) };
    })
    .filter((c) => c.code.trim().toLowerCase() !== 'total' && c.proxy + c.target > 0);
  if (codes.length === 0) return <Alert severity="info">No errors in range.</Alert>;
  return (
    <Stack gap={1.5} sx={{ mt: 0.5 }}>
      <Stack direction="row" gap={2}>
        {[
          { label: 'Proxy', color: CHART.errors },
          { label: 'Target', color: CHART.target },
        ].map((l) => (
          <Stack key={l.label} direction="row" alignItems="center" gap={0.75}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: l.color }} />
            <Typography variant="caption" color="text.secondary">
              {l.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
      {codes.map((c) => (
        <Stack key={c.code} direction="row" alignItems="center" gap={1.5}>
          <Chip size="small" variant="outlined" color={c.code.trim().startsWith('5') ? 'error' : 'warning'} label={c.code} sx={{ width: 60, fontFamily: 'monospace' }} />
          <Box sx={{ flex: 1, height: 9, borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
            <Box sx={{ height: '100%', width: `${(c.proxy / (c.proxy + c.target)) * 100}%`, bgcolor: CHART.errors }} />
            <Box sx={{ height: '100%', width: `${(c.target / (c.proxy + c.target)) * 100}%`, bgcolor: CHART.target }} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ width: 170, textAlign: 'right', flexShrink: 0 }}>
            Proxy {c.proxy.toLocaleString()} · Target {c.target.toLocaleString()}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

/**
 * Integration-level insights for an "Integration as API" component. Matches
 * the source design's api view: KPI row + Overview/Traffic/Latency/Errors
 * tabs. Every widget is backed by a real, apiId-scoped query (see
 * `fetchApiInsights` in `api/wip/insights.ts`) — these are the queries
 * `choreo-apim-analytics-portal` uses (the actual "filter by integration"
 * Devant's own Insights page provides), ported onto the same
 * `analyticsqueryapi` endpoint the project view already uses.
 */
export default function ApiInsightsView({ orgUuid, projectId, insightsEnv, apiRef, range, actions }: ApiInsightsViewProps): JSX.Element {
  const [tab, setTab] = useState<ApiInsightsTab>('overview');
  const [overviewMetric, setOverviewMetric] = useState<'requests' | 'errors' | 'latency'>('requests');
  const { data, isLoading, enabled } = useApiInsights(orgUuid, projectId, insightsEnv, apiRef, range, tab);

  return (
    <Stack gap={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
        <ToggleButtonGroup exclusive size="small" value={tab} onChange={(_, v: ApiInsightsTab | null) => v && setTab(v)}>
          {TABS.map((t) => (
            <ToggleButton key={t.value} value={t.value} sx={{ px: 2, textTransform: 'none' }}>
              {t.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {actions}
      </Stack>

      {enabled && isLoading ? (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={96} />
            ))}
          </Box>
          <Skeleton variant="rounded" height={400} />
          <Skeleton variant="rounded" height={280} />
        </>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
            {data.kpis.map((k) => (
              <StatCard key={k.key} value={k.value} label={k.label} icon={KPI_ICONS[k.key]?.icon} iconColor={KPI_ICONS[k.key]?.color} />
            ))}
          </Box>

          {tab === 'overview' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.55fr 1fr' }, gap: 2 }}>
              <InsightsCard
                title="Requests, Errors & Latency"
                subtitle={overviewMetric === 'latency' ? 'Latency (ms) over time' : overviewMetric === 'errors' ? 'Error count over time' : 'Request count over time'}
                action={
                  <TextField select size="small" value={overviewMetric} onChange={(e) => setOverviewMetric(e.target.value as 'requests' | 'errors' | 'latency')} sx={{ minWidth: 130 }}>
                    <MenuItem value="requests">Requests</MenuItem>
                    <MenuItem value="errors">Errors</MenuItem>
                    <MenuItem value="latency">Latency</MenuItem>
                  </TextField>
                }>
                <ChartBox>
                  <AreaChart
                    data={data.overview.trend}
                    xAxisDataKey="label"
                    xAxis={{ show: true, name: 'Date' }}
                    yAxis={{ show: true, name: METRIC_SERIES[overviewMetric].name }}
                    height={320}
                    colors={[METRIC_SERIES[overviewMetric].color]}
                    areas={[{ dataKey: METRIC_SERIES[overviewMetric].dataKey, name: METRIC_SERIES[overviewMetric].name, type: 'monotone', stroke: METRIC_SERIES[overviewMetric].color, fill: METRIC_SERIES[overviewMetric].color, fillOpacity: 0.2 }]}
                    legend={{ show: true, verticalAlign: 'top' }}
                    margin={{ top: 16 }}
                    tooltip={{ show: true }}
                    grid={{ show: true }}
                  />
                </ChartBox>
              </InsightsCard>
              <InsightsCard title="Availability">
                {data.overview.availability.length === 0 ? (
                  <Alert severity="info">No traffic in range.</Alert>
                ) : (
                  <Stack alignItems="center" gap={2}>
                    <Box sx={{ width: 230, height: 230 }}>
                      <PieChart
                        data={data.overview.availability.map((a) => ({ name: a.label, value: a.value }))}
                        pies={[{ dataKey: 'value', nameKey: 'name', innerRadius: '62%', outerRadius: '100%' }]}
                        colors={data.overview.availability.map((a) => AVAILABILITY_COLOR[a.kind])}
                        height={230}
                        legend={{ show: false }}
                        tooltip={{ show: true }}
                      />
                    </Box>
                    <Stack gap={1} sx={{ width: '100%' }}>
                      {data.overview.availability.map((a) => (
                        <Stack key={a.kind} direction="row" alignItems="center" gap={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: AVAILABILITY_COLOR[a.kind], flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {a.label}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {a.value}%
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                )}
              </InsightsCard>
            </Box>
          )}

          {tab === 'traffic' && (
            <Stack gap={2}>
              <InsightsCard title="API Usage Over Time" subtitle="Successful vs error responses">
                <ChartBox>
                  <AreaChart
                    data={data.traffic.trend}
                    xAxisDataKey="label"
                    xAxis={{ show: true, name: 'Date' }}
                    yAxis={{ show: true, name: 'Requests' }}
                    height={320}
                    colors={[CHART.requests, CHART.errors]}
                    areas={[
                      { dataKey: 'requests', name: 'Success', type: 'monotone', stroke: CHART.requests, fill: CHART.requests, fillOpacity: 0.2 },
                      { dataKey: 'errors', name: 'Error', type: 'monotone', stroke: CHART.errors, fill: CHART.errors, fillOpacity: 0.2 },
                    ]}
                    legend={{ show: true, verticalAlign: 'top' }}
                    margin={{ top: 16 }}
                    tooltip={{ show: true }}
                    grid={{ show: true }}
                  />
                </ChartBox>
              </InsightsCard>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
                <InsightsCard title="Usage by Application">
                  {data.traffic.byApplication.length === 0 ? (
                    <Alert severity="info">No application traffic in range.</Alert>
                  ) : (
                    <ChartBox>
                      <AreaChart
                        data={data.traffic.byApplication}
                        xAxisDataKey="label"
                        xAxis={{ show: true, name: 'Application' }}
                        yAxis={{ show: true, name: 'Requests' }}
                        height={220}
                        colors={[CHART.requests]}
                        areas={[{ dataKey: 'value', name: 'Requests', type: 'monotone', stroke: CHART.requests, fill: CHART.requests, fillOpacity: 0.2 }]}
                        tooltip={{ show: true }}
                        grid={{ show: true }}
                        legend={{ show: true, verticalAlign: 'top' }}
                      />
                    </ChartBox>
                  )}
                </InsightsCard>
                <InsightsCard title="Usage by Backend">
                  {data.traffic.byBackend.length === 0 ? (
                    <Alert severity="info">No backend traffic in range.</Alert>
                  ) : (
                    <ChartBox>
                      <AreaChart
                        data={data.traffic.byBackend}
                        xAxisDataKey="label"
                        xAxis={{ show: true, name: 'Backend' }}
                        yAxis={{ show: true, name: 'Requests' }}
                        height={220}
                        colors={[CHART.target]}
                        areas={[{ dataKey: 'value', name: 'Requests', type: 'monotone', stroke: CHART.target, fill: CHART.target, fillOpacity: 0.2 }]}
                        tooltip={{ show: true }}
                        grid={{ show: true }}
                        legend={{ show: true, verticalAlign: 'top' }}
                      />
                    </ChartBox>
                  )}
                </InsightsCard>
              </Box>
              <InsightsCard title="Resource Usage">
                {data.traffic.resources.length === 0 ? (
                  <Alert severity="info">No resource usage in range.</Alert>
                ) : (
                  <ListingTable.Container>
                    <ListingTable density="compact">
                      <ListingTable.Head>
                        <ListingTable.Row>
                          <ListingTable.Cell>Resource</ListingTable.Cell>
                          <ListingTable.Cell>Method</ListingTable.Cell>
                          <ListingTable.Cell align="right">Requests</ListingTable.Cell>
                          <ListingTable.Cell align="right">Share</ListingTable.Cell>
                        </ListingTable.Row>
                      </ListingTable.Head>
                      <ListingTable.Body>
                        {data.traffic.resources.map((r, i) => (
                          <ListingTable.Row key={`${r.path}_${r.method}_${i}`}>
                            <ListingTable.Cell sx={{ fontFamily: 'monospace' }}>{r.path}</ListingTable.Cell>
                            <ListingTable.Cell>
                              <Chip size="small" variant="outlined" label={r.method} />
                            </ListingTable.Cell>
                            <ListingTable.Cell align="right">{r.count.toLocaleString()}</ListingTable.Cell>
                            <ListingTable.Cell align="right">{r.share}</ListingTable.Cell>
                          </ListingTable.Row>
                        ))}
                      </ListingTable.Body>
                    </ListingTable>
                  </ListingTable.Container>
                )}
              </InsightsCard>
            </Stack>
          )}

          {tab === 'latency' && (
            <Stack gap={2}>
              {data.latency.trend.length === 0 ? (
                <InsightsCard title="Latency by Category" subtitle="p95 vs median across the request lifecycle">
                  <Alert severity="info">No latency data in range.</Alert>
                </InsightsCard>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
                  {(
                    [
                      { title: 'Total Latency', p95Key: 'p95', medianKey: 'median' },
                      { title: 'Target Latency', p95Key: 'backendP95', medianKey: 'backendMedian' },
                      { title: 'Request Mediation Latency', p95Key: 'requestMedP95', medianKey: 'requestMedMedian' },
                      { title: 'Response Mediation Latency', p95Key: 'responseMedP95', medianKey: 'responseMedMedian' },
                    ] as const
                  ).map((c) => (
                    <InsightsCard key={c.title} title={c.title} subtitle="95th percentile vs median (ms)">
                      <ChartBox>
                        <AreaChart
                          data={data.latency.trend}
                          xAxisDataKey="label"
                          xAxis={{ show: true, name: 'Date' }}
                          yAxis={{ show: true, name: 'Latency (ms)' }}
                          height={260}
                          colors={[CHART.p95, CHART.median]}
                          areas={[
                            { dataKey: c.p95Key, name: 'p95', type: 'monotone', stroke: CHART.p95, fill: CHART.p95, fillOpacity: 0.2 },
                            { dataKey: c.medianKey, name: 'Median', type: 'monotone', stroke: CHART.median, fill: CHART.median, fillOpacity: 0.2 },
                          ]}
                          legend={{ show: true, verticalAlign: 'top' }}
                          margin={{ top: 16 }}
                          tooltip={{ show: true }}
                          grid={{ show: true }}
                        />
                      </ChartBox>
                    </InsightsCard>
                  ))}
                </Box>
              )}
              <InsightsCard title="Top 10 Slowest APIs" subtitle="Across this project">
                <SlowestApiBars rows={data.latency.topSlowest} />
              </InsightsCard>
            </Stack>
          )}

          {tab === 'errors' && (
            <Stack gap={2}>
              <InsightsCard title="Errors Over Time" subtitle="Grouped by error category">
                <ChartBox>
                  <AreaChart
                    data={data.errors.trend}
                    xAxisDataKey="label"
                    xAxis={{ show: true, name: 'Date' }}
                    yAxis={{ show: true, name: 'Errors' }}
                    height={320}
                    colors={[CHART.auth, CHART.throttled, CHART.target, CHART.other]}
                    areas={[
                      { dataKey: 'auth', name: 'Authentication', type: 'monotone', stackId: 'cat', stroke: CHART.auth, fill: CHART.auth, fillOpacity: 0.2 },
                      { dataKey: 'throttled', name: 'Throttling', type: 'monotone', stackId: 'cat', stroke: CHART.throttled, fill: CHART.throttled, fillOpacity: 0.2 },
                      { dataKey: 'targetConnectivity', name: 'Target', type: 'monotone', stackId: 'cat', stroke: CHART.target, fill: CHART.target, fillOpacity: 0.2 },
                      { dataKey: 'other', name: 'Other', type: 'monotone', stackId: 'cat', stroke: CHART.other, fill: CHART.other, fillOpacity: 0.2 },
                    ]}
                    legend={{ show: true, verticalAlign: 'top' }}
                    margin={{ top: 16 }}
                    tooltip={{ show: true }}
                    grid={{ show: true }}
                  />
                </ChartBox>
              </InsightsCard>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr 1fr' }, gap: 2 }}>
                <InsightsCard title="Errors by Status Code" subtitle="Proxy vs target · this API">
                  <StatusCodeBars heatmap={data.errors.statusCodeHeatmap} />
                </InsightsCard>
                <InsightsCard title="Errors by Category" subtitle="Grouped error reasons in range">
                  {data.errors.byCategory.length === 0 ? (
                    <Alert severity="info">No error details in range.</Alert>
                  ) : (
                    (() => {
                      const byReason = new Map<string, number>();
                      data.errors.byCategory.forEach((r) => {
                        const key = r.reason?.toUpperCase() ?? 'OTHER';
                        byReason.set(key, (byReason.get(key) ?? 0) + r.count);
                      });
                      const total = [...byReason.values()].reduce((a, b) => a + b, 0);
                      const auth = byReason.get('AUTH') ?? 0;
                      const target = byReason.get('TARGET_CONNECTIVITY') ?? 0;
                      const throttled = byReason.get('THROTTLED') ?? 0;
                      const rows = [
                        { label: 'Authentication', count: auth },
                        { label: 'Target', count: target },
                        { label: 'Throttling', count: throttled },
                        { label: 'Other', count: Math.max(0, total - auth - target - throttled) },
                      ];
                      return (
                        <ListingTable.Container sx={{ maxHeight: 'none', height: 'auto' }}>
                          <ListingTable density="compact">
                            <ListingTable.Body>
                              {rows.map((r) => (
                                <ListingTable.Row key={r.label}>
                                  <ListingTable.Cell>{r.label}</ListingTable.Cell>
                                  <ListingTable.Cell align="right" sx={{ fontWeight: 600 }}>
                                    {r.count.toLocaleString()}
                                  </ListingTable.Cell>
                                </ListingTable.Row>
                              ))}
                            </ListingTable.Body>
                          </ListingTable>
                        </ListingTable.Container>
                      );
                    })()
                  )}
                </InsightsCard>
              </Box>
            </Stack>
          )}

          {isLoading && (
            <Typography variant="caption" color="text.secondary">
              Refreshing…
            </Typography>
          )}
        </>
      )}
    </Stack>
  );
}
