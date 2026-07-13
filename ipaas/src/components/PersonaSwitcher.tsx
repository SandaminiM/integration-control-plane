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

import { Box, MenuItem, Select, Stack, Typography } from '@wso2/oxygen-ui';
import { UserCog, UsersRound } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import { orgHomeUrl } from '../paths';
import { peOverviewPath } from '../config/platformEngineerNav';

export type Persona = 'developer' | 'platform-engineer';

interface PersonaOption {
  value: Persona;
  label: string;
  description: string;
}

const OPTIONS: PersonaOption[] = [
  { value: 'developer', label: 'Developer (Default)', description: 'For Developers and Architects' },
  { value: 'platform-engineer', label: 'Platform Engineer', description: 'For SRE and Platform Engineers' },
];

function PersonaIcon({ value, size = 16 }: { value: Persona; size?: number }): JSX.Element {
  return value === 'platform-engineer' ? <UserCog size={size} /> : <UsersRound size={size} />;
}

/**
 * Top-navbar perspective switcher. Toggles between the Developer (default) view
 * and the Platform Engineer view by navigating to that perspective's landing
 * route — the active persona is derived from the URL, so no extra state store is
 * needed. Uses a MUI Select so the menu portals above the app chrome (same as
 * the DeploymentTrackBar track selector).
 */
export default function PersonaSwitcher({ persona, org }: { persona: Persona; org: string }): JSX.Element {
  const navigate = useNavigate();

  const handleChange = (value: Persona) => {
    if (value === persona) return;
    navigate(value === 'platform-engineer' ? peOverviewPath(org) : orgHomeUrl(org));
  };

  return (
    <Select
      size="small"
      value={persona}
      onChange={(e) => handleChange(e.target.value as Persona)}
      renderValue={(value) => {
        const option = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];
        return (
          <Stack direction="row" alignItems="center" gap={1}>
            <PersonaIcon value={option.value} />
            <Typography variant="body2" noWrap>
              {option.label}
            </Typography>
          </Stack>
        );
      }}
      inputProps={{ 'aria-label': 'Perspective' }}
      MenuProps={{ sx: { '& .MuiPaper-root': { minWidth: 260 } } }}
      sx={{
        ml: 1,
        color: 'text.primary',
        fontSize: '0.8125rem',
        '& .MuiOutlinedInput-root': { height: '30.75px' },
        '& .MuiOutlinedInput-notchedOutline': { borderRadius: 5 },
        '& .MuiSelect-select': { py: 1, px: 1.5, minHeight: 0, height: '100%', display: 'flex', alignItems: 'center', boxSizing: 'border-box' },
      }}>
      {OPTIONS.map((option) => (
        <MenuItem key={option.value} value={option.value} sx={{ display: 'block', py: 1 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <PersonaIcon value={option.value} />
            <Typography variant="body2" fontWeight={600}>
              {option.label}
            </Typography>
          </Stack>
          <Box sx={{ pl: 3 }}>
            <Typography variant="caption" color="text.secondary">
              {option.description}
            </Typography>
          </Box>
        </MenuItem>
      ))}
    </Select>
  );
}
