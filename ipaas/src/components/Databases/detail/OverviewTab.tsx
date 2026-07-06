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

import { Box, Button, Chip, CircularProgress, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Archive, Cloud, Copy, Cpu, Download, Eye, EyeOff, HardDrive, MemoryStick, Power, RefreshCw, Server } from '@wso2/oxygen-ui-icons-react';
import { useState, type JSX, type ReactNode } from 'react';
import { useFetchServerCaCertificate, useServerAdminUser, useSetServerPoweredState } from '../../../hooks/usePlatformServices';
import { providerLabel, regionLabel, STATUS_COLORS, statusLabel } from '../../../constants/platformServices';
import type { DatabaseServerDetail } from '../../../types/platformServices';

const TRANSITIONAL = ['CREATING', 'RESUMING', 'DELETING'];

function Row({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={{ xs: 0.5, sm: 2 }} sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 150, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>{children}</Box>
    </Stack>
  );
}

function CopyField({ value, 'aria-label': ariaLabel }: { value: string; 'aria-label': string }): JSX.Element {
  return (
    <TextField
      size="small"
      fullWidth
      value={value}
      InputProps={{
        readOnly: true,
        sx: { bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: 13 },
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip title="Copy">
              <IconButton size="small" aria-label={`Copy ${ariaLabel}`} onClick={() => navigator.clipboard?.writeText(value)} edge="end">
                <Copy size={15} />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ),
      }}
    />
  );
}

function PlanStat({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }): JSX.Element {
  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={0.75} sx={{ color: 'text.secondary', mb: 0.5 }}>
        {icon}
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}

export default function OverviewTab({ service, serverId, onRefresh, isRefreshing }: { service: DatabaseServerDetail; serverId: string; onRefresh: () => void; isRefreshing: boolean }): JSX.Element {
  const cp = service.connection_params;
  const plan = service.service_plan;
  const showDefaultDb = service.type === 'postgres' || service.type === 'mysql';
  const isActive = service.status === 'ACTIVE';
  const transitioning = TRANSITIONAL.includes(service.status);

  const power = useSetServerPoweredState(serverId);
  const [reveal, setReveal] = useState(false);
  const admin = useServerAdminUser(serverId, reveal);
  const fetchCa = useFetchServerCaCertificate(serverId);
  const [caError, setCaError] = useState(false);

  const nodeCount = plan.node_count;
  const nodeDesc = nodeCount > 1 ? `${nodeCount}x node high-availability set` : '1x node (not highly available)';

  const downloadCa = () => {
    setCaError(false);
    fetchCa()
      .then((c) => {
        const blob = new Blob([c.certificate], { type: 'application/x-pem-file' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${service.name}-ca.pem`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => setCaError(true));
  };

  return (
    <Box sx={{ maxWidth: 900 }}>
      {/* Connection details card */}
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1} sx={{ px: 3, py: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 150 }}>
              Status
            </Typography>
            <Chip label={statusLabel(service.status)} color={STATUS_COLORS[service.status]} size="small" variant="outlined" />
          </Stack>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <Tooltip title="Refresh">
              <IconButton size="small" aria-label="Refresh" onClick={onRefresh} disabled={isRefreshing}>
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
            <Button variant="outlined" size="small" startIcon={power.isPending ? <CircularProgress size={14} color="inherit" /> : <Power size={16} />} disabled={transitioning || power.isPending} onClick={() => power.mutate(!isActive)}>
              {isActive ? 'Power Off Service' : 'Power On Service'}
            </Button>
          </Stack>
        </Stack>

        <Row label="Host:">
          <CopyField value={cp.host} aria-label="host" />
        </Row>
        <Row label="Port:">
          <CopyField value={cp.port} aria-label="port" />
        </Row>
        <Row label="Default User:">
          <CopyField value={cp.user} aria-label="default user" />
        </Row>
        {showDefaultDb && (
          <Row label="Default Database:">
            <CopyField value={cp.database} aria-label="default database" />
          </Row>
        )}
        <Row label="Password:">
          {reveal ? (
            admin.isLoading ? (
              <CircularProgress size={18} />
            ) : admin.data ? (
              <Stack direction="row" alignItems="center" gap={1}>
                <TextField
                  size="small"
                  fullWidth
                  value={admin.data.password}
                  InputProps={{
                    readOnly: true,
                    sx: { bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: 13 },
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Copy">
                          <IconButton size="small" aria-label="Copy password" onClick={() => navigator.clipboard?.writeText(admin.data!.password)} edge="end">
                            <Copy size={15} />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" aria-label="Hide password" onClick={() => setReveal(false)} edge="end">
                          <EyeOff size={15} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
            ) : (
              <Typography variant="body2" color="error">
                Couldn&apos;t load the password.
              </Typography>
            )
          ) : (
            <Button variant="outlined" size="small" startIcon={<Eye size={16} />} onClick={() => setReveal(true)}>
              View Password
            </Button>
          )}
        </Row>
        <Row label="CA Certificate:">
          <Stack gap={0.5}>
            <Box>
              <Button variant="outlined" size="small" startIcon={<Download size={16} />} onClick={downloadCa}>
                Download CA Certificate
              </Button>
            </Box>
            {caError && (
              <Typography variant="caption" color="error">
                Couldn&apos;t download the certificate. Please try again.
              </Typography>
            )}
          </Stack>
        </Row>
      </Box>

      {/* Current service plan */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 4, mb: 1.5 }}>
        Current Service Plan
      </Typography>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 3 }}>
        <Stack direction="row" flexWrap="wrap" gap={5} alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {plan.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ${plan.hourly_price_usd}/hour
            </Typography>
          </Box>
          <PlanStat icon={<Cloud size={15} />} label="Cloud Provider">
            {providerLabel(service.cloud_provider)} • {regionLabel(service.cloud_region)}
          </PlanStat>
          <PlanStat icon={<Server size={15} />} label="Nodes">
            {nodeDesc}
          </PlanStat>
          <PlanStat icon={<Cpu size={15} />} label="CPU">
            {plan.node_cpu_count}
          </PlanStat>
          <PlanStat icon={<MemoryStick size={15} />} label="Memory">
            {plan.node_ram_gb} GB
          </PlanStat>
          {service.type !== 'redis' && (
            <PlanStat icon={<HardDrive size={15} />} label="Storage">
              {plan.storage_gb} GB
            </PlanStat>
          )}
          <PlanStat icon={<Archive size={15} />} label="Backups">
            {plan.backup_retention_days > 0 ? `Every ${plan.backup_interval_hours}h, kept ${plan.backup_retention_days}d` : 'No automatic backups'}
          </PlanStat>
        </Stack>
      </Box>
    </Box>
  );
}
