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

import { describe, it, expect } from 'vitest';
import { resolveEndpointInvokeUrl } from './endpoints';
import type { EnvEndpoint } from '../types/component';

const ep = (partial: Partial<EnvEndpoint>): EnvEndpoint => ({ id: 'e', releaseId: 'r', environmentId: 'env', displayName: 'ep', type: 'GraphQL', visibility: 'Public', ...partial }) as EnvEndpoint;

describe('resolveEndpointInvokeUrl', () => {
  it('returns empty string for a missing endpoint', () => {
    expect(resolveEndpointInvokeUrl(undefined)).toBe('');
  });

  it('prefers the widest declared visibility and strips the trailing slash', () => {
    const e = ep({ networkVisibilities: ['Public', 'Project'], publicUrl: 'https://pub/graphql/', projectUrl: 'https://proj/graphql' });
    expect(resolveEndpointInvokeUrl(e)).toBe('https://pub/graphql');
  });

  it('falls back to organization visibility when not public', () => {
    const e = ep({ networkVisibilities: ['Organization'], organizationUrl: 'https://org/graphql', projectUrl: 'https://proj/graphql' });
    expect(resolveEndpointInvokeUrl(e)).toBe('https://org/graphql');
  });

  it('falls back to any available url when no visibility matches', () => {
    const e = ep({ networkVisibilities: [], invokeUrl: 'https://any/graphql' });
    expect(resolveEndpointInvokeUrl(e)).toBe('https://any/graphql');
  });
});
