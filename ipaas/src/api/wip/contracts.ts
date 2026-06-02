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

/**
 * API Contracts — build-time product gating
 *
 * Each interface below defines the function signatures that a product's API
 * implementation must satisfy.  The devant (current), cloud, and icp
 * implementations each live in `src/api/<product>/` and are selected at build
 * time via the `#api` Vite alias, with per-domain re-exports in `src/api/<domain>.ts`.
 *
 * Rules:
 *  - Every interface member maps 1-to-1 to a function in the corresponding
 *    `src/api/*.ts` file so that the devant implementation is just a thin
 *    re-export (no refactoring required).
 *  - All return / parameter types are imported from `src/types/*` so that
 *    the shared UI layer never depends on a product-specific type.
 */

import type { GqlComponent, GqlComponentDetail, GqlEndpoint, GqlEnvEndpoint, CreateComponentInput, UpdateComponentInput, UpdateAutoDeployInput, GenerateComponentEndpointsInput, ComponentNameAvailability } from '../../types/component';
import type { GqlProject, ProjectContributor, ProjectHandlerAvailability, CreateProjectInput, CreateMonoRepoProjectInput } from '../../types/project';
import type { GqlEnvironment, CloudDataPlane, EnvironmentInput } from '../../types/environment';
import type { GqlComponentDeployment, GqlDeploymentStatus, GqlReleaseMgtDeployment, GqlDeploymentTrackImage, DeployDeploymentTrackInput, PromoteInput, StopDeploymentInput, DeployPrebuiltImageInput } from '../../types/deployment';
import type { OrgEntry, OrgComponentLimits, OrgSubscription, RegisterUserResponse } from '../../types/org';
import type { BuildRunLogs } from '../../types/build';

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export interface ProjectsApi {
  fetchProjects(orgId: number): Promise<GqlProject[]>;
  fetchProject(orgId: number, projectId: string): Promise<GqlProject>;
  fetchProjectByHandler(orgId: number, projectHandler: string): Promise<GqlProject>;
  fetchProjectContributors(orgId: number, projectId: string): Promise<ProjectContributor[]>;
  fetchProjectComponentLabels(orgId: number, projectId: string): Promise<string[]>;
  fetchProjectHandlerAvailability(orgId: number, candidate: string): Promise<ProjectHandlerAvailability>;
  createProject(input: CreateProjectInput): Promise<GqlProject>;
  createMonoRepoProject(input: CreateMonoRepoProjectInput): Promise<GqlProject>;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export interface ComponentsApi {
  fetchComponents(orgHandler: string, projectId: string): Promise<GqlComponent[]>;
  fetchComponentByHandler(projectId: string, componentHandler: string): Promise<GqlComponentDetail>;
  fetchComponentEndpoints(componentId: string, versionId: string): Promise<GqlEndpoint[]>;
  createComponent(input: CreateComponentInput): Promise<GqlComponent>;
  deleteComponent(input: { orgHandler: string; componentId: string; projectId: string }): Promise<{ success: boolean }>;
  updateComponent(input: UpdateComponentInput): Promise<GqlComponent>;
  updateAutoDeployEnabled(input: UpdateAutoDeployInput): Promise<{ id: string; autoDeployEnabled: boolean }>;
  generateComponentEndpoints(input: GenerateComponentEndpointsInput): Promise<GqlEnvEndpoint[]>;
  fetchComponentNameAvailability(projectId: string, componentNameCandidate: string): Promise<ComponentNameAvailability>;
  fetchComponentEndpointSpec(componentId: string, versionId: string, endpointId: string): Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Deployments
// ---------------------------------------------------------------------------

export interface DeploymentsApi {
  fetchComponentDeployment(orgHandler: string, orgUuid: string, componentId: string, versionId: string, environmentId: string): Promise<GqlComponentDeployment | null>;
  fetchEnvEndpoints(componentId: string, versionId: string, releaseId: string): Promise<GqlEnvEndpoint[]>;
  fetchDeploymentStatus(componentId: string, versionId: string): Promise<GqlDeploymentStatus[]>;
  fetchReleaseMgtDeployments(orgUuid: string, projectId: string, componentId: string, versionId: string, environmentId: string): Promise<GqlReleaseMgtDeployment[]>;
  fetchDeploymentTrackImages(componentId: string, versionId: string): Promise<GqlDeploymentTrackImage[]>;
  deployDeploymentTrack(input: DeployDeploymentTrackInput): Promise<string>;
  triggerBuild(input: { orgHandler: string; projectId: string; componentId: string; versionId: string; branch: string; commitId?: string }): Promise<{ message: string; success: boolean }>;
  promote(input: PromoteInput): Promise<string>;
  stopDeployment(input: StopDeploymentInput): Promise<string>;
  redeployDeployment(input: { orgHandler: string; componentId: string; releaseId: string; type: string; releaseMgtReleaseId?: string; releaseMgtDeploymentId?: string }): Promise<string>;
  deployPrebuiltImage(input: DeployPrebuiltImageInput): Promise<string>;
}

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------

export interface EnvironmentsApi {
  fetchEnvironments(orgUuid: string, projectId: string): Promise<GqlEnvironment[]>;
  fetchAllEnvironments(): Promise<GqlEnvironment[]>;
  fetchCloudDataPlanes(orgUuid: string): Promise<CloudDataPlane[]>;
  createEnvironment(input: EnvironmentInput): Promise<GqlEnvironment>;
  updateEnvironment(input: EnvironmentInput & { environmentId: string }): Promise<GqlEnvironment>;
  deleteEnvironment(environmentId: string): Promise<string>;
}

// ---------------------------------------------------------------------------
// Org
// ---------------------------------------------------------------------------

export interface OrgApi {
  fetchOrgList(): Promise<OrgEntry[]>;
  fetchOrgs(): Promise<OrgEntry[]>;
  validateOrgName(orgName: string): Promise<boolean>;
  registerUser(orgName: string, termsAccepted: boolean, serviceName: string): Promise<RegisterUserResponse>;
  initOrg(orgUuid: string, region: string): Promise<void>;
  fetchProjectsByOrgId(orgNumericId: number): Promise<GqlProject[]>;
  createDefaultProject(orgNumericId: number, orgHandler: string, projectHandler?: string): Promise<{ id: string; handler: string }>;
  fetchOrgComponentLimits(orgUuid: string): Promise<OrgComponentLimits>;
  fetchOrgSubscriptions(orgUuid: string): Promise<OrgSubscription[]>;
}

// ---------------------------------------------------------------------------
// Builds
// ---------------------------------------------------------------------------

export interface BuildsApi {
  fetchBuildRunLogs(orgHandler: string, projectId: string, componentId: string, runId: string): Promise<BuildRunLogs | null>;
  fetchBuildLogs(componentId: string, versionId: string, workflowName: string): Promise<BuildRunLogs | null>;
}

// ---------------------------------------------------------------------------
// Aggregate — the full API surface consumed by the app
// ---------------------------------------------------------------------------

export interface AppApi {
  projects: ProjectsApi;
  components: ComponentsApi;
  deployments: DeploymentsApi;
  environments: EnvironmentsApi;
  org: OrgApi;
  builds: BuildsApi;
}
