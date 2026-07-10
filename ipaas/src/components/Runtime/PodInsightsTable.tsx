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

import { Alert, Box, Button, Chip, CircularProgress, IconButton, ListingTable, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { RefreshCw } from '@wso2/oxygen-ui-icons-react';
import { useMemo, type JSX } from 'react';
import { calculatePodUsage, formatBytes, formatVcpu, isPodReady, podRestartCount } from '../../utils/podMetrics';
import { formatDistanceToNow } from '../../utils/time';
import type { PaletteColor } from '../../config/statusColors';
import type { ClusterPod, PodMetrics } from '../../types/runtime';
import UsageBar from './UsageBar';

function phaseColor(phase: string): PaletteColor {
  switch (phase) {
    case 'Running':
      return 'success';
    case 'Pending':
      return 'info';
    case 'Failed':
      return 'error';
    case 'Succeeded':
      return 'default';
    default:
      return 'secondary';
  }
}

function lastActivity(pod: ClusterPod): string {
  const started = pod.status.startTime ?? pod.status.containerStatuses?.find((s) => s.state?.running?.startedAt)?.state?.running?.startedAt;
  return started ? formatDistanceToNow(started) : '—';
}

function PodMetricCell({ used, limit, display }: { used: number; limit: number; display: string }): JSX.Element {
  const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
  return (
    <Box sx={{ minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary">
        {display}
      </Typography>
      <UsageBar percent={percent} />
    </Box>
  );
}

interface PodInsightsTableProps {
  pods: ClusterPod[] | undefined;
  metrics: PodMetrics[] | undefined;
  replicas: number;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}

export default function PodInsightsTable({ pods, metrics, replicas, isLoading, isError, isFetching, onRefresh }: PodInsightsTableProps): JSX.Element {
  const rows = pods ?? [];
  const runningCount = useMemo(() => rows.filter(isPodReady).length, [rows]);

  return (
    <Box sx={{ mt: 6 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={2}>
          <Chip variant="outlined" label={`Replicas ${replicas}`} />
          <Typography variant="body2" color="text.secondary">
            {runningCount}/{rows.length} Running
          </Typography>
        </Stack>
        <Tooltip title="Refresh">
          <span>
            <IconButton size="small" aria-label="Refresh pods" onClick={onRefresh} disabled={isFetching}>
              <RefreshCw size={18} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {isLoading ? (
        <CircularProgress sx={{ display: 'block', mx: 'auto', py: 6 }} />
      ) : isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRefresh}>
              Retry
            </Button>
          }>
          Failed to load pods.
        </Alert>
      ) : (
        <ListingTable.Container elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
          <ListingTable size="small">
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Pod Details</ListingTable.Cell>
                <ListingTable.Cell>CPU Usage</ListingTable.Cell>
                <ListingTable.Cell>Memory Usage</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell>Available</ListingTable.Cell>
                <ListingTable.Cell>Restarts</ListingTable.Cell>
                <ListingTable.Cell>Last Activity</ListingTable.Cell>
                <ListingTable.Cell align="right">Actions</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {rows.length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    All pods are currently scaled down.
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                rows.map((pod) => {
                  const metric = metrics?.find((m) => m.metadata.name === pod.metadata.name);
                  const usage = calculatePodUsage(pod, metric);
                  const statuses = pod.status.containerStatuses ?? [];
                  const readyContainers = statuses.filter((s) => s.ready).length;
                  return (
                    <ListingTable.Row key={pod.metadata.uid}>
                      <ListingTable.Cell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {pod.metadata.name}
                        </Typography>
                      </ListingTable.Cell>
                      <ListingTable.Cell>
                        <PodMetricCell used={usage.cpu.used} limit={usage.cpu.limits} display={`${formatVcpu(usage.cpu.used)} / ${formatVcpu(usage.cpu.limits)} vCPU`} />
                      </ListingTable.Cell>
                      <ListingTable.Cell>
                        <PodMetricCell used={usage.memory.used} limit={usage.memory.limits} display={`${formatBytes(usage.memory.used)} / ${formatBytes(usage.memory.limits)}`} />
                      </ListingTable.Cell>
                      <ListingTable.Cell>
                        <Chip size="small" variant="outlined" color={phaseColor(pod.status.phase)} label={pod.status.phase} />
                      </ListingTable.Cell>
                      <ListingTable.Cell>
                        {readyContainers}/{statuses.length || pod.spec.containers.length}
                      </ListingTable.Cell>
                      <ListingTable.Cell>{podRestartCount(pod)}</ListingTable.Cell>
                      <ListingTable.Cell>{lastActivity(pod)}</ListingTable.Cell>
                      <ListingTable.Cell align="right">—</ListingTable.Cell>
                    </ListingTable.Row>
                  );
                })
              )}
            </ListingTable.Body>
          </ListingTable>
        </ListingTable.Container>
      )}
    </Box>
  );
}
