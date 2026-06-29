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

/** Git provider identifiers sent to the backend as the credential `type`. */
export enum GitProvider {
  GITHUB = 'github',
  BITBUCKET_CLOUD = 'bitbucket',
  BITBUCKET_SERVER = 'bitbucket-server',
  GITLAB_SELF_MANAGED = 'gitlab-server',
  AZURE_DEVOPS = 'azure-devops',
}

/** An organization-level git credential. Secrets are write-only; only a reference token is returned. */
export interface GitCredential {
  id: string;
  name: string;
  createdAt: string;
  organizationUuid: string;
  type: string;
  referenceToken: string;
}

export interface CredentialComponentRef {
  projectName: string;
  componentNames: string[];
}

/** Whether a credential can be deleted, plus the components blocking it. */
export interface CredentialDeleteEligibility {
  canDelete: boolean;
  components: CredentialComponentRef[];
}

/**
 * Create input — a discriminated union keyed by `type` so each provider supplies
 * exactly its own config block and forbids the others (no ambiguous payloads).
 * GitHub uses an app/OAuth flow and carries no inline config.
 */
export type CreateGitCredentialInput =
  | { name: string; type: GitProvider.GITHUB }
  | { name: string; type: GitProvider.BITBUCKET_CLOUD; bitbucketCredential: { userName: string; appPassword: string } }
  | { name: string; type: GitProvider.BITBUCKET_SERVER; bitbucketServerConfig: { serverUrl: string; serverToken: string } }
  | { name: string; type: GitProvider.GITLAB_SELF_MANAGED; gitLabServerConfig: { serverUrl: string; pat: string } }
  | { name: string; type: GitProvider.AZURE_DEVOPS; azureDevOpsConfig: { organizationName: string; pat: string } };
