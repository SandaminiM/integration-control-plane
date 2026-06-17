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

import { Collapse, FormControlLabel, MenuItem, Radio, RadioGroup, Stack, TextField, Typography } from '@wso2/oxygen-ui';
import type { ReactNode } from 'react';
import { TIME_UNITS } from '../../constants/policy';
import type { RateLimitConfig, RateLimitLevel, TimeUnit } from '../../types/policy';
import { isRateLimitValid } from '../../utils/policy';

interface RateLimitingSectionProps {
  value: RateLimitConfig;
  onChange: (value: RateLimitConfig) => void;
  disabled?: boolean;
}

/**
 * Editor for the MCP API's request rate limit: either unlimited, or a maximum
 * number of requests per time unit. Controlled by the parent page so it can
 * track dirty state and save the whole API in one PUT.
 */
export default function RateLimitingSection({ value, onChange, disabled }: RateLimitingSectionProps): ReactNode {
  const limited = value.level === 'API_LEVEL';
  const countError = limited && value.requestCount !== '' && !isRateLimitValid(value);

  return (
    <Stack gap={1.5}>
      <Typography variant="body2" color="text.secondary">
        Limit how many requests this MCP server accepts. Resource-level limits are managed per environment from the deployment settings.
      </Typography>

      <RadioGroup row value={value.level} onChange={(e) => onChange({ ...value, level: e.target.value as RateLimitLevel })}>
        <FormControlLabel value="UNLIMITED" disabled={disabled} control={<Radio size="small" />} label={<Typography variant="body2">Unlimited</Typography>} />
        <FormControlLabel value="API_LEVEL" disabled={disabled} control={<Radio size="small" />} label={<Typography variant="body2">Limited</Typography>} />
      </RadioGroup>

      <Collapse in={limited} unmountOnExit>
        <Stack direction="row" alignItems="flex-start" gap={2}>
          <TextField
            size="small"
            type="number"
            label="Max requests"
            value={value.requestCount}
            onChange={(e) => onChange({ ...value, requestCount: e.target.value })}
            disabled={disabled}
            error={countError}
            helperText={countError ? 'Enter a positive whole number.' : ' '}
            sx={{ width: 160 }}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
          />
          <TextField select size="small" label="Per" value={value.timeUnit} onChange={(e) => onChange({ ...value, timeUnit: e.target.value as TimeUnit })} disabled={disabled} sx={{ width: 140 }} helperText=" ">
            {TIME_UNITS.map((u) => (
              <MenuItem key={u.value} value={u.value}>
                {u.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Collapse>
    </Stack>
  );
}
