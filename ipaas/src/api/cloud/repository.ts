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

import { bff, items, q, seg, type ListResponse } from './_client';
import type {
  Repository,
  Commit,
  UserRepo,
  RepoBranch,
  RepoMetadata,
  RepoTreeNode,
  ChoreoSampleImageEntry,
} from '../../types/repository';
import type { UpdateBuildpackConfigsInput } from '../../types/build';

const REPO_METADATA_DEFAULT: RepoMetadata = {
  isBareRepo: false,
  isSubPathEmpty: false,
  isSubPathValid: true,
  isValidRepo: true,
  hasBallerinaTomlInPath: false,
  hasBallerinaTomlInRoot: false,
  isDockerfilePathValid: true,
  hasDockerfileInPath: false,
  hasPomXmlInPath: false,
  hasPomXmlInRoot: false,
  isBuildpackPathValid: true,
  isProcfileExists: false,
  isEndpointYamlExists: false,
};

// A reachable repo whose tree is empty: the sub-path holds no files, so the
// import flow must detect "empty" (not fall back to "non-empty"). Distinct from
// REPO_METADATA_DEFAULT, which stands in only when the tree can't be fetched.
const REPO_METADATA_EMPTY: RepoMetadata = {
  ...REPO_METADATA_DEFAULT,
  isSubPathValid: false,
  isSubPathEmpty: true,
};

// BFF ComponentRepository fields map 1:1 to Repository; projectName scopes
// the lookup to the component within the caller's namespace.
export async function fetchComponentRepository(projectId: string, componentHandler: string): Promise<Repository | null> {
  try {
    return await bff.get<Repository | null>(`/components/${seg(componentHandler)}/repository${q({ projectName: projectId })}`) ?? null;
  } catch {
    return null;
  }
}

// BFF derives the commit list from GitHub for the given branch; the Commit
// model matches Commit field-for-field.
export async function fetchCommitHistory(componentId: string, branch: string): Promise<Commit[]> {
  try {
    return items(await bff.get<ListResponse<Commit>>(`/components/${seg(componentId)}/commit-history${q({ branch })}`));
  } catch {
    return [];
  }
}

// awaits: GET /repos (BFF route does not exist yet).
export async function fetchGitHubUserRepos(): Promise<UserRepo[]> {
  return [];
}

// BFF proxies GitHub's List Branches API and stamps isDefault against
// default_branch. Public repos work unauthenticated; private repos need a
// GitHub OAuth token the cloud variant does not have (empty in that case).
export async function fetchRepoBranches(repoOrg: string, repoName: string, _isPublicRepo: boolean): Promise<RepoBranch[]> {
  try {
    return items(await bff.get<ListResponse<RepoBranch>>(`/repos/${seg(repoOrg)}/${seg(repoName)}/branches`));
  } catch {
    return [];
  }
}

// Flatten the nested GitHub tree into full blob paths from the repo root
// (e.g. "samples/svc/Ballerina.toml").
function collectBlobPaths(nodes: RepoTreeNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    if (n.type === 'blob') acc.push(n.path);
    if (n.children?.length) collectBlobPaths(n.children, acc);
  }
  return acc;
}

// Derived from the wired tree endpoint because the BFF has no repoMetadata
// equivalent. We compute only the flags the import flow uses for technology
// detection + sub-path validation; on any failure we fall back to the default
// so the importer degrades to "non-empty" rather than hanging.
export async function fetchRepoMetadata(org: string, repo: string, branch: string, subPath: string, isPublicRepo = false): Promise<RepoMetadata> {
  try {
    const tree = await fetchRepoContents(org, repo, branch, isPublicRepo);
    if (tree.length === 0) return REPO_METADATA_EMPTY;

    const blobs = collectBlobPaths(tree);
    const norm = subPath.replace(/^\/+/, '').replace(/\/+$/, '');
    const atRoot = (file: string) => blobs.includes(file);
    const atPath = (file: string) => (norm === '' ? atRoot(file) : blobs.includes(`${norm}/${file}`));
    const childrenOfPath = norm === '' ? blobs : blobs.filter((p) => p.startsWith(`${norm}/`));

    return {
      ...REPO_METADATA_DEFAULT,
      isValidRepo: true,
      isSubPathValid: norm === '' || childrenOfPath.length > 0,
      isSubPathEmpty: childrenOfPath.length === 0,
      hasBallerinaTomlInRoot: atRoot('Ballerina.toml'),
      hasBallerinaTomlInPath: atPath('Ballerina.toml'),
      hasPomXmlInRoot: atRoot('pom.xml'),
      hasPomXmlInPath: atPath('pom.xml'),
      hasDockerfileInPath: atPath('Dockerfile'),
      isProcfileExists: atPath('Procfile'),
      isEndpointYamlExists: atPath('endpoints.yaml') || atPath('endpoint.yaml'),
    };
  } catch {
    return REPO_METADATA_DEFAULT;
  }
}

// awaits: GET /samples/images.
export async function fetchChoreoSampleImages(_orgUuid: string, _projectId: string): Promise<ChoreoSampleImageEntry[]> {
  return [];
}

// awaits: PUT /components/{name}/buildpack-config.
export async function updateBuildpackConfigs(_input: UpdateBuildpackConfigsInput): Promise<string> {
  return '';
}

// awaits: POST /github/oauth/token.
export async function obtainGithubToken(_authorizationCode: string): Promise<{ success: boolean; message: string }> {
  return { success: false, message: 'GitHub OAuth is not supported in this build.' };
}

// BFF proxies GitHub's recursive Get-Tree API and assembles a nested
// RepoTreeNode tree. Empty on any failure so the importer doesn't retry-spin.
export async function fetchRepoContents(org: string, repo: string, branch: string, _isPublicRepo = false): Promise<RepoTreeNode[]> {
  try {
    return items(await bff.get<ListResponse<RepoTreeNode>>(`/repos/${seg(org)}/${seg(repo)}/contents${q({ branch })}`));
  } catch {
    return [];
  }
}
