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
import { calculateAggregateUsage, formatBytes, formatMillicores, parseCpuToMillicores, parseMemoryToBytes, podLastActivity, podRestartCount } from './podMetrics';
import type { ClusterPod, PodMetrics } from '../types/runtime';

describe('parseCpuToMillicores', () => {
  it('parses cores, millicores, micro and nano', () => {
    expect(parseCpuToMillicores('1')).toBe(1000);
    expect(parseCpuToMillicores('0.5')).toBe(500);
    expect(parseCpuToMillicores('250m')).toBe(250);
    expect(parseCpuToMillicores('500u')).toBe(0.5);
    expect(parseCpuToMillicores('123456789n')).toBeCloseTo(123.456789, 3);
  });
  it('returns 0 for empty', () => {
    expect(parseCpuToMillicores(undefined)).toBe(0);
    expect(parseCpuToMillicores('')).toBe(0);
  });
});

describe('parseMemoryToBytes', () => {
  it('parses binary and decimal suffixes and bare bytes', () => {
    expect(parseMemoryToBytes('128Mi')).toBe(128 * 1024 * 1024);
    expect(parseMemoryToBytes('1Gi')).toBe(1024 ** 3);
    expect(parseMemoryToBytes('1M')).toBe(1_000_000);
    expect(parseMemoryToBytes('512000')).toBe(512000);
    expect(parseMemoryToBytes(null)).toBe(0);
  });
});

describe('formatters', () => {
  it('formats millicores as vCPU', () => {
    expect(formatMillicores(250)).toBe('0.25 vCPU');
    expect(formatMillicores(0)).toBe('0.00 vCPU');
  });
  it('formats bytes with binary units', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(128 * 1024 * 1024)).toBe('128.00 MiB');
  });
});

describe('calculateAggregateUsage', () => {
  const pods: ClusterPod[] = [
    {
      metadata: { name: 'p1', uid: 'u1' },
      spec: { containers: [{ name: 'main', resources: { limits: { cpu: '500m', memory: '256Mi' } } }] },
      status: { phase: 'Running', containerStatuses: [{ name: 'main', ready: true, restartCount: 2 }] },
    },
  ];
  const metrics: PodMetrics[] = [{ metadata: { name: 'p1' }, containers: [{ name: 'main', usage: { cpu: '250m', memory: '128Mi' } }] }];

  it('sums usage vs limits and computes percent', () => {
    const usage = calculateAggregateUsage(pods, metrics);
    expect(usage.cpu.limits).toBe(500);
    expect(usage.cpu.used).toBe(250);
    expect(usage.cpu.usagePercent).toBe(50);
    expect(usage.memory.usagePercent).toBe(50);
  });

  it('handles zero limits without dividing by zero', () => {
    const usage = calculateAggregateUsage([], []);
    expect(usage.cpu.usagePercent).toBe(0);
    expect(usage.memory.usagePercent).toBe(0);
  });
});

describe('pod status helpers', () => {
  const pod: ClusterPod = {
    metadata: { name: 'p1', uid: 'u1' },
    spec: { containers: [] },
    status: {
      phase: 'Running',
      containerStatuses: [
        { name: 'a', ready: true, restartCount: 1 },
        { name: 'b', ready: false, restartCount: 3 },
      ],
    },
  };
  it('podRestartCount sums restarts', () => {
    expect(podRestartCount(pod)).toBe(4);
  });
});

describe('podLastActivity', () => {
  it('prefers the pod start time', () => {
    const pod = { metadata: { name: 'a', uid: 'a' }, spec: { containers: [] }, status: { phase: 'Running', startTime: '2026-01-01T00:00:00Z' } } as ClusterPod;
    expect(podLastActivity(pod)).toBe('2026-01-01T00:00:00Z');
  });

  it('falls back to a running container start time, and is undefined when neither exists', () => {
    const withContainer = {
      metadata: { name: 'a', uid: 'a' },
      spec: { containers: [] },
      status: { phase: 'Running', containerStatuses: [{ name: 'c', ready: true, restartCount: 0, state: { running: { startedAt: '2026-02-02T00:00:00Z' } } }] },
    } as ClusterPod;
    expect(podLastActivity(withContainer)).toBe('2026-02-02T00:00:00Z');
    expect(podLastActivity({ metadata: { name: 'a', uid: 'a' }, spec: { containers: [] }, status: { phase: 'Pending' } } as ClusterPod)).toBeUndefined();
  });
});
