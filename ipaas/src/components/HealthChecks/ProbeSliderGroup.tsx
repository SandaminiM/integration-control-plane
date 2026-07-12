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

import { Grid } from '@wso2/oxygen-ui';
import type { JSX } from 'react';
import PresetSlider from '../common/PresetSlider';
import { FAILURE, FREQUENCY, INITIAL_DELAY, SUCCESS, TIMEOUT } from '../../utils/healthChecks';

export interface ProbeSliderValues {
  failureThreshold: number;
  successThreshold: number;
  initialDelaySeconds: number;
  periodSeconds: number;
  timeoutSeconds: number;
}

interface ProbeSliderGroupProps {
  values: ProbeSliderValues;
  showSuccess: boolean;
  viewMode?: boolean;
  disabled?: boolean;
  onChange?: (field: keyof ProbeSliderValues, value: number) => void;
}

const DESC = {
  failure: 'Number of retries before the probe is considered to have failed. The container will be automatically restarted after this threshold is reached.',
  success: 'Minimum consecutive successes for the probe to be considered successful after having failed once.',
  delay: 'Number of seconds to wait before initiating the first probe after the container is started.',
  frequency: 'Defines how often the probe is run against the container.',
  timeout: 'Number of seconds after which the probe times out. A timeout will also be considered a failure.',
};

/** The five (four for liveness) timing/threshold sliders shared by the probe view and form. */
export default function ProbeSliderGroup({ values, showSuccess, viewMode, disabled, onChange }: ProbeSliderGroupProps): JSX.Element {
  const desc = viewMode ? undefined : DESC;
  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <PresetSlider label="Failure threshold" value={values.failureThreshold} min={FAILURE.min} max={FAILURE.max} marks={FAILURE.marks} viewMode={viewMode} disabled={disabled} description={desc?.failure} onChange={(v) => onChange?.('failureThreshold', v)} />
      </Grid>
      {showSuccess && (
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <PresetSlider
            label="Success threshold after first failure"
            value={values.successThreshold}
            min={SUCCESS.min}
            max={SUCCESS.max}
            marks={SUCCESS.marks}
            viewMode={viewMode}
            disabled={disabled}
            description={desc?.success}
            onChange={(v) => onChange?.('successThreshold', v)}
          />
        </Grid>
      )}
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <PresetSlider
          label="Delay before initial probe"
          unit="s"
          value={values.initialDelaySeconds}
          min={INITIAL_DELAY.min}
          max={INITIAL_DELAY.max}
          marks={INITIAL_DELAY.marks}
          viewMode={viewMode}
          disabled={disabled}
          description={desc?.delay}
          onChange={(v) => onChange?.('initialDelaySeconds', v)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <PresetSlider
          label="Probe frequency"
          unit="s"
          value={values.periodSeconds}
          min={FREQUENCY.min}
          max={FREQUENCY.max}
          marks={FREQUENCY.marks}
          viewMode={viewMode}
          disabled={disabled}
          description={desc?.frequency}
          onChange={(v) => onChange?.('periodSeconds', v)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <PresetSlider label="Timeout" unit="s" value={values.timeoutSeconds} min={TIMEOUT.min} max={TIMEOUT.max} marks={TIMEOUT.marks} viewMode={viewMode} disabled={disabled} description={desc?.timeout} onChange={(v) => onChange?.('timeoutSeconds', v)} />
      </Grid>
    </Grid>
  );
}
