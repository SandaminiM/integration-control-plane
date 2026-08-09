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
import { consumerDisplayName, consumerSummary, isConsumerNameTaken, normalizeConsumerStatus } from './apiConsumption';
import type { Consumer, ConsumerStatus } from '../types/consumers';

const consumer = (over: { displayName?: string; status?: ConsumerStatus; createdAt?: string; revokedAt?: string } = {}): Consumer => ({
  application: { id: 'my-app', displayName: over.displayName },
  credential: { id: 'key-1', applicationId: 'my-app', restApiId: 'greeter-greeter-http', createdAt: over.createdAt },
  status: over.status ?? 'active',
  revokedAt: over.revokedAt,
  credentialIds: ['key-1'],
});

describe('consumerDisplayName', () => {
  it('prefers the display name', () => {
    expect(consumerDisplayName(consumer({ displayName: 'My App' }))).toBe('My App');
  });
  it('falls back to the handle', () => {
    expect(consumerDisplayName(consumer())).toBe('my-app');
  });
});

describe('normalizeConsumerStatus', () => {
  it('maps the revoked-ish statuses regardless of case', () => {
    expect(normalizeConsumerStatus('REVOKED')).toBe('revoked');
    expect(normalizeConsumerStatus(' expired ')).toBe('revoked');
  });
  it('treats missing or unfamiliar statuses as active', () => {
    expect(normalizeConsumerStatus(undefined)).toBe('active');
    expect(normalizeConsumerStatus('ENABLED')).toBe('active');
  });
});

describe('consumerSummary', () => {
  it('dates an active consumer from its creation', () => {
    expect(consumerSummary(consumer({ createdAt: '2026-07-30T10:00:00Z' })).startsWith('Active since ')).toBe(true);
  });
  it('dates a revoked consumer from its revocation, not its creation', () => {
    const summary = consumerSummary(consumer({ status: 'revoked', createdAt: '2026-07-30T10:00:00Z', revokedAt: '2026-08-01T09:30:00Z' }));
    expect(summary.startsWith('Revoked ')).toBe(true);
    expect(summary).not.toContain('Active');
  });
  it('falls back to the bare state when no timestamp is reported', () => {
    expect(consumerSummary(consumer())).toBe('Active');
    expect(consumerSummary(consumer({ status: 'revoked' }))).toBe('Revoked');
  });
  it('falls back to the bare state for an unparseable timestamp', () => {
    expect(consumerSummary(consumer({ createdAt: 'not-a-date' }))).toBe('Active');
  });
});

describe('isConsumerNameTaken', () => {
  it('matches ignoring case and surrounding space', () => {
    expect(isConsumerNameTaken('  My App ', ['my app'])).toBe(true);
  });
  it('allows a name no other consumer of this endpoint uses', () => {
    expect(isConsumerNameTaken('other', ['my app'])).toBe(false);
  });
  it('never reports an empty name as taken — that is the required-field error', () => {
    expect(isConsumerNameTaken('   ', ['', 'my app'])).toBe(false);
  });
});
