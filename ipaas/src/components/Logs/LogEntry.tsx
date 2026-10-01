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

import { Box, ButtonBase, IconButton, Tooltip, Typography } from '@wso2/oxygen-ui';
import { ChevronRight, Copy } from '@wso2/oxygen-ui-icons-react';
import { Fragment, type JSX } from 'react';
import type { LogRow } from '../../types/logs';
import { summarizeGatewayLine } from '../../utils/gatewayLogs';
import { copyLog } from '../../utils/logs';
import { formatLogTimestamp, logDetailFields } from '../../utils/logsView';
import { chevronSx, copyButtonSx, detailLabelSx, detailValueSx, detailsSx, durationSx, levelSx, lineSx, messageSx, metaSx, rawLineSx, rowSx, sourceBadgeSx, statusSx, tagSx, timeSx, toggleSx } from './LogEntry.styles';

export interface LogEntryProps {
  log: LogRow;
  expanded: boolean;
  onToggle: () => void;
  envName?: string;
  endpointName?: string;
}

export default function LogEntry({ log, expanded, onToggle, envName, endpointName }: LogEntryProps): JSX.Element {
  const request = log.source === 'gateway' ? log.request : null;
  const message = request ? `${request.method ?? ''} ${request.path ?? ''}`.trim() : log.source === 'gateway' ? summarizeGatewayLine(log.logLine) : log.logLine;
  const level = log.level?.toUpperCase() ?? '';

  return (
    <Box sx={rowSx(level === 'ERROR', expanded)}>
      <Box sx={lineSx}>
        <ButtonBase onClick={onToggle} aria-expanded={expanded} sx={toggleSx}>
          <Box component="span" sx={chevronSx(expanded)}>
            <ChevronRight size={13} />
          </Box>
          <Box component="span" sx={timeSx}>
            {formatLogTimestamp(log.timestamp)}
          </Box>
          {level ? (
            <Box component="span" sx={levelSx(level)}>
              {level}
            </Box>
          ) : null}
          {log.source ? (
            <Box component="span" sx={sourceBadgeSx(log.source)}>
              {log.source === 'gateway' ? 'GATEWAY' : 'APP'}
            </Box>
          ) : null}
          {envName ? (
            <Box component="span" sx={metaSx}>
              {envName}
            </Box>
          ) : null}
          {endpointName ? (
            <Box component="span" sx={tagSx}>
              {endpointName}
            </Box>
          ) : null}
          {request?.status != null ? (
            <Box component="span" sx={statusSx(request.status)}>
              {request.status}
            </Box>
          ) : null}
          <Box component="span" sx={messageSx}>
            {message}
          </Box>
          {request?.durationMs != null ? (
            <Box component="span" sx={durationSx}>
              {request.durationMs}ms
            </Box>
          ) : null}
        </ButtonBase>
        <Tooltip title="Copy line">
          <IconButton className="log-copy" size="small" aria-label="Copy log line" onClick={() => copyLog(log)} sx={copyButtonSx}>
            <Copy size={14} />
          </IconButton>
        </Tooltip>
      </Box>
      {expanded ? (
        <Box component="dl" sx={detailsSx}>
          {logDetailFields(log, { envName, endpointName }).map((field) => (
            <Fragment key={field.label}>
              <Typography component="dt" sx={detailLabelSx}>
                {field.label}
              </Typography>
              <Typography component="dd" sx={detailValueSx}>
                {field.value}
              </Typography>
            </Fragment>
          ))}
          <Typography component="dt" sx={detailLabelSx}>
            Raw line
          </Typography>
          <Box component="dd" sx={rawLineSx}>
            {log.logLine}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
