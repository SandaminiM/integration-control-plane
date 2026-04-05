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

import { Box } from '@wso2/oxygen-ui';
import { Check, Clock, Loader, X } from '@wso2/oxygen-ui-icons-react';
import type { BuildStep } from '../api/builds';

interface StatusIconProps {
  size?: number;
}

export function InProgressIcon({ size = 20 }: StatusIconProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        color: 'primary.main',
        animation: 'spin 3s linear infinite',
        '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
      }}>
      <Loader size={size} />
    </Box>
  );
}

export function SuccessIcon({ size = 20 }: StatusIconProps) {
  const iconSize = Math.round(size * 0.55);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: 'success.main',
        color: 'common.white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
      <Check size={iconSize} />
    </Box>
  );
}

export function QueuedIcon({ size = 20 }: StatusIconProps) {
  const iconSize = Math.round(size * 0.55);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: 'action.disabledBackground',
        color: 'grey.600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
      <Clock size={iconSize} />
    </Box>
  );
}

export function FailedIcon({ size = 20 }: StatusIconProps) {
  const iconSize = Math.round(size * 0.55);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: 'error.main',
        color: 'common.white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
      <X size={iconSize} />
    </Box>
  );
}

export function StageIcon({ status, size = 18 }: { status: 'success' | 'error' | 'active' | 'pending'; size?: number }) {
  if (status === 'active') return <InProgressIcon size={size} />;
  if (status === 'success') return <SuccessIcon size={size} />;
  if (status === 'error') return <FailedIcon size={size} />;
  return <QueuedIcon size={size} />;
}

function BlinkingBlueDot() {
  return (
    <Box
      sx={{
        width: 9,
        height: 9,
        borderRadius: '50%',
        bgcolor: 'info.main',
        flexShrink: 0,
        animation: 'stepBlink 1.4s ease-in-out infinite',
        '@keyframes stepBlink': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.2, transform: 'scale(0.7)' },
        },
      }}
    />
  );
}

function StatusDot({ color }: { color: string }) {
  return <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />;
}

function PendingDot() {
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        border: '1.5px solid',
        borderColor: 'text.disabled',
        flexShrink: 0,
      }}
    />
  );
}

export function SubStepIcon({ step }: { step: BuildStep }) {
  if (step.status === 'in_progress') return <BlinkingBlueDot />;
  const c = step.conclusion?.toLowerCase();
  if (c === 'success') return <StatusDot color="success.main" />;
  if (c === 'failure' || c === 'failed') return <StatusDot color="error.main" />;
  if (c === 'skipped') return <StatusDot color="text.disabled" />;
  return <PendingDot />;
}
