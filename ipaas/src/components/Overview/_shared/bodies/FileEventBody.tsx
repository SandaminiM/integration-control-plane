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

import { Box, CircularProgress, Divider, Stack, Typography } from '@wso2/oxygen-ui';
import { ScrollText } from '@wso2/oxygen-ui-icons-react';
import { useMemo, type ReactNode } from 'react';
import { useInfiniteComponentLogs } from '../../../../hooks/useLogs';
import { choreologgingComponentGatewayLogsApiUrl } from '../../../../config/runtimeConfig';
import { AUTO_FETCH_INTERVAL, DEFAULT_DP_REGION, LEVEL_COLORS, PAGE_SIZE } from '../../../../utils/logs';
import type { ComponentLogsRequest, LogRow } from '../../../../types/logs';
import type { EnvCardBodyProps } from '../../../../types/integration';
import EnvCardSkeleton from '../EnvCardSkeleton';

/**
 * Shared env-card body for the two runtime-logs integration types whose
 * meaningful per-env signal is the runtime log stream:
 *   - `file-integration`
 *   - `event-integration`
 *
 * Both also share the `_shared/FileEventHeader` chrome.
 *
 * Architecture notes:
 *   - Reuses the data layer (`useInfiniteComponentLogs` + `ComponentLogsRequest`)
 *     so the request/response wire shape stays consistent with the full
 *     Runtime Logs page and the ServiceLogsDrawer.
 *   - Does NOT reuse `LogsPanel` or `useLogsFilters` — the inline view has
 *     no filter UI, no infinite scroll, no expand/collapse, no retry/clear
 *     buttons. The custom `InlineLogsView` below renders a compact log
 *     stream sized for the env-card slot.
 *   - Time window is locked at mount: past 24h to mount + 1y. The forward
 *     buffer keeps the cache key stable (no per-render churn) while letting
 *     auto-fetch surface newly-arrived logs within the window.
 *   - Content-only: the Card frame and the header live in the shared
 *     `EnvCardShell` and `_shared/FileEventHeader`. This body renders just the
 *     log stream.
 */
export default function FileEventBody({ component, env, versionId }: EnvCardBodyProps): ReactNode {
  const logsApiUrl = choreologgingComponentGatewayLogsApiUrl();

  // Lock the time window at mount. Forward buffer lets auto-fetch pick up
  // new logs that arrive after the card is rendered; backward bound gives
  // a sensible default history depth without exposing filter controls.
  const window = useMemo(() => {
    const now = Date.now();
    return {
      startTime: new Date(now - 24 * 3600_000).toISOString(),
      endTime: new Date(now + 365 * 24 * 3600_000).toISOString(),
    };
  }, []);

  const logsRequest = useMemo<ComponentLogsRequest | null>(() => {
    if (!component.id || !env.id) return null;
    return {
      componentId: component.id,
      environmentId: env.id,
      versionIdList: versionId ? [versionId] : [],
      logLevels: [],
      startTime: window.startTime,
      endTime: window.endTime,
      limit: PAGE_SIZE,
      sort: 'desc',
      region: DEFAULT_DP_REGION,
      searchPhrase: '',
      regexPhrase: '',
      logType: 'singleLine',
    };
  }, [component.id, env.id, versionId, window.startTime, window.endTime]);

  const { data, isLoading, error } = useInfiniteComponentLogs(logsRequest, AUTO_FETCH_INTERVAL, logsApiUrl);

  const logs = useMemo<LogRow[]>(() => data?.pages[0] ?? [], [data]);

  if (isLoading && logs.length === 0) return <EnvCardSkeleton />;

  return (
    <>
      <Divider sx={{ my: 2 }} />
      <InlineLogsView isLoading={isLoading} error={error} logs={logs} />
    </>
  );
}

// ── Inline display (intentionally minimal — no filters / no infinite scroll) ──

// Maximum height of the logs scroll container. The container is `flex` so it
// collapses to its content when sparse and grows up to this cap when full.
const LOGS_MAX_HEIGHT = 300;

function InlineLogsView({ isLoading, error, logs }: { isLoading: boolean; error: unknown; logs: LogRow[] }): ReactNode {
  if (isLoading && logs.length === 0) {
    return (
      <Stack direction="row" alignItems="center" sx={{ py: 1 }}>
        <CircularProgress size={18} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack direction="column" alignItems="center" justifyContent="center" gap={1} sx={{ py: 1.5 }}>
        <ScrollText size={24} style={{ opacity: 0.4 }} />
        <Typography variant="body2" color="text.secondary">
          Failed to fetch integration data. Click 'refresh' to try again.
        </Typography>
      </Stack>
    );
  }

  if (logs.length === 0) {
    return (
      <Stack direction="column" alignItems="center" justifyContent="center" gap={1} sx={{ py: 1.5 }}>
        <ScrollText size={24} style={{ opacity: 0.4 }} />
        <Typography variant="body2" color="text.secondary">
          No integration data available. Click 'refresh' to get the latest integration data.
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: LOGS_MAX_HEIGHT,
        overflow: 'auto',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 0.5,
      }}>
      {logs.map((log, idx) => (
        <InlineLogRow key={`${log.timestamp}-${idx}`} log={log} />
      ))}
    </Box>
  );
}

function InlineLogRow({ log }: { log: LogRow }): ReactNode {
  const levelColor = LEVEL_COLORS[log.level]?.text ?? 'text.primary';
  return (
    <Stack
      direction="row"
      gap={1.5}
      sx={{
        px: 1.5,
        py: 0.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}>
      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', flexShrink: 0 }}>
        {formatTime(log.timestamp)}
      </Typography>
      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: levelColor, fontWeight: 600, minWidth: 48, flexShrink: 0 }}>
        {log.level}
      </Typography>
      <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-word', flex: 1 }}>
        {log.logLine}
      </Typography>
    </Stack>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleTimeString();
}
