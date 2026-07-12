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

import { Box, Chip, Stack, Typography } from '@wso2/oxygen-ui';
import type { JSX } from 'react';
import ProbeSliderGroup from './ProbeSliderGroup';
import { PROBE_TYPE, type HCProbe } from '../../types/healthChecks';
import { probeTypeLabel } from '../../utils/healthChecks';

/** A labelled inline fact, e.g. **Port:** 8080. */
function Fact({ label, value }: { label: string; value: string | number }): JSX.Element {
  return (
    <Typography variant="body2">
      <Box component="span" fontWeight={700}>
        {label}:
      </Box>{' '}
      {value}
    </Typography>
  );
}

/** Read-only display of one probe: its mechanism details + timing/threshold sliders. */
export default function ProbeDisplay({ probe: p, showSuccess }: { probe: HCProbe; showSuccess: boolean }): JSX.Element {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        {p.type === PROBE_TYPE.HTTP_GET && (
          <Stack direction="row" flexWrap="wrap" gap={3}>
            <Fact label="Type" value={probeTypeLabel(p.type)} />
            <Fact label="Port" value={p.probe.httpGet?.port ?? ''} />
            <Fact label="Path" value={p.probe.httpGet?.path ?? ''} />
          </Stack>
        )}
        {p.type === PROBE_TYPE.TCP && (
          <Stack direction="row" flexWrap="wrap" gap={3}>
            <Fact label="Type" value={probeTypeLabel(p.type)} />
            <Fact label="Port" value={p.probe.tcpSocket?.port ?? ''} />
          </Stack>
        )}
        {p.type === PROBE_TYPE.EXEC && (
          <Box>
            <Fact label="Type" value={probeTypeLabel(p.type)} />
            <Box component="pre" sx={{ m: 0, mt: 1, px: 1.5, py: 1, bgcolor: 'action.hover', borderRadius: 1, fontSize: '0.8125rem', fontFamily: 'monospace', color: 'text.secondary', overflowX: 'auto' }}>
              {JSON.stringify(p.probe.exec?.command ?? [])}
            </Box>
          </Box>
        )}
        {p.type === PROBE_TYPE.HTTP_GET && (p.probe.httpGet?.httpHeaders?.length ?? 0) > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
            {p.probe.httpGet!.httpHeaders!.map((h) => (
              <Chip key={h.name + h.value} size="small" variant="outlined" color="secondary" label={`${h.name}: ${h.value}`} />
            ))}
          </Stack>
        )}
      </Box>
      <ProbeSliderGroup
        values={{
          failureThreshold: p.probe.failureThreshold,
          successThreshold: p.probe.successThreshold,
          initialDelaySeconds: p.probe.initialDelaySeconds,
          periodSeconds: p.probe.periodSeconds,
          timeoutSeconds: p.probe.timeoutSeconds,
        }}
        showSuccess={showSuccess}
        viewMode
      />
    </Box>
  );
}
