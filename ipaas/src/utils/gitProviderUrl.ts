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

import { GitProvider } from '../types/credentials';
import { gitProviderBase } from '../paths';

/**
 * Source repo URL for the create-component payload. `org`/`repo` come from the
 * repo picker; `serverUrl` (GitLab self-managed) comes from the stored credential.
 * Mirrors Devant's per-provider builders.
 */
export function buildRepoUrl(provider: GitProvider, org: string, repo: string, serverUrl?: string): string {
  switch (provider) {
    case GitProvider.BITBUCKET_CLOUD:
      return `${gitProviderBase.bitbucket}/${org}/${repo}`;
    case GitProvider.GITLAB_SELF_MANAGED:
      return `${(serverUrl || gitProviderBase.gitlab).replace(/\/$/, '')}/${org}/${repo}`;
    case GitProvider.AZURE_DEVOPS:
      return `${gitProviderBase.azure}/${org}/_git/${repo}`;
    default:
      return `${gitProviderBase.github}/${org}/${repo}`;
  }
}
