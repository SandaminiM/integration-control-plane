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

import { Box, IconButton, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Copy } from '@wso2/oxygen-ui-icons-react';
import { useState } from 'react';
import type { JSX } from 'react';

interface CopilotErrorCardProps {
  errorMsg: string;
  trackingId?: string;
}

export default function CopilotErrorCard({ errorMsg, trackingId }: CopilotErrorCardProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (trackingId) {
      try {
        await navigator.clipboard.writeText(trackingId);
        setCopied(true);
      } catch {
        // clipboard write failed (permission denied or non-secure context)
      }
    }
  };

  return (
    <Box sx={{ mt: 1, mb: 2 }}>
      <Typography variant="body2" color="error.main">
        {errorMsg}
      </Typography>
      {trackingId && (
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
            Tracking ID: {trackingId}
          </Typography>
          <Tooltip title={copied ? 'Copied' : 'Copy to clipboard'} onClose={() => setCopied(false)} placement="top">
            <IconButton size="small" onClick={handleCopy} aria-label="Copy tracking ID">
              <Copy size={12} />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Box>
  );
}
