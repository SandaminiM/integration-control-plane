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

import { Box, Grid, IconButton, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Check, Copy } from '@wso2/oxygen-ui-icons-react';
import { useState, type JSX } from 'react';
import { copyValueBox, fieldLabel } from './CopyField.styles';

/** A labelled, read-only monospace value with a copy-to-clipboard button. */
export default function CopyField({ label, value }: { label: string; value: string }): JSX.Element {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const onCopy = () => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setFailed(false);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        setFailed(true);
        window.setTimeout(() => setFailed(false), 2000);
      });
  };
  return (
    <Grid container alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
      <Grid size={{ xs: 12, sm: 3 }}>
        <Typography variant="body2" sx={fieldLabel}>
          {label}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, sm: 9 }}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Box sx={copyValueBox} title={value}>
            {value || '—'}
          </Box>
          <Tooltip title={copied ? 'Copied' : failed ? 'Copy failed' : 'Copy'}>
            <span>
              <IconButton size="small" aria-label={`Copy ${label}`} onClick={onCopy} disabled={!value}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Grid>
    </Grid>
  );
}
