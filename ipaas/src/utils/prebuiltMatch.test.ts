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
import { matchPrebuiltIntegration } from './prebuilt';
import type { PrebuiltIntegration } from '../types/prebuilt';
import type { Repository } from '../types/repository';

const prebuilts: PrebuiltIntegration[] = [
  {
    displayName: 'Stripe Customer',
    description: '',
    applications: [],
    bidirectional: false,
    componentType: 'webhook',
    buildPack: 'ballerina',
    repositoryUrl: 'https://github.com/wso2/integration-samples/',
    branch: 'main',
    componentPath: '/integrator-default-project/create-stripe-customer-wh',
    tags: [],
    imageUrl: '',
  },
];

const repo = (over: Partial<Repository>): Repository => ({ gitProvider: 'github', organizationApp: 'wso2', nameApp: 'integration-samples', branch: 'main', appSubPath: 'integrator-default-project/create-stripe-customer-wh', ...over }) as Repository;

describe('matchPrebuiltIntegration', () => {
  it('matches on repo url + component path + branch', () => {
    expect(matchPrebuiltIntegration(repo({}), prebuilts)?.displayName).toBe('Stripe Customer');
  });

  it('tolerates a leading slash on the sub-path', () => {
    expect(matchPrebuiltIntegration(repo({ appSubPath: '/integrator-default-project/create-stripe-customer-wh' }), prebuilts)).toBeDefined();
  });

  it('returns undefined on a different repo, path, or branch', () => {
    expect(matchPrebuiltIntegration(repo({ nameApp: 'other-repo' }), prebuilts)).toBeUndefined();
    expect(matchPrebuiltIntegration(repo({ appSubPath: 'some/other/path' }), prebuilts)).toBeUndefined();
    expect(matchPrebuiltIntegration(repo({ branch: 'dev' }), prebuilts)).toBeUndefined();
  });

  it('matches a prebuilt with no branch field against a main-branch repo (pi.branch ?? "main")', () => {
    const noBranch: PrebuiltIntegration[] = [{ ...prebuilts[0], branch: undefined }];
    expect(matchPrebuiltIntegration(repo({ branch: 'main' }), noBranch)?.displayName).toBe('Stripe Customer');
  });

  it('returns undefined without repo fields or prebuilt list', () => {
    expect(matchPrebuiltIntegration(null, prebuilts)).toBeUndefined();
    expect(matchPrebuiltIntegration(repo({}), undefined)).toBeUndefined();
    expect(matchPrebuiltIntegration(repo({ appSubPath: '' }), prebuilts)).toBeUndefined();
  });
});
