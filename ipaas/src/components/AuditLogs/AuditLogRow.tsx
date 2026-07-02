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

import { Chip, IconButton, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { ChevronDown, ChevronRight, Copy } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import { formatAuditTimestamp, outcomeColor } from '../../utils/auditLogs';
import type { AuditLogEntry } from '../../types/auditLogs';

/** One audit event, styled like a log line: monospace summary row that expands to full detail. */
export default function AuditLogRow({ entry, expanded, onToggle }: { entry: AuditLogEntry; expanded: boolean; onToggle: () => void }): JSX.Element {
  const infoEntries = Object.entries(entry.info ?? {});
  const actor = entry.info?.email ?? entry.userIdpId;
  const summary = entry.action ?? entry.message ?? '—';

  const detailRows: [string, string][] = [];
  if (entry.entityType) detailRows.push(['entityType', entry.entityType]);
  if (entry.message && entry.message !== summary) detailRows.push(['message', entry.message]);
  infoEntries.forEach(([k, v]) => detailRows.push([k, String(v)]));

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        onClick={onToggle}
        sx={{ fontFamily: 'monospace', fontSize: 12, px: 0.5, py: 0.25, cursor: 'pointer', borderRadius: 1, minHeight: 32, '&:hover': { bgcolor: 'action.hover' }, '&:hover .audit-actions': { visibility: 'visible' } }}>
        <IconButton size="small" aria-label={expanded ? 'Collapse audit entry' : 'Expand audit entry'} sx={{ p: 0, mr: 0.5 }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </IconButton>
        <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap', mr: 1 }}>
          {formatAuditTimestamp(entry)}
        </Typography>
        {entry.outcome ? <Chip label={entry.outcome} size="small" variant="outlined" color={outcomeColor(entry.outcome)} sx={{ fontFamily: 'monospace', fontSize: 10, height: 18, mr: 1, textTransform: 'capitalize', fontWeight: 700 }} /> : null}
        {actor ? (
          <Tooltip title="Performed by">
            <Chip label={actor} size="small" sx={{ fontFamily: 'monospace', fontSize: 10, height: 18, mr: 1, bgcolor: 'action.selected', color: 'text.secondary', fontWeight: 600 }} />
          </Tooltip>
        ) : null}
        <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
          {summary}
        </Typography>
        <Stack direction="row" className="audit-actions" sx={{ visibility: 'hidden', ml: 1, flexShrink: 0 }}>
          <Tooltip title="Copy">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                void navigator.clipboard?.writeText(JSON.stringify(entry, null, 2));
              }}>
              <Copy size={14} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      {expanded && detailRows.length > 0 && (
        <Stack sx={{ pl: 5, pb: 1, fontFamily: 'monospace', fontSize: 12, bgcolor: 'background.default', borderRadius: 1, mx: 0.5, mb: 0.5 }}>
          {detailRows.map(([key, value]) => (
            <Stack key={key} direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 0.5, gap: 2 }}>
              <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, minWidth: 160, flexShrink: 0 }}>
                {key}
              </Typography>
              <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </>
  );
}
