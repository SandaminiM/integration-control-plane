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

import { describe, expect, it } from 'vitest';
import { getPodStatus, humanizePodStatus, podStatusPalette, runningPodCount } from './pods';
import type { ClusterPod } from '../types/scaling';

const pod = (over: Partial<ClusterPod> & { name: string }): ClusterPod => ({
  metadata: { name: over.name, ...over.metadata },
  spec: over.spec,
  status: over.status,
});

describe('getPodStatus', () => {
  it('deletionTimestamp → Terminating', () => {
    expect(getPodStatus(pod({ name: 'p', metadata: { name: 'p', deletionTimestamp: '2026-01-01' } }))).toEqual({ status: 'Terminating', isRunning: false });
  });
  it('waiting reason is humanized', () => {
    expect(getPodStatus(pod({ name: 'p', status: { containerStatuses: [{ state: { waiting: { reason: 'PodInitializing' } } }] } })).status).toBe('Pod Initializing');
  });
  it('Running phase → isRunning', () => {
    expect(getPodStatus(pod({ name: 'p', status: { phase: 'Running' } }))).toEqual({ status: 'Running', isRunning: true });
  });
});

describe('runningPodCount', () => {
  it('counts Running/Succeeded as healthy', () => {
    const pods: ClusterPod[] = [pod({ name: 'a', status: { phase: 'Running' } }), pod({ name: 'b', status: { phase: 'Pending' } }), pod({ name: 'c', status: { phase: 'Succeeded' } })];
    expect(runningPodCount(pods)).toEqual({ running: 2, total: 3 });
  });
});

describe('humanizePodStatus', () => {
  it('splits camel case and capitalises', () => {
    expect(humanizePodStatus('CrashLoopBackOff')).toBe('Crash Loop Back Off');
    expect(humanizePodStatus('containerCreating')).toBe('Container Creating');
  });
});

describe('podStatusPalette', () => {
  it('running is green, terminating amber, everything else body text', () => {
    expect(podStatusPalette('Running', true)).toEqual({ chip: 'success', text: 'success.main' });
    expect(podStatusPalette('Terminating', false)).toEqual({ chip: 'warning', text: 'warning.main' });
    expect(podStatusPalette('Pod Initializing', false)).toEqual({ chip: 'secondary', text: 'text.primary' });
  });
});
