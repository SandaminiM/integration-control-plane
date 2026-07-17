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
import { buildRepoUrl } from './gitProviderUrl';
import { GitProvider } from '../types/credentials';

describe('buildRepoUrl', () => {
  it('builds a GitHub URL', () => {
    expect(buildRepoUrl(GitProvider.GITHUB, 'acme', 'svc')).toBe('https://github.com/acme/svc');
  });
  it('builds a Bitbucket cloud URL', () => {
    expect(buildRepoUrl(GitProvider.BITBUCKET_CLOUD, 'acme', 'svc')).toBe('https://bitbucket.org/acme/svc');
  });
  it('builds a GitLab self-managed URL from the credential server URL (trailing slash trimmed)', () => {
    expect(buildRepoUrl(GitProvider.GITLAB_SELF_MANAGED, 'acme', 'svc', 'https://gitlab.acme.io/')).toBe('https://gitlab.acme.io/acme/svc');
  });
  it('falls back to gitlab.com when no server URL is given', () => {
    expect(buildRepoUrl(GitProvider.GITLAB_SELF_MANAGED, 'acme', 'svc')).toBe('https://gitlab.com/acme/svc');
  });
  it('builds an Azure DevOps _git URL', () => {
    expect(buildRepoUrl(GitProvider.AZURE_DEVOPS, 'acme', 'svc')).toBe('https://dev.azure.com/acme/_git/svc');
  });
});
