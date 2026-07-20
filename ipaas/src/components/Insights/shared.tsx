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

import { Alert, Box, Button, Chip, Divider, ListingTable, MenuItem, Paper, Skeleton, Stack, StatCard, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Download } from '@wso2/oxygen-ui-icons-react';
import { AreaChart, BarChart } from '@wso2/oxygen-ui-charts-react';
import type { JSX, ReactNode } from 'react';
import { DEPLOYMENT_STATUS_CHIP, INSIGHTS_CHART_COLORS, INSIGHTS_KIND_LABEL, INSIGHTS_RANGES, KIND_DOT, KIND_SHORT, KPI_ICONS } from '../../constants/insights';
import type { InsightsRange, ProjectActivityChart, ProjectFailingRow, ProjectInsightsKpi, ProjectVolumeRow, ProjectLatencyRow } from '../../types/insights';
import type { RecentDeployment } from '../../types/deployment';

const TOGGLE_SX = { px: 1.5, textTransform: 'none' } as const;

/** Hard-truncate a name to `max` chars with an ellipsis; full text goes in a tooltip. */
const truncateName = (s: string, max = 25): string => (s.length > max ? `${s.slice(0, max)}…` : s);

/** Same card chrome as the project Insights view (`pages/ProjectInsights.tsx`), shared here so all three views look like one page.
 * `plain` keeps the surface as a bordered Box — used by cards wrapping a table, which bring their own surface. */
export function InsightsCard({ title, subtitle, action, children, fill = true, plain = false }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; fill?: boolean; plain?: boolean }): JSX.Element {
  const header = (
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
  );

  if (plain) {
    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5, height: fill ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
        {header}
        {children}
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: fill ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
      {header}
      {children}
    </Paper>
  );
}

/** Chart wrapper matching the project page's chart styling: faint grid lines,
 * and kills the chart lib's hardcoded inline `paddingTop: 32` on the recharts
 * legend wrapper (inline style — only `!important` beats it). `padded` adds the
 * 24px top gap the project/automation trend cards use above their charts. */
export function ChartBox({ children, padded = false }: { children: ReactNode; padded?: boolean }): JSX.Element {
  return (
    <Box sx={{ ...(padded ? { paddingTop: '24px' } : null), '& .recharts-cartesian-grid line': { opacity: 0.3 }, '& .recharts-legend-wrapper': { paddingTop: '0 !important', top: '0 !important' } }}>{children}</Box>
  );
}

interface TrendAreaChartProps {
  data: unknown[];
  xKey?: string;
  xName?: string;
  yName?: string;
  height?: number;
  areas: { key: string; name: string; color: string; stackId?: string }[];
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  /** add the 24px top gap the project/automation trend cards use */
  padded?: boolean;
  /** show a skeleton placeholder instead of the chart while data loads */
  loading?: boolean;
}

/** Stacked/overlaid area trend chart — fills the repeated AreaChart boilerplate
 * shared by every insights trend widget (grid, top legend, monotone areas at
 * 0.2 fill opacity, tooltip). */
export function TrendAreaChart({ data, xKey = 'label', xName, yName, height, areas, margin, padded = false, loading = false }: TrendAreaChartProps): JSX.Element {
  if (loading) return <Skeleton variant="rounded" height={height ?? 320} />;
  return (
    <ChartBox padded={padded}>
      <AreaChart
        data={data}
        xAxisDataKey={xKey}
        xAxis={{ show: true, name: xName }}
        yAxis={{ show: true, name: yName }}
        height={height}
        colors={areas.map((a) => a.color)}
        areas={areas.map((a) => ({ dataKey: a.key, name: a.name, type: 'monotone', stackId: a.stackId, stroke: a.color, fill: a.color, fillOpacity: 0.2 }))}
        legend={{ show: true, verticalAlign: 'top' }}
        margin={margin ?? { top: 16 }}
        tooltip={{ show: true }}
        grid={{ show: true }}
      />
    </ChartBox>
  );
}

