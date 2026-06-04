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

// TODO: implement using ICP local REST APIs

import type {
  GqlRepository,
  GqlCommit,
  GqlUserRepo,
  GqlRepoBranch,
  GqlRepoMetadata,
  RepoTreeNode,
  ChoreoSampleImageEntry,
} from '../../types/repository';
import type { UpdateBuildpackConfigsInput } from '../../types/build';

const ni = (name: string): never => { throw new Error(`[icp] repository.${name}: not implemented`); };

export const fetchComponentRepository = (_projectId: string, _componentHandler: string): Promise<GqlRepository | null> => ni('fetchComponentRepository');
export const fetchCommitHistory = (_componentId: string, _branch: string): Promise<GqlCommit[]> => ni('fetchCommitHistory');
export const fetchGitHubUserRepos = (): Promise<GqlUserRepo[]> => ni('fetchGitHubUserRepos');
export const fetchRepoBranches = (_repoOrg: string, _repoName: string, _isPublicRepo: boolean): Promise<GqlRepoBranch[]> => ni('fetchRepoBranches');
export const fetchRepoMetadata = (_org: string, _repo: string, _branch: string, _subPath: string, _isPublicRepo?: boolean): Promise<GqlRepoMetadata> => ni('fetchRepoMetadata');
export const fetchChoreoSampleImages = (_orgUuid: string, _projectId: string): Promise<ChoreoSampleImageEntry[]> => ni('fetchChoreoSampleImages');
export const updateBuildpackConfigs = (_input: UpdateBuildpackConfigsInput): Promise<string> => ni('updateBuildpackConfigs');
export const obtainGithubToken = (_authorizationCode: string): Promise<{ success: boolean; message: string }> => ni('obtainGithubToken');
export const fetchRepoContents = (_org: string, _repo: string, _branch: string, _isPublicRepo?: boolean): Promise<RepoTreeNode[]> => ni('fetchRepoContents');
