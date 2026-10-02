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

import { Box, IconButton, Tooltip, Typography } from '@wso2/oxygen-ui';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronsDownUp, ChevronsUpDown } from '@wso2/oxygen-ui-icons-react';
import { useMemo, useState, type JSX } from 'react';
import type { LogRow } from '../../types/logs';
import { retentionBoundaryIndex, retentionNote as endOfRetentionNote } from '../../utils/logsView';
import LogEntry from './LogEntry';
import LogsPanel from './LogsPanel';
import LogsStatus from './LogsStatus';
import { dividerLineSx, dividerSx, headerActionsSx, headerSx, viewerSx } from './LogsViewer.styles';

export interface LogsViewerProps {
  rows: LogRow[];
  live: boolean;
  failure?: string;
  pausedNote?: string;
  onBackToLive?: () => void;
  /** The line at the top right, e.g. "128 lines · 5 endpoints · 2 environments". */
  summary: string;
  sortDir: 'asc' | 'desc';
  onSortChange: (sort: 'asc' | 'desc') => void;
  isLoading: boolean;
  error: unknown;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onRefetch: () => void;
  onFetchNextPage?: () => void;
  onClearFilters?: () => void;
  /** Rows older than this (epoch ms) lost their gateway lines; a divider marks where that starts. */
  retentionHorizon?: number | null;
  /** The divider's wording; when no loaded row crosses the horizon the list's end says it instead. */
  retentionNote?: string;
  envNameOf?: (row: LogRow) => string | undefined;
  endpointNameOf?: (row: LogRow) => string | undefined;
}

/** The logs card: live status and view controls above an expandable, auto-paging list of log rows. */
export default function LogsViewer({
  rows,
  live,
  failure,
  pausedNote,
  onBackToLive,
  summary,
  sortDir,
  onSortChange,
  isLoading,
  error,
  hasNextPage,
  isFetchingNextPage,
  onRefetch,
  onFetchNextPage,
  onClearFilters,
  retentionHorizon,
  retentionNote = endOfRetentionNote('desc', false),
  envNameOf,
  endpointNameOf,
}: LogsViewerProps): JSX.Element {
  const [expandAll, setExpandAll] = useState(false);
  const boundary = useMemo(() => (retentionHorizon != null ? retentionBoundaryIndex(rows, sortDir, retentionHorizon) : -1), [rows, sortDir, retentionHorizon]);
  const newestFirst = sortDir === 'desc';

  return (
    <Box sx={viewerSx}>
      <Box sx={headerSx}>
        <LogsStatus live={live} failure={failure} pausedNote={pausedNote} onBackToLive={onBackToLive} />
        <Box sx={headerActionsSx}>
          <Typography variant="body2" color="text.secondary">
            {summary}
          </Typography>
          <Tooltip title={newestFirst ? 'Newest first. Click to show oldest first.' : 'Oldest first. Click to show newest first.'}>
            <IconButton size="small" aria-label={newestFirst ? 'Sorted newest first' : 'Sorted oldest first'} onClick={() => onSortChange(newestFirst ? 'asc' : 'desc')}>
              {newestFirst ? <ArrowDownWideNarrow size={17} /> : <ArrowUpNarrowWide size={17} />}
            </IconButton>
          </Tooltip>
          <Tooltip title={expandAll ? 'Compact view: show one line per log' : 'Expanded view: open every log line'}>
            <IconButton size="small" aria-label={expandAll ? 'Compact view' : 'Expand all lines'} aria-pressed={expandAll} onClick={() => setExpandAll((v) => !v)}>
              {expandAll ? <ChevronsDownUp size={17} /> : <ChevronsUpDown size={17} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <LogsPanel
        embedded
        items={rows}
        getKey={(l, i) => `${i}-${l.timestamp}-${l.logLine.slice(0, 50)}`}
        renderRow={(l, ex, tg) => <LogEntry log={l} expanded={ex} onToggle={tg} envName={envNameOf?.(l)} endpointName={endpointNameOf?.(l)} />}
        renderBefore={(_, index) =>
          index === boundary ? (
            <Box sx={dividerSx}>
              <Box component="span" sx={dividerLineSx} />
              <Typography component="span" variant="body2" color="text.secondary">
                {retentionNote}
              </Typography>
              <Box component="span" sx={dividerLineSx} />
            </Box>
          ) : null
        }
        expandAll={expandAll}
        endLabel={retentionHorizon != null && boundary === -1 ? endOfRetentionNote('desc', false) : undefined}
        isLoading={isLoading}
        error={error}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onRefetch={onRefetch}
        onFetchNextPage={onFetchNextPage}
        onClearFilters={onClearFilters}
      />
    </Box>
  );
}
