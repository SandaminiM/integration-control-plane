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

import {
  Button,
  CircularProgress,
  MenuItem,
  PageContent,
  Select,
  Stack,
  Typography,
} from '@wso2/oxygen-ui';
import { RefreshCw, ScrollText } from '@wso2/oxygen-ui-icons-react';
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { useOrgs, useProjectsByOrg, useComponents, useEnvironments, useAllEnvironments, useCloudDataPlanes } from '../api/queries';
import { useInfiniteLogs, type LogsRequest } from '../api/logs';
import { choreologgingProjectLogsApiUrl } from '../config/api';
import { DEFAULT_HOURS, AUTO_FETCH_INTERVAL, PAGE_SIZE, TIME_PRESETS, toLocalInput } from './logs/utils';
import LogEntry from './logs/LogEntry';
import LogsFilters from './logs/LogsFilters';
import LogsPageLayout from './logs/LogsPageLayout';
import EmptyListing from '../components/EmptyListing';
import type { ProjectScope } from '../nav';

export default function RuntimeLogsProject(scope: ProjectScope): JSX.Element {
  const { data: orgs, isLoading: loadingOrgs } = useOrgs();
  const { data: projects, isLoading: loadingProjects } = useProjectsByOrg(scope.org);
  
  const loadingProject = loadingOrgs || loadingProjects;
  const project = projects?.find((p) => p.id === scope.project || p.handler === scope.project);
  const projectId = project?.id ?? '';

  const orgUuid = orgs?.find((o) => o.handle === scope.org)?.uuid ?? '';

  const { data: allComponents = [], isLoading: loadingComponents } = useComponents(scope.org, projectId);
  const { data: projectEnvs = [], isLoading: loadingProjectEnvs } = useEnvironments(orgUuid, projectId);
  const { data: globalEnvs = [], isLoading: loadingGlobalEnvs } = useAllEnvironments();
  // Prefer project-scoped environments (needs UUID); fall back to global when UUID unavailable
  const environments = orgUuid ? projectEnvs : globalEnvs;
  const loadingEnvironments = orgUuid ? loadingProjectEnvs : loadingGlobalEnvs;

  const { data: cdps, isLoading: loadingCdps } = useCloudDataPlanes(orgUuid);

  const [integrationFilter, setIntegrationFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [timePreset, setTimePreset] = useState<string>('Past 24 hours');
  const [customStart, setCustomStart] = useState(() => toLocalInput(new Date(Date.now() - 24 * 3600_000)));
  const [customEnd, setCustomEnd] = useState(() => toLocalInput(new Date()));
  const [searchPhrase, setSearchPhrase] = useState('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [autoFetch, setAutoFetch] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const componentIds =
    integrationFilter !== 'all' ? [integrationFilter] : allComponents.map((c) => c.id);
  const selectedEnvIds = envFilter.length > 0 ? envFilter : environments.map((e) => e.id);
  const primaryEnv = environments.find((e) => selectedEnvIds.includes(e.id));

  const componentIdsKey = componentIds.join(',');
  const envIdsKey = selectedEnvIds.join(',');
  const levelFilterKey = levelFilter.join(',');

  const logsApiUrl = useMemo(() => {
    if (!primaryEnv?.dpId || !cdps) return undefined;
    const cdp = cdps.find((c) => c.id.toLowerCase() === primaryEnv.dpId!.toLowerCase());
    return cdp ? choreologgingProjectLogsApiUrl(cdp.external_gateway_virtual_host) : undefined;
  }, [primaryEnv?.dpId, cdps]);

  const logsRequest = useMemo<LogsRequest | null>(() => {
    if (componentIds.length === 0 || !primaryEnv || !logsApiUrl) return null;
    let startTime: string;
    let endTime: string;
    if (timePreset === 'custom') {
      startTime = new Date(customStart).toISOString();
      endTime = new Date(customEnd).toISOString();
    } else {
      const preset = TIME_PRESETS.find((p) => p.label === timePreset);
      const hours = preset?.hours ?? DEFAULT_HOURS;
      const now = new Date();
      startTime = new Date(now.getTime() - hours * 3600_000).toISOString();
      endTime = now.toISOString();
    }
    return {
      projectId,
      componentIdList: componentIds,
      environmentId: primaryEnv.id,
      environmentList: primaryEnv.name,
      logLevels: levelFilter,
      startTime,
      endTime,
      limit: PAGE_SIZE,
      sort: sortDir,
      region: 'US',
      searchPhrase,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps    
  }, [componentIdsKey, envIdsKey, levelFilterKey, timePreset, customStart, customEnd, searchPhrase, sortDir, projectId, logsApiUrl]);

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteLogs(
    logsRequest,
    autoFetch ? AUTO_FETCH_INTERVAL : false,
    logsApiUrl,
  );

  const logs = useMemo(() => data?.pages.flat() ?? [], [data]);

  const toggle = (i: number) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 200) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (loadingProject || loadingComponents || loadingEnvironments || loadingCdps) {
    return (
      <PageContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </PageContent>
    );
  }

  if (allComponents.length === 0) {
    return (
      <PageContent>
        <EmptyListing
          icon={<ScrollText size={48} />}
          title="No integrations found"
          description="Add an integration to this project before viewing runtime logs."
        />
      </PageContent>
    );
  }

  if (environments.length === 0) {
    return (
      <PageContent>
        <EmptyListing
          icon={<ScrollText size={48} />}
          title="No environments available"
          description="No deployment environments were found for this project. Deploy your integration first."
        />
      </PageContent>
    );
  }

  const logPanel = isLoading ? (
    <CircularProgress size={28} sx={{ display: 'block', mx: 'auto', my: 6 }} />
  ) : error ? (
    <Stack alignItems="center" gap={2} sx={{ py: 6 }}>
      <Typography color="error" textAlign="center">
        Failed to fetch logs: {(error as Error).message ?? 'Service unavailable'}
      </Typography>
      <Button variant="contained" startIcon={<RefreshCw size={16} />} onClick={() => refetch()}>
        Retry
      </Button>
    </Stack>
  ) : logs.length === 0 ? (
    <Stack alignItems="center" gap={2} sx={{ py: 8 }}>
      <ScrollText size={48} style={{ opacity: 0.3 }} />
      <Typography variant="h3" textAlign="center">
        No logs found
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 420 }}>
        No log entries matched your current filters for the selected time range. Try widening
        the time range, clearing some filters, or refreshing.
      </Typography>
      <Stack direction="row" gap={1}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshCw size={14} />}
          onClick={() => refetch()}
          disabled={!logsRequest}>
          Refresh
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={() => {
            setLevelFilter([]);
            setEnvFilter([]);
            setSearchPhrase('');
            setTimePreset('Past 24 hours');
          }}>
          Clear filters
        </Button>
      </Stack>
    </Stack>
  ) : (
    <Stack
      ref={scrollContainerRef}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 300px)',
        padding: '16px',
      }}>
      {logs.map((log, i) => (
        <LogEntry key={i} log={log} expanded={expanded.has(i)} onToggle={() => toggle(i)} />
      ))}
      <div ref={sentinelRef} />
      {isFetchingNextPage && <CircularProgress size={20} sx={{ display: 'block', mx: 'auto', my: 1 }} />}
      {!hasNextPage && logs.length > 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 1 }}>
          End of logs
        </Typography>
      )}
    </Stack>
  );

  const integrationSelect = (
    <Select
      value={integrationFilter}
      onChange={(e) => setIntegrationFilter(e.target.value as string)}
      size="small"
      sx={{ minWidth: 200 }}
      inputProps={{ 'aria-label': 'Integration' }}>
      <MenuItem value="all">All Integrations</MenuItem>
      {allComponents.map((c) => (
        <MenuItem key={c.id} value={c.id}>
          {c.displayName || c.name}
        </MenuItem>
      ))}
    </Select>
  );

  const filtersElement = (
    <LogsFilters
      environments={environments}
      envFilter={envFilter}
      onEnvFilterChange={setEnvFilter}
      levelFilter={levelFilter}
      onLevelFilterChange={setLevelFilter}
      timePreset={timePreset}
      onTimePresetChange={setTimePreset}
      customStart={customStart}
      onCustomStartChange={setCustomStart}
      customEnd={customEnd}
      onCustomEndChange={setCustomEnd}
      sortDir={sortDir}
      onSortDirChange={setSortDir}
      searchPhrase={searchPhrase}
      onSearchPhraseChange={setSearchPhrase}
      autoFetch={autoFetch}
      onAutoFetchChange={setAutoFetch}
      logs={logs}
      logsRequest={logsRequest}
      onRefetch={refetch}
    />
  );

  return (
    <LogsPageLayout
      title="Runtime Logs"
      headerAction={integrationSelect}
      filtersElement={filtersElement}
      logPanelElement={logPanel}
    />
  );
}
