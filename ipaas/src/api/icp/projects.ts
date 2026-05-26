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

import type { GqlProject, ProjectContributor, ProjectHandlerAvailability, CreateProjectInput, CreateMonoRepoProjectInput } from '../../types/project';

const ni = (name: string): never => { throw new Error(`[icp] projects.${name}: not implemented`); };

export const fetchProjects = (_orgId: number): Promise<GqlProject[]> => ni('fetchProjects');
export const fetchProject = (_orgId: number, _projectId: string): Promise<GqlProject> => ni('fetchProject');
export const fetchProjectByHandler = (_orgId: number, _projectHandler: string): Promise<GqlProject> => ni('fetchProjectByHandler');
export const fetchProjectContributors = (_orgId: number, _projectId: string): Promise<ProjectContributor[]> => ni('fetchProjectContributors');
export const fetchProjectComponentLabels = (_orgId: number, _projectId: string): Promise<string[]> => ni('fetchProjectComponentLabels');
export const fetchProjectHandlerAvailability = (_orgId: number, _candidate: string): Promise<ProjectHandlerAvailability> => ni('fetchProjectHandlerAvailability');
export const createProject = (_input: CreateProjectInput): Promise<GqlProject> => ni('createProject');
export const createMonoRepoProject = (_input: CreateMonoRepoProjectInput): Promise<GqlProject> => ni('createMonoRepoProject');