interface InsightsControlsProps {
  envOptions: { id: string; name: string }[];
  envId: string;
  onEnvChange: (id: string) => void;
  range: InsightsRange;
  onRangeChange: (r: InsightsRange) => void;
  onReport: () => void;
  /** Disable the Report button (e.g. until a real insights environment is resolved). */
  reportDisabled?: boolean;
}

/** Environment select + range toggle + Report button cluster shared by the
 * project and integration insights pages. */
export function InsightsControls({ envOptions, envId, onEnvChange, range, onRangeChange, onReport, reportDisabled = false }: InsightsControlsProps): JSX.Element {
  return (
    <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
      {envOptions.length > 0 && (
        <TextField select size="small" value={envId} onChange={(e) => onEnvChange(e.target.value)} inputProps={{ 'aria-label': 'Environment' }} sx={{ minWidth: 160 }}>
          {envOptions.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.name}
            </MenuItem>
          ))}
        </TextField>
      )}
      <ToggleButtonGroup exclusive size="small" aria-label="Time range" value={range} onChange={(_, v: InsightsRange | null) => v && onRangeChange(v)}>
        {INSIGHTS_RANGES.map((r) => (
          <ToggleButton key={r.value} value={r.value} sx={TOGGLE_SX}>
            {r.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Button variant="contained" size="small" startIcon={<Download size={16} />} onClick={onReport} disabled={reportDisabled}>
        Report
      </Button>
    </Stack>
  );
}

/** KPI stat-card row shared by all three insights views. While `loading`, each
 * card keeps its label + icon and shows a skeleton in place of the value.
 * StatCard renders `value` straight into a Typography, so a node works at
 * runtime; its prop type is string|number, hence the localized cast. */
export function KpiCards({ kpis, loading = false, lgColumns = 4 }: { kpis: { key: string; label: string; value: string }[]; loading?: boolean; lgColumns?: number }): JSX.Element {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: `repeat(${lgColumns}, 1fr)` }, gap: 2 }}>
      {kpis.map((k) => (
        <StatCard
          key={k.key}
          label={k.label}
          icon={KPI_ICONS[k.key]?.icon}
          iconColor={KPI_ICONS[k.key]?.color}
          value={loading ? ((<Skeleton variant="text" width={72} sx={{ fontSize: (t) => t.typography.h5.fontSize }} />) as unknown as string) : k.value}
        />
      ))}
    </Box>
  );
}

/** Richer KPI row for the project Usage Insights view: uppercase label + icon,
 * large value, optional delta chip, and (for Active Integrations) a per-kind
 * dot+count type-mix. Kept separate from KpiCards so the API/automation views
 * keep their simpler cards. */
export function ProjectKpiCards({ kpis, loading = false }: { kpis: ProjectInsightsKpi[]; loading?: boolean }): JSX.Element {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
      {kpis.map((k) => {
        const ic = KPI_ICONS[k.key];
        return (
          <Paper key={k.key} variant="outlined" sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 600 }}>
                {k.label}
              </Typography>
              {ic?.icon && <Box sx={{ color: `${ic.color}.main`, display: 'flex' }}>{ic.icon}</Box>}
            </Stack>
            {loading ? (
              <Skeleton variant="text" width={80} sx={{ fontSize: (t) => t.typography.h4.fontSize }} />
            ) : (
              <Typography variant="h4" sx={{ fontWeight: 700, color: k.danger ? 'error.main' : k.key === 'successRate' ? 'success.main' : 'text.primary' }}>
                {k.value}
              </Typography>
            )}
            {!loading && k.typeMix && k.typeMix.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.5 }}>
                {k.typeMix.map((t) => (
                  <Stack key={t.kind} direction="row" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: KIND_DOT[t.kind], flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary">
                      {t.count} {KIND_SHORT[t.kind]}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : !loading && k.sub ? (
              <Typography variant="caption" color="text.secondary">
                {k.sub}
              </Typography>
            ) : null}
          </Paper>
        );
      })}
    </Box>
  );
}

