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

import { Box, Button, Checkbox, FormControlLabel, Popover, Stack, Switch, Typography } from '@wso2/oxygen-ui';
import type { JSX } from 'react';
import type { LogsFiltersState } from '../../hooks/useLogsFilters';
import type { GatewayLogEndpoint } from '../../types/logs';
import { LOG_LEVELS } from '../../utils/logs';
import { menuFooterSx, menuSectionTitleSx, menuSx, optionGridSx } from './LogsToolbar.styles';

export interface LogsFilterMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  filters: LogsFiltersState;
  environments: { id: string; name: string }[];
  endpoints: Pick<GatewayLogEndpoint, 'id' | 'displayName'>[];
  gatewayControls: boolean;
}

const toggleIn = (list: string[], value: string): string[] => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

export default function LogsFilterMenu({ anchorEl, onClose, filters, environments, endpoints, gatewayControls }: LogsFilterMenuProps): JSX.Element {
  const { levelFilter, setLevelFilter, envFilter, setEnvFilter, endpointFilter, setEndpointFilter, hideHealthChecks, setHideHealthChecks, autoFetch, setAutoFetch, clearFilters } = filters;

  return (
    <Popover open={!!anchorEl} anchorEl={anchorEl} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: menuSx } }}>
      <Stack gap={0.5}>
        <Typography sx={menuSectionTitleSx}>Level</Typography>
        <Box sx={optionGridSx}>
          {LOG_LEVELS.map((level) => (
            <FormControlLabel key={level} control={<Checkbox size="small" checked={levelFilter.includes(level)} onChange={() => setLevelFilter(toggleIn(levelFilter, level))} />} label={level} />
          ))}
        </Box>
      </Stack>

      {environments.length > 1 ? (
        <Stack gap={0.5}>
          <Typography sx={menuSectionTitleSx}>Environment</Typography>
          <Box sx={optionGridSx}>
            {environments.map((env) => (
              <FormControlLabel key={env.id} control={<Checkbox size="small" checked={envFilter.includes(env.id)} onChange={() => setEnvFilter(toggleIn(envFilter, env.id))} />} label={env.name} />
            ))}
          </Box>
        </Stack>
      ) : null}

      {endpoints.length > 1 ? (
        <Stack gap={0.5}>
          <Typography sx={menuSectionTitleSx}>Endpoint</Typography>
          <Stack>
            {endpoints.map((ep) => (
              <FormControlLabel key={ep.id} control={<Checkbox size="small" checked={endpointFilter.includes(ep.id)} onChange={() => setEndpointFilter(toggleIn(endpointFilter, ep.id))} />} label={ep.displayName} />
            ))}
          </Stack>
        </Stack>
      ) : null}

      <Stack gap={0.5}>
        <Typography sx={menuSectionTitleSx}>Options</Typography>
        {gatewayControls ? <FormControlLabel control={<Switch size="small" checked={hideHealthChecks} onChange={(e) => setHideHealthChecks(e.target.checked)} />} label="Hide gateway health checks" /> : null}
        <FormControlLabel control={<Switch size="small" checked={autoFetch} onChange={(e) => setAutoFetch(e.target.checked)} />} label="Auto refresh" />
      </Stack>

      <Box sx={menuFooterSx}>
        <Button size="small" onClick={clearFilters}>
          Clear all
        </Button>
        <Button size="small" variant="contained" onClick={onClose}>
          Done
        </Button>
      </Box>
    </Popover>
  );
}
