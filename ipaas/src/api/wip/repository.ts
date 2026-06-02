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

import { choreoClient, withStsRetry } from './httpClients';
import { gql } from './graphql';
import type { Repository, Commit, UserRepo, RepoBranch, RepoMetadata, RepoTreeNode, ChoreoSampleImageEntry } from '../../types/repository';
import type { UpdateBuildpackConfigsInput } from '../../types/build';

const COMPONENT_REPOSITORY_QUERY = `
  query GetComponentRepository($projectId: String!, $componentHandler: String!) {
    component(projectId: $projectId, componentHandler: $componentHandler) {
      repository {
        gitProvider, organizationApp, nameApp, branch, appSubPath,
        bitbucketServerUrl, serverUrl, projectApp,
        isBuildConfigurationMigrated,
        buildpackConfig { versionId, buildContext, isUnitTestEnabled, languageVersion, pullLatestSubmodules, enableTrivyScan, keyValues { id, key, value } }
      }
    }
  }`;

const COMMIT_HISTORY_QUERY = `
  query GetCommitHistory($componentId: String!, $branch: String!) {
    commitHistory(componentId: $componentId, branch: $branch) {
      sha, message, isLatest,
      author { name, date, email, avatarUrl }
    }
  }`;

const USER_REPOS_QUERY = `
  query GetUserRepos {
    userRepos {
      orgName
      repositories { name }
    }
  }`;

const REPO_BRANCHES_QUERY = `
  query GetRepoBranches($repositoryOrganization: String!, $repositoryName: String!, $isPublicRepo: Boolean!) {
    repoBranchList(secretRef: "", repositoryOrganization: $repositoryOrganization, repositoryName: $repositoryName, isPublicRepo: $isPublicRepo) {
      name
      isDefault
    }
  }`;

const REPO_METADATA_QUERY = `
  query GetRepoMetadata(
    $organizationName: String!, $repoName: String!, $branch: String!,
    $subPath: String!, $secretRef: String!, $isPublicRepo: Boolean!
  ) {
    repoMetadata(
      organizationName: $organizationName,
      repoName: $repoName,
      branch: $branch,
      subPath: $subPath,
      buildpackId: "",
      dockerFilePath: "",
      dockerContextPath: "",
      openAPIPath: "",
      componentId: "",
      testRunnerType: "",
      secretRef: $secretRef,
      isService: false,
      isPublicRepo: $isPublicRepo,
      isGitProxy: false
    ) {
      isBareRepo, isSubPathEmpty, isSubPathValid, isValidRepo,
      hasBallerinaTomlInPath, hasBallerinaTomlInRoot, isDockerfilePathValid,
      hasDockerfileInPath, hasPomXmlInPath, hasPomXmlInRoot, isBuildpackPathValid,
      isProcfileExists, isEndpointYamlExists
    }
  }`;

const UPDATE_BUILDPACK_BUILD_CONFIGURATIONS = `
  mutation updateBuildpackBuildConfigurations(
    $componentId: String!,
    $buildContext: String,
    $versionId: String!,
    $languageVersion: String,
    $environmentVariables: [BuildpackBuildEnvironmentVariable!],
    $isUnitTestEnabled: Boolean,
    $pullLatestSubmodules: Boolean,
    $enableTrivyScan: Boolean
  ) {
    updateBuildpackBuildConfigurations(input: {
      componentId: $componentId,
      buildContext: $buildContext,
      versionId: $versionId,
      languageVersion: $languageVersion,
      environmentVariables: $environmentVariables,
      isUnitTestEnabled: $isUnitTestEnabled,
      pullLatestSubmodules: $pullLatestSubmodules,
      enableTrivyScan: $enableTrivyScan
    })
  }`;

const OBTAIN_USER_TOKEN = `
  mutation ObtainUserToken($authorizationCode: String!) {
    obtainUserToken(authorizationCode: $authorizationCode) {
      success
      message
    }
  }`;

export async function fetchComponentRepository(projectId: string, componentHandler: string): Promise<Repository | null> {
  return gql<{ component: { repository: Repository } }>(COMPONENT_REPOSITORY_QUERY, { projectId, componentHandler }).then((d) => d.component?.repository ?? null);
}

export async function fetchCommitHistory(componentId: string, branch: string): Promise<Commit[]> {
  return gql<{ commitHistory: Commit[] }>(COMMIT_HISTORY_QUERY, { componentId, branch }).then((d) => d.commitHistory ?? []);
}

export async function fetchGitHubUserRepos(): Promise<UserRepo[]> {
  return gql<{ userRepos: UserRepo[] }>(USER_REPOS_QUERY).then((d) => d.userRepos ?? []);
}

export async function fetchRepoBranches(repoOrg: string, repoName: string, isPublicRepo: boolean): Promise<RepoBranch[]> {
  return gql<{ repoBranchList: RepoBranch[] }>(REPO_BRANCHES_QUERY, { repositoryOrganization: repoOrg, repositoryName: repoName, isPublicRepo }).then((d) => d.repoBranchList ?? []);
}

export async function fetchRepoMetadata(org: string, repo: string, branch: string, subPath: string, isPublicRepo = false): Promise<RepoMetadata> {
  return gql<{ repoMetadata: RepoMetadata }>(REPO_METADATA_QUERY, {
    organizationName: org,
    repoName: repo,
    branch,
    subPath: subPath.replace(/^\//, ''),
    secretRef: '',
    isPublicRepo,
  }).then((d) => d.repoMetadata);
}

export async function fetchChoreoSampleImages(orgUuid: string, projectId: string): Promise<ChoreoSampleImageEntry[]> {
  const params = new URLSearchParams({ organization_id: orgUuid, project_id: projectId });
  const json = await choreoClient.get<{ data?: { images?: ChoreoSampleImageEntry[] } }>(`/devops/1.0.0/api/v1/byoi/components/choreo-sample-images?${params}`);
  return json?.data?.images ?? [];
}

export async function updateBuildpackConfigs(input: UpdateBuildpackConfigsInput): Promise<string> {
  return gql<{ updateBuildpackBuildConfigurations: string }>(UPDATE_BUILDPACK_BUILD_CONFIGURATIONS, {
    componentId: input.componentId,
    versionId: input.versionId,
    buildContext: input.buildContext,
    languageVersion: input.languageVersion,
    environmentVariables: input.environmentVariables,
    isUnitTestEnabled: input.isUnitTestEnabled,
    pullLatestSubmodules: input.pullLatestSubmodules,
    enableTrivyScan: input.enableTrivyScan,
  }).then((d) => d.updateBuildpackBuildConfigurations);
}

export async function obtainGithubToken(authorizationCode: string): Promise<{ success: boolean; message: string }> {
  return gql<{ obtainUserToken: { success: boolean; message: string } }>(OBTAIN_USER_TOKEN, { authorizationCode }).then((d) => d.obtainUserToken);
}

export async function fetchRepoContents(org: string, repo: string, branch: string, isPublicRepo = false): Promise<RepoTreeNode[]> {
  const json = await withStsRetry(() => choreoClient.get<Record<string, unknown>>(`/component-mgt/1.0.0/repositories/${encodeURIComponent(org)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(branch)}/contents?isPublicRepo=${isPublicRepo}`));
  return (json?.data ?? json) as RepoTreeNode[];
}
