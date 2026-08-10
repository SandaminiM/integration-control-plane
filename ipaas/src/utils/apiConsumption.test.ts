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
import { consumerSummary, isConsumerNameTaken, normalizeConsumerStatus } from './apiConsumption';
import type { Consumer, ConsumerStatus } from '../types/consumers';

const consumer = (over: { status?: ConsumerStatus; createdAt?: string; appCreatedAt?: string } = {}): Consumer => ({
  id: 'my-app',
  displayName: 'My App',
  application: { id: 'my-app', displayName: 'My App', createdAt: over.appCreatedAt },
  credential: { id: 'key-1', applicationId: 'my-app', restApiId: 'greeter-greeter-http', createdAt: over.createdAt },
  status: over.status ?? 'active',
  credentialIds: ['key-1'],
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
  it('reports when the consumer application was created', () => {
    expect(consumerSummary(consumer({ appCreatedAt: '2026-07-30T10:00:00Z' })).startsWith('Created at ')).toBe(true);
  });
  it('reads the same regardless of whether the credential is revoked', () => {
    const active = consumerSummary(consumer({ appCreatedAt: '2026-07-30T10:00:00Z' }));
    const revoked = consumerSummary(consumer({ status: 'revoked', appCreatedAt: '2026-07-30T10:00:00Z' }));
    expect(revoked).toBe(active);
  });
  it('falls back to the credential timestamp when there is no application', () => {
    expect(consumerSummary(consumer({ createdAt: '2026-07-30T10:00:00Z' })).startsWith('Created at ')).toBe(true);
  });
  it('is empty with no timestamp, leaving the status to the chip alone', () => {
    expect(consumerSummary(consumer())).toBe('');
    expect(consumerSummary(consumer({ status: 'revoked' }))).toBe('');
  });
  it('is empty for an unparseable timestamp', () => {
    expect(consumerSummary(consumer({ appCreatedAt: 'not-a-date' }))).toBe('');
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