/** Skeleton body rows for a ListingTable while its data loads (headers stay real). */
export function TableSkeletonRows({ rows = 5, cols }: { rows?: number; cols: number }): JSX.Element {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <ListingTable.Row key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <ListingTable.Cell key={c}>
              <Skeleton variant="text" />
            </ListingTable.Cell>
          ))}
        </ListingTable.Row>
      ))}
    </>
  );
}

/** "Activity over time" — one bar chart per integration type, each in its own
 * native unit and scale. Header per mini shows a color dot + title + unit on the
 * left and the bucket-summed total on the right. */
export function ActivityOverTime({ charts, loading = false }: { charts: ProjectActivityChart[]; loading?: boolean }): JSX.Element {
  return (
    <InsightsCard title="Activity over time" subtitle="Per integration type — each in its native unit and scale">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {charts.map((c) => (
          <Box key={c.key} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c.color, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {c.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {c.unit}
                </Typography>
              </Stack>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {c.total}
              </Typography>
            </Stack>
            {loading ? (
              <Skeleton variant="rounded" height={200} />
            ) : (
              <ChartBox>
                <BarChart data={c.points} xAxisDataKey="label" xAxis={{ show: true }} yAxis={{ show: true }} height={150} bars={[{ dataKey: 'count', name: c.title, fill: c.color, radius: [2, 2, 0, 0] }]} legend={{ show: false }} grid={{ show: true }} tooltip={{ show: true }} margin={{ top: 8, right: 12, left: -16, bottom: 0 }} />
              </ChartBox>
            )}
          </Box>
        ))}
      </Box>
    </InsightsCard>
  );
}

/** "Top integrations by volume" — every integration as a table row (Name / Type /
 * Volume). Volume cell shows the count then a fixed-width proportion bar (so full
 * bar always means 100%). Rows with a handler navigate via onRowClick. */
export function TopByVolume({ rows, loading = false, onRowClick }: { rows: ProjectVolumeRow[]; loading?: boolean; onRowClick?: (handler: string) => void }): JSX.Element {
  return (
    <InsightsCard fill={false} title="Active integrations by volume" subtitle="Share of total invocations">
      {!loading && rows.length === 0 ? (
        <Alert severity="info">No integrations to display.</Alert>
      ) : (
        <ListingTable.Container disablePaper sx={{ maxHeight: 'none', height: 'auto' }}>
          <ListingTable density="standard" variant="card">
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell sx={{ width: '22%' }}>Name</ListingTable.Cell>
                <ListingTable.Cell>Type</ListingTable.Cell>
                <ListingTable.Cell>Volume</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {loading ? (
                <TableSkeletonRows cols={3} />
              ) : (
                rows.map((r) => {
                  const clickable = !!(r.handler && onRowClick);
                  return (
                    <ListingTable.Row key={r.id} variant="card" hover={clickable} clickable={clickable} onClick={clickable ? () => onRowClick!(r.handler) : undefined}>
                      <ListingTable.Cell sx={{ width: '22%' }}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: r.color, flexShrink: 0 }} />
                          <Tooltip title={r.name}>
                            <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap', minWidth: 0 }}>
                              {truncateName(r.name)}
                            </Typography>
                          </Tooltip>
                        </Stack>
                      </ListingTable.Cell>
                      <ListingTable.Cell>
                        <Chip size="small" variant="outlined" label={INSIGHTS_KIND_LABEL[r.type]} />
                      </ListingTable.Cell>
                      <ListingTable.Cell>
                        <Stack direction="row" alignItems="center" gap={1.5}>
                          <Typography variant="body2" sx={{ minWidth: 100, whiteSpace: 'nowrap' }}>
                            {r.volume}{' '}
                            <Typography component="span" variant="caption" color="text.secondary">
                              {r.unit}
                            </Typography>
                          </Typography>
                          <Box sx={{ flex: 1, minWidth: 120, height: 6, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${r.share}%`, bgcolor: r.color, borderRadius: 3 }} />
                          </Box>
                        </Stack>
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
  );
}

/** Errors-over-time area chart (dots off), a divider, then the top failing
 * integrations by error rate. Error count is the highlighted figure, with the
 * rate shown beneath as "{rate}% of {unit}". */
export function TopFailing({ rows, errorSeries, loading = false }: { rows: ProjectFailingRow[]; errorSeries: { label: string; errors: number }[]; loading?: boolean }): JSX.Element {
  return (
    <InsightsCard title="Errors over time" subtitle="Total errors · selected period">
      {loading ? (
        <Skeleton variant="rounded" height={180} />
      ) : (
        <ChartBox>
          <AreaChart
            data={errorSeries}
            xAxisDataKey="label"
            xAxis={{ show: true }}
            yAxis={{ show: true }}
            height={180}
            colors={[INSIGHTS_CHART_COLORS.red]}
            areas={[{ dataKey: 'errors', name: 'Errors', type: 'monotone', stroke: INSIGHTS_CHART_COLORS.red, fill: INSIGHTS_CHART_COLORS.red, fillOpacity: 0.2, dot: false }]}
            legend={{ show: false }}
            tooltip={{ show: true }}
            grid={{ show: true }}
            margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
          />
        </ChartBox>
      )}
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        Top failing integrations
      </Typography>
      {loading ? (
        <Skeleton variant="rounded" height={120} />
      ) : rows.length === 0 ? (
        <Alert severity="info">No failing integrations in this period.</Alert>
      ) : (
        <Stack gap={1.5}>
          {rows.map((r) => (
            <Stack key={r.id} direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                {r.name}
              </Typography>
              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {r.errorCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {r.errorRate}% of {r.unit}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </InsightsCard>
  );
}

/** Latency & duration summary — one block per type (Services / Automations), each
 * with its available metrics. */
export function LatencyDuration({ rows, loading = false }: { rows: ProjectLatencyRow[]; loading?: boolean }): JSX.Element {
  return (
    <InsightsCard title="Latency & duration" subtitle="Services & automations">
      {loading ? (
        <Skeleton variant="rounded" height={120} />
      ) : rows.length === 0 ? (
        <Alert severity="info">No latency data in this period.</Alert>
      ) : (
        <Stack gap={2}>
          {rows.map((r) => (
            <Stack key={r.key} direction="row" alignItems="center" justifyContent="space-between" gap={2}>
              <Stack direction="row" alignItems="baseline" gap={1} sx={{ minWidth: 0 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: r.color, flexShrink: 0, alignSelf: 'center' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {r.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {r.sub}
                </Typography>
              </Stack>
              <Stack direction="row" gap={3} flexShrink={0}>
                {r.metrics.map((m) => (
                  <Box key={m.label} sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {m.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '.3px' }}>
                      {m.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </InsightsCard>
  );
}

/** Recent deployments feed — newest first, per the selected environment. */
export function RecentDeployments({ items, envName, loading = false }: { items: RecentDeployment[]; envName: string; loading?: boolean }): JSX.Element {
  const fmtWhen = (iso: string): string => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  return (
    <InsightsCard title="Recent deployments" subtitle={`Latest in ${envName}`}>
      {loading ? (
        <Skeleton variant="rounded" height={120} />
      ) : items.length === 0 ? (
        <Alert severity="info">No recent deployments.</Alert>
      ) : (
        <Stack gap={1.5}>
          {items.map((d) => {
            const s = DEPLOYMENT_STATUS_CHIP[d.status] ?? DEPLOYMENT_STATUS_CHIP.UNKNOWN;
            return (
            <Box key={d.id}>
              <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: d.color, flexShrink: 0 }} />
                {/* <Chip size="small" variant="outlined" label={s.label} color={s.color === 'default' ? undefined : s.color} /> */}
                <Tooltip title={d.name}>
                  <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>
                    {truncateName(d.name, 40)}
                  </Typography>
                </Tooltip>
                <Chip size="small" variant="outlined" label={s.label} color={s.color === 'default' ? undefined : s.color} />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {d.version ? `${d.version} · ` : ''}deployed to {envName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {fmtWhen(d.deployedAt)}
                {d.by ? ` · by ${d.by}` : ''}
              </Typography>
            </Box>
            );
          })}
        </Stack>
      )}
    </InsightsCard>
  );
}
