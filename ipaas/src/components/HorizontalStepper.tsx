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

import { Box, Typography } from '@wso2/oxygen-ui';
import { Fragment, type JSX } from 'react';
import { FailedIcon, InProgressIcon, QueuedIcon, SuccessIcon } from './StatusIcons';

/** Lifecycle state of a single step, mirroring the shared Devant stepper. */
export type StepStatus = 'queued' | 'pending' | 'inProgress' | 'success' | 'skipped' | 'failed' | 'terminated' | 'notStarted';

export interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

/** Drives icon size, label font, and connector spacing — the "resizable" axis. */
export type StepperSize = 'xs' | 's' | 'm' | 'l';

interface HorizontalStepperProps {
  steps: Step[];
  /** Index of the step to emphasise (scaled icon + bold label). `-1` for none. */
  currentStepIndex: number;
  size?: StepperSize;
  /** Override the size's default vertical padding (px) — e.g. tighter on the Test page. */
  paddingY?: number;
}

interface SizeConfig {
  icon: number;
  label: number;
  connectorHeight: number;
  connectorMarginX: number;
  paddingY: number;
  paddingX: number;
  iconLabelGap: number;
  /** Lifts the connector up to the icon row (labels sit below the icons). */
  connectorMarginBottom: number;
}

const SIZE_CONFIG: Record<StepperSize, SizeConfig> = {
  xs: { icon: 16, label: 12, connectorHeight: 1, connectorMarginX: 6, paddingY: 8, paddingX: 8, iconLabelGap: 4, connectorMarginBottom: 20 },
  s: { icon: 20, label: 13, connectorHeight: 2, connectorMarginX: 10, paddingY: 12, paddingX: 12, iconLabelGap: 6, connectorMarginBottom: 24 },
  m: { icon: 24, label: 14, connectorHeight: 2, connectorMarginX: 16, paddingY: 24, paddingX: 16, iconLabelGap: 8, connectorMarginBottom: 28 },
  l: { icon: 32, label: 16, connectorHeight: 3, connectorMarginX: 20, paddingY: 36, paddingX: 20, iconLabelGap: 10, connectorMarginBottom: 36 },
};

function StepIcon({ status, size }: { status: StepStatus; size: number }): JSX.Element {
  switch (status) {
    case 'success':
      return <SuccessIcon size={size} />;
    case 'failed':
    case 'terminated':
      return <FailedIcon size={size} />;
    case 'inProgress':
    case 'queued':
      return <InProgressIcon size={size} />;
    default:
      return <QueuedIcon size={size} />;
  }
}

/** Connector colour reflects the step it follows: done → success, active → primary, else idle. */
function connectorColor(status: StepStatus): string {
  if (status === 'success' || status === 'skipped') return 'success.main';
  if (status === 'inProgress' || status === 'pending' || status === 'queued') return 'primary.light';
  return 'divider';
}

/**
 * A resizable horizontal stepper: status icon + label per step, connected by lines
 * that colour by progress. Shared by the BuildCard and the Automation Test page so
 * both render an identical stepper at their chosen `size`. Mirrors Devant's
 * `ChoreoSystem/HorizontalStepper`.
 */
export default function HorizontalStepper({ steps, currentStepIndex, size = 'm', paddingY }: HorizontalStepperProps): JSX.Element {
  const cfg = SIZE_CONFIG[size];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 600, mx: 'auto', width: '100%', py: `${paddingY ?? cfg.paddingY}px`, px: `${cfg.paddingX}px` }}>
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        return (
          <Fragment key={step.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', mb: `${cfg.iconLabelGap}px`, transition: 'transform 0.3s ease', transform: isActive ? 'scale(1.1)' : 'none' }}>
                <StepIcon status={step.status} size={cfg.icon} />
              </Box>
              {/* Labels stay in the default text colour regardless of status; only the icon + connector convey state. */}
              <Typography sx={{ fontSize: `${cfg.label}px`, fontWeight: isActive ? 500 : 400, textAlign: 'center', whiteSpace: 'nowrap', color: 'text.primary' }}>{step.label}</Typography>
            </Box>
            {index < steps.length - 1 && <Box sx={{ flex: 1, height: `${cfg.connectorHeight}px`, bgcolor: connectorColor(step.status), mb: `${cfg.connectorMarginBottom}px`, mx: `${cfg.connectorMarginX}px`, transition: 'background-color 0.3s ease' }} />}
          </Fragment>
        );
      })}
    </Box>
  );
}
