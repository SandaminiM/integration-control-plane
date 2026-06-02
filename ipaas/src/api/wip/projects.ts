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

import { gql } from './graphql';
import type { GqlProject, ProjectContributor, ProjectHandlerAvailability, CreateProjectInput, CreateMonoRepoProjectInput } from '../../types/project';

const PROJECT_FIELDS = 'id, orgId, name, handler, description, version, createdDate, updatedAt, region, type, defaultDeploymentPipelineId';

const PROJECTS_QUERY = `
  query GetProjects($orgId: Int!) {
    projects(orgId: $orgId) { ${PROJECT_FIELDS} }
  }`;

const PROJECT_QUERY = `
  query GetProject($orgId: Int!, $projectId: String!) {
    project(orgId: $orgId, projectId: $projectId) { ${PROJECT_FIELDS} }
  }`;

const PROJECT_BY_HANDLER_QUERY = `
  query GetProjectByHandler($orgId: Int!, $projectHandler: String!) {
    projectByHandler(orgId: $orgId, projectHandler: $projectHandler) { ${PROJECT_FIELDS} }
  }`;

const PROJECT_CONTRIBUTORS_QUERY = `
  query GetProjectContributors($orgId: Int!, $projectId: String!) {
    project(orgId: $orgId, projectId: $projectId) {
      projectContributorsData {
        contributorCount
        contributors { id, pictureUrl, email, displayName, totalContributions }
      }
    }
  }`;

const PROJECT_COMPONENT_LABELS_QUERY = `
  query GetProjectComponentLabels($projectId: String!, $orgId: Int!) {
    projectComponentLabels(projectId: $projectId, orgId: $orgId)
  }`;

const PROJECT_HANDLER_AVAILABILITY_QUERY = `
  query ProjectHandlerAvailability($orgId: Int!, $projectHandlerCandidate: String!) {
    projectHandlerAvailability(orgId: $orgId, projectHandlerCandidate: $projectHandlerCandidate) {
      handlerUnique
      alternateHandlerCandidate
    }
  }`;

const CREATE_PROJECT = `
  mutation CreateProject($name: String!, $description: String!, $projectHandler: String!, $orgHandler: String!, $orgId: Int!) {
    createProject(project: {
      name: $name,
      description: $description,
      projectHandler: $projectHandler,
      orgId: $orgId,
      orgHandler: $orgHandler,
      version: "1.0.0"
    }) {
      id, orgId, name, version, createdDate, handler, region,
      description, defaultDeploymentPipelineId, deploymentPipelineIds,
      type, updatedAt
    }
  }`;

const CREATE_MONO_REPO_PROJECT = `
  mutation CreateMonoRepoProject(
    $name: String!, $description: String!, $projectHandler: String!,
    $orgHandler: String!, $orgId: Int!,
    $repository: String!, $gitOrganization: String!, $branch: String!,
    $directoryPath: String!, $gitProvider: String!, $isPublicRepo: Boolean!
  ) {
    createProject(project: {
      name: $name,
      description: $description,
      projectHandler: $projectHandler,
      orgId: $orgId,
      orgHandler: $orgHandler,
      version: "1.0.0",
      repository: $repository,
      secretRef: "",
      branch: $branch,
      gitProvider: $gitProvider,
      gitOrganization: $gitOrganization,
      directoryPath: $directoryPath,
      isPublicRepo: $isPublicRepo
    }) {
      id, orgId, name, version, createdDate, handler, region,
      description, defaultDeploymentPipelineId, deploymentPipelineIds,
      type, updatedAt
    }
  }`;

export async function fetchProjects(orgId: number): Promise<GqlProject[]> {
  return gql<{ projects: GqlProject[] }>(PROJECTS_QUERY, { orgId }).then((d) => d.projects);
}

export async function fetchProject(orgId: number, projectId: string): Promise<GqlProject> {
  return gql<{ project: GqlProject }>(PROJECT_QUERY, { orgId, projectId }).then((d) => d.project);
}

export async function fetchProjectByHandler(orgId: number, projectHandler: string): Promise<GqlProject> {
  return gql<{ projectByHandler: GqlProject }>(PROJECT_BY_HANDLER_QUERY, { orgId, projectHandler }).then((d) => d.projectByHandler);
}

export async function fetchProjectContributors(orgId: number, projectId: string): Promise<ProjectContributor[]> {
  return gql<{ project: { projectContributorsData: { contributorCount: number; contributors: ProjectContributor[] } } }>(PROJECT_CONTRIBUTORS_QUERY, { orgId, projectId })
    .then((d) => d.project?.projectContributorsData?.contributors ?? [])
    .catch(() => []);
}

export async function fetchProjectComponentLabels(orgId: number, projectId: string): Promise<string[]> {
  return gql<{ projectComponentLabels: string[] }>(PROJECT_COMPONENT_LABELS_QUERY, { projectId, orgId }).then((d) => d.projectComponentLabels ?? []);
}

export async function fetchProjectHandlerAvailability(orgId: number, candidate: string): Promise<ProjectHandlerAvailability> {
  return gql<{ projectHandlerAvailability: ProjectHandlerAvailability }>(PROJECT_HANDLER_AVAILABILITY_QUERY, { orgId, projectHandlerCandidate: candidate }).then((d) => d.projectHandlerAvailability);
}

export async function createProject(input: CreateProjectInput): Promise<GqlProject> {
  const orgId = window.API_CONFIG.asgardeoOrgNumericId;
  if (orgId === undefined || !Number.isFinite(orgId)) {
    return Promise.reject(new Error('API_CONFIG.asgardeoOrgNumericId is missing or invalid; cannot create project without a valid organization numeric ID'));
  }
  return gql<{ createProject: GqlProject }>(CREATE_PROJECT, {
    name: input.name,
    description: input.description,
    projectHandler: input.handler,
    orgHandler: input.orgHandler,
    orgId,
  }).then((d) => d.createProject);
}

export async function createMonoRepoProject(input: CreateMonoRepoProjectInput): Promise<GqlProject> {
  const orgId = window.API_CONFIG.asgardeoOrgNumericId;
  if (orgId === undefined || !Number.isFinite(orgId)) {
    return Promise.reject(new Error('API_CONFIG.asgardeoOrgNumericId is missing or invalid; cannot create mono-repo project without a valid organization numeric ID'));
  }
  return gql<{ createProject: GqlProject }>(CREATE_MONO_REPO_PROJECT, {
    name: input.name,
    description: input.description,
    projectHandler: input.handler,
    orgHandler: input.orgHandler,
    orgId,
    repository: input.repository,
    gitOrganization: input.gitOrganization,
    branch: input.branch,
    directoryPath: input.directoryPath,
    gitProvider: input.gitProvider,
    isPublicRepo: input.isPublicRepo,
  }).then((d) => d.createProject);
}
