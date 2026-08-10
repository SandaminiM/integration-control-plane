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

import { Box, PageContent, PageTitle, Stack, Typography } from '@wso2/oxygen-ui';
import { useMemo, useState, type JSX } from 'react';
import { useNavigate } from 'react-router';
import { useOrgUuid } from '../hooks/useOrgUuid';
import { useOrgComponents } from '../hooks/useComponents';
import { useProjectsByOrg } from '../hooks/useProjects';
import { useOrgInsightsEnvironments } from '../hooks/useInsights';
import { useProjectInsights } from '../hooks/useProjectInsights';
import { identifyIntegration } from '../utils/identifyIntegration';
import { downloadProjectInsightsCsv } from '../utils/insightsCsv';
import { API_LIKE_TYPES, INSIGHTS_KIND_LABEL, TYPE_TO_KIND } from '../constants/insights';
import { InsightsControls } from '../components/Insights/shared';
import { ProjectKpiCards } from '../components/Insights/ProjectKpiCards';
import { ActivityOverTime } from '../components/Insights/ActivityOverTime';
import { TopByVolume } from '../components/Insights/TopByVolume';
import { TopFailing } from '../components/Insights/TopFailing';
import { LatencyDuration } from '../components/Insights/LatencyDuration';
import type { InsightsApiRef, InsightsRange } from '../types/insights';
import type { OrgScope } from '../nav';

/**
 * Org-level Usage Insights — the project page's layout widened to the whole org.
 *
 * API-like integrations only: the insights backend can aggregate automations and
 * RAG ingestion per project but not org-wide, so passing empty automation and
 * event lists keeps every section (activity, latency, volume, errors) to the API
 * data that is actually fetchable. Each section renders whatever rows it is
 * given, so this is the only place the restriction needs to exist — the shared
 * components stay level-agnostic.
 */
export default function OrgInsights({ org }: OrgScope): JSX.Element {
  const navigate = useNavigate();
  const orgUuid = useOrgUuid() ?? '';

  const { data: envs, isLoading: envsLoading } = useOrgInsightsEnvironments(orgUuid);
  const { data: components, isLoading: loadingComponents } = useOrgComponents(org);
  const { data: projects } = useProjectsByOrg(org);

  const [range, setRange] = useState<InsightsRange>('7d');
  const [envId, setEnvId] = useState<string>('');

  const apis = useMemo(
    () =>
      components
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

  // The synthetic "Production" placeholder only stands in while the env list
  // hasn't loaded; an explicitly empty list gets the no-environments state instead.
  const envOptions = useMemo(() => (envs ? envs.map((e) => ({ id: e.externalEnvId || e.id, name: e.name })) : [{ id: 'production', name: 'Production' }]), [envs]);
  const activeEnv = envId || envOptions[0]?.id || 'production';
  const selectedEnv = useMemo(() => envs?.find((e) => (e.externalEnvId || e.id) === activeEnv) ?? null, [envs, activeEnv]);

  const real = useProjectInsights(orgUuid, null, selectedEnv, apis, [], [], range, { includeAutomations: false });
  const data = real.data;

  const noEnvironments = !envsLoading && (envs?.length ?? 0) === 0;
  const loading = envsLoading || loadingComponents || (real.enabled && real.isLoading);

  const activeEnvName = envOptions.find((e) => e.id === activeEnv)?.name ?? activeEnv;
  const handleDownloadReport = () => {
    const integrations = data.integrations.map((r) => ({
      name: r.name,
      typeLabel: INSIGHTS_KIND_LABEL[r.type],
      successCount: r.successCount,
      errorCount: r.errorCount,
      latency: r.latency,
      last: r.last,
      status: '',
    }));
    downloadProjectInsightsCsv(org, activeEnvName, range, { kpis: data.kpis, trend: data.trend, integrations });
  };

  // The integration route is project-scoped, but the org page has no project in
  // its own route — so a row's project is resolved from the component it came from.
  const projectByComponent = useMemo(() => {
    const handlerById = new Map((projects ?? []).map((p) => [p.id, p.handler]));
    return new Map(components.map((c) => [c.handler, handlerById.get(c.projectId)]));
  }, [components, projects]);

  if (noEnvironments) {
    return (
      <PageContent>
        <PageTitle>
          <PageTitle.Header>Usage Insights</PageTitle.Header>
        </PageTitle>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
          No insights environments are available for this organization yet.
        </Typography>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Usage Insights</PageTitle.Header>
      </PageTitle>

      <Stack direction="row" alignItems="center" justifyContent="flex-end" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
        <InsightsControls envOptions={envOptions} envId={activeEnv} onEnvChange={setEnvId} range={range} onRangeChange={setRange} onReport={handleDownloadReport} reportDisabled={!selectedEnv} />
      </Stack>

      <Box sx={{ mb: 2 }}>
        <ProjectKpiCards kpis={data.kpis} loading={loading} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '65fr 35fr' }, gap: 2, mb: 2 }}>
        <ActivityOverTime chart={data.activityChart} range={range} loading={loading} />
        <TopFailing rows={data.topFailing} errorSeries={data.trend.map((p) => ({ label: p.label, errors: p.errors }))} loading={loading} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '65fr 35fr' }, gap: 2, mb: 2 }}>
        <TopByVolume
          rows={data.topByVolume}
          loading={loading}
          onRowClick={(handler) => {
            const project = projectByComponent.get(handler);
            if (project) navigate(`/organizations/${org}/projects/${project}/components/${handler}/insights/usage`);
          }}
        />
        <LatencyDuration rows={data.latencyRows} loading={loading} />
      </Box>
    </PageContent>
  );
}
