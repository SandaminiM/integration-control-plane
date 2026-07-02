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

import { Box, Chip, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Database, Trash2 } from '@wso2/oxygen-ui-icons-react';
import { useState, type JSX } from 'react';
import { isServerAccessible, providerLabel, regionLabel, serviceTypeLabel, statusLabel, STATUS_COLORS } from '../../constants/platformServices';
import type { DatabaseServer } from '../../types/platformServices';
import DeleteServerDialog from './DeleteServerDialog';

interface DatabaseServersTableProps {
  servers: DatabaseServer[];
  isSubscribed: boolean;
  onOpenServer: (server: DatabaseServer) => void;
  onDeleted: (name: string) => void;
  onError: (message: string) => void;
}

const headSx = { fontWeight: 600 };

export default function DatabaseServersTable({ servers, isSubscribed, onOpenServer, onDeleted, onError }: DatabaseServersTableProps): JSX.Element {
  const [toDelete, setToDelete] = useState<DatabaseServer | null>(null);

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headSx}>Name</TableCell>
            <TableCell sx={headSx}>Status</TableCell>
            <TableCell sx={headSx}>Cloud/Region</TableCell>
            <TableCell sx={headSx}>Service Plan</TableCell>
            <TableCell sx={headSx}>Created</TableCell>
            <TableCell sx={headSx} align="right" aria-label="actions" />
          </TableRow>
        </TableHead>
        <TableBody>
          {servers.map((server) => {
            const accessible = isServerAccessible(server.status);
            const plan = server.service_plan;
            return (
              <TableRow key={server.id} hover sx={{ cursor: accessible ? 'pointer' : 'default' }} onClick={accessible ? () => onOpenServer(server) : undefined}>
                <TableCell>
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <Database size={20} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {server.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {serviceTypeLabel(server.type)}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={statusLabel(server.status)} color={STATUS_COLORS[server.status]} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{providerLabel(server.cloud_provider)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {regionLabel(server.cloud_region)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" gap={0.5} flexWrap="wrap">
                    <Chip label={plan.name} color="primary" size="small" variant="outlined" />
                    <Chip label={`Nodes: ${plan.node_count}`} size="small" variant="outlined" />
                    <Chip label={`CPU: ${plan.node_cpu_count}`} size="small" variant="outlined" />
                    <Chip label={`RAM: ${plan.node_ram_gb} GB`} size="small" variant="outlined" />
                    {server.type !== 'redis' && <Chip label={`Storage: ${plan.storage_gb} GB`} size="small" variant="outlined" />}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(server.created_at).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      aria-label={`Delete ${server.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setToDelete(server);
                      }}>
                      <Trash2 size={16} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {toDelete && <DeleteServerDialog server={toDelete} isSubscribed={isSubscribed} onClose={() => setToDelete(null)} onDeleted={onDeleted} onError={onError} />}
    </>
  );
}
