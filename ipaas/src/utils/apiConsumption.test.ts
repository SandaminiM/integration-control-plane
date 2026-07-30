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
import { consumerDisplayName, consumerSummary, subscriptionCurl } from './apiConsumption';
import type { Consumer } from '../types/consumers';

const consumer = (over: { displayName?: string; status?: string; createdAt?: string } = {}): Consumer => ({
  application: { id: 'my-app', displayName: over.displayName },
  subscription: { id: 'sub-1', applicationId: 'my-app', restApiId: 'greeter-greeter-http', status: over.status, createdAt: over.createdAt },
});

describe('consumerDisplayName', () => {
  it('prefers the display name', () => {
    expect(consumerDisplayName(consumer({ displayName: 'My App' }))).toBe('My App');
  });
  it('falls back to the handle', () => {
    expect(consumerDisplayName(consumer())).toBe('my-app');
  });
});

describe('consumerSummary', () => {
  it('joins the credential kind, status and subscribed date', () => {
    const summary = consumerSummary(consumer({ status: 'ACTIVE', createdAt: '2026-07-30T10:00:00Z' }));
    expect(summary.startsWith('Subscription-Key · ACTIVE · subscribed ')).toBe(true);
  });
  it('omits missing parts instead of leaving empty separators', () => {
    expect(consumerSummary(consumer())).toBe('Subscription-Key');
  });
  it('omits an unparseable date', () => {
    expect(consumerSummary(consumer({ status: 'ACTIVE', createdAt: 'not-a-date' }))).toBe('Subscription-Key · ACTIVE');
  });
});

describe('subscriptionCurl', () => {
  it('sends the token as the Subscription-Key header', () => {
    expect(subscriptionCurl('https://gw/api', 'tok-123')).toBe("curl 'https://gw/api' \\\n  -H 'Subscription-Key: tok-123'");
  });
  it('falls back to a placeholder when no token is known', () => {
    expect(subscriptionCurl('https://gw/api', '')).toContain('<subscription-token>');
  });
});
