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
 * API Contracts — the single source of truth that every product implementation
 * (`wip/`, `cloud/`, `icp/`) must satisfy.
 *
 * Each `<product>/_check.ts` performs a compile-time assertion that its module
 * exports conform to these interfaces, so any drift surfaces as a TypeScript
 * error during `tsc`/`vite build`.
 *
 * Rules:
 *  - Every interface member maps 1-to-1 to an exported function in the
 *    matching `src/api/<product>/<domain>.ts` file.
 *  - All return/parameter types come from `src/types/*` so the hooks and UI
 *    layers never depend on a product-specific type.
 *  - Pure synchronous utilities (e.g. data normalizers) belong in the product
 *    files but stay out of these contracts — only async/API surface is pinned.
 */

import type { AlertComponentType } from '../constants/alerts';
import type { AlertHistoryResponse, AlertRule, AlertRuleCountUsage } from '../types/alerts';
import type { ApimApiInfo, GeneratedTestKey, DeploySettingsV2Payload, LifecycleState, LifecycleHistory } from '../types/apim';
import type { GqlArtifactType, GqlArtifact, GqlArtifactParam, ArtifactStatusInput, ListenerStateInput, ArtifactToggleStatusInput, ArtifactToggleKind, TriggerTaskInput } from '../types/artifact';
import type { User, Role, RoleDetail, Group, GroupRoleMapping, GroupUser, PermissionsResponse, RoleGroupMapping, UserPermissionsResponse } from '../types/auth';
import type { BuildRunLogs, DeployComponentInput, UpdateBuildpackConfigsInput } from '../types/build';
import type { ContainerRegistry } from '../types/cloudEditor';
import type { GqlComponent, GqlComponentDetail, GqlEndpoint, GqlEnvEndpoint, CreateComponentInput, UpdateComponentInput, UpdateAutoDeployInput, GenerateComponentEndpointsInput, ComponentNameAvailability, DeleteComponentResult } from '../types/component';
import type { CertGroup, CertMapping, SchemaConfigData, ConfigMgtData, SchemaConfigItem, SaveSchemaConfigInput, PostConfigMgtInput } from '../types/configuration';
import type { GqlComponentDeployment, GqlDeploymentStatus, GqlReleaseMgtDeployment, GqlDeploymentTrackImage, DeployDeploymentTrackInput, PromoteInput, StopDeploymentInput, DeployPrebuiltImageInput } from '../types/deployment';
import type { GqlEnvironment, CloudDataPlane, EnvironmentInput } from '../types/environment';
import type { GqlExecutionConfigs, TaskExecution, ExecutionLogEntry, ExecutionArgument, UpdateJobConfigsInput, TriggerComponentInput } from '../types/executions';
import type { InsightsEnvironment, ComponentInsights } from '../types/insights';
import type { LogsRequest, ComponentLogsRequest, LogRow } from '../types/logs';
import type { ApiDocument, RuleAdherenceResponse, ThrottlingPolicy } from '../types/marketplace';
import type { OrgEntry, OrgComponentLimits, OrgSubscription, RegisterUserResponse } from '../types/org';
import type { PrebuiltIntegration, PrebuiltIntegrationsData, PrebuiltComponentRef, PrebuiltEnvironmentRef } from '../types/prebuilt';
import type { GqlProject, ProjectContributor, ProjectHandlerAvailability, CreateProjectInput, CreateMonoRepoProjectInput } from '../types/project';
import type { GqlRepository, GqlCommit, GqlUserRepo, GqlRepoBranch, GqlRepoMetadata, RepoTreeNode, ChoreoSampleImageEntry } from '../types/repository';
import type { Sample } from '../types/samples';

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export interface AlertsApi {
  getAlertRulesCount(baseUrl: string, componentId: string, environmentId: string, componentType: AlertComponentType): Promise<AlertRuleCountUsage>;
  getAlertRules(baseUrl: string, componentId: string, environmentId: string, componentType: AlertComponentType): Promise<AlertRule[]>;
  createAlertRule(baseUrl: string, alertRule: AlertRule): Promise<void>;
  updateAlertRule(baseUrl: string, alertRule: AlertRule): Promise<void>;
  deleteAlertRule(baseUrl: string, alertRule: AlertRule): Promise<void>;
  getAlertHistory(baseUrl: string, componentId: string, environmentId: string, startTime: string, endTime: string, limit?: number, versionIdList?: string[], alertTypes?: string[], searchPhrase?: string): Promise<AlertHistoryResponse>;
}

// ---------------------------------------------------------------------------
// APIM
// ---------------------------------------------------------------------------

export interface ApimApi {
  fetchApimApi(apimId: string): Promise<ApimApiInfo | null>;
  updateApimApi(apimId: string, body: ApimApiInfo): Promise<ApimApiInfo>;
  generateTestKey(apimId: string, keyType: 'Development' | 'Production'): Promise<GeneratedTestKey | null>;
  deploySettingsV2(componentId: string, versionId: string, payload: DeploySettingsV2Payload): Promise<void>;
  fetchLifecycleState(apimId: string): Promise<LifecycleState | null>;
  fetchLifecycleHistory(apimId: string): Promise<LifecycleHistory | null>;
  changeLifecycleState(apimId: string, action: string): Promise<LifecycleState>;
  fetchApimSwagger(apimRevisionId: string): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Artifact toggle mutations
// ---------------------------------------------------------------------------

export interface ArtifactToggleMutationsApi {
  updateArtifactToggleStatus(kind: ArtifactToggleKind, input: ArtifactToggleStatusInput): Promise<{ status: string; message: string }>;
}

// ---------------------------------------------------------------------------
// Artifacts
// ---------------------------------------------------------------------------

export interface ArtifactsApi {
  fetchArtifactTypes(componentId: string, envId: string): Promise<GqlArtifactType[]>;
  fetchArtifacts(artifactType: string, envId: string, componentId: string): Promise<GqlArtifact[]>;
  fetchArtifactSource(envId: string, componentId: string, artifactType: string, artifactName: string): Promise<string>;
  fetchLocalEntryValue(componentId: string, entryName: string, envId: string): Promise<string>;
  fetchArtifactParams(componentId: string, artifactType: string, artifactName: string, envId: string, runtimeId?: string): Promise<GqlArtifactParam[]>;
  fetchArtifactWsdl(componentId: string, artifactType: string, artifactName: string, envId: string, runtimeId?: string): Promise<string>;
  updateArtifactStatus(input: ArtifactStatusInput): Promise<{ status: string; message: string }>;
  updateListenerState(input: ListenerStateInput): Promise<{ success: boolean; message: string; commandIds: string[] }>;
}

// ---------------------------------------------------------------------------
// Auth — permissions, users, roles, groups
// ---------------------------------------------------------------------------

export interface AuthApi {
  fetchOrgPermissions(orgHandle: string, userId: string): Promise<UserPermissionsResponse>;
  fetchProjectPermissions(orgHandle: string, userId: string, projectId: string): Promise<UserPermissionsResponse>;
  fetchComponentPermissions(orgHandle: string, userId: string, projectId: string, componentId: string): Promise<UserPermissionsResponse>;
  fetchCurrentUser(orgHandler: string, userId: string): Promise<User>;
  fetchUsers(orgHandler: string): Promise<User[]>;
  changePassword(input: { currentPassword: string; newPassword: string }): Promise<{ message: string }>;
  forceChangePassword(input: { newPassword: string }): Promise<{ message: string }>;
  resetPassword(orgHandler: string, userId: string): Promise<{ password: string; message: string }>;
  revokeUserTokens(orgHandler: string, userId: string): Promise<{ message: string }>;
  unlockAccount(orgHandler: string, userId: string): Promise<{ message: string }>;
  createUser(orgHandler: string, input: { username: string; displayName: string; password: string }): Promise<unknown>;
  updateUser(orgHandler: string, input: { userId: string; displayName: string; groupIds: string[] }): Promise<unknown>;
  updateUserGroups(orgHandler: string, input: { userId: string; groupIds: string[] }): Promise<unknown>;
  deleteUser(orgHandler: string, userId: string): Promise<unknown>;
  fetchRoles(orgHandler: string, projectId?: string, integrationId?: string): Promise<Role[]>;
  fetchRoleDetail(orgHandler: string, roleId: string, projectId?: string, integrationId?: string): Promise<RoleDetail>;
  fetchAllPermissions(): Promise<PermissionsResponse>;
  createRole(orgHandler: string, input: { roleName: string; description: string; permissionIds: string[] }): Promise<unknown>;
  updateRole(orgHandler: string, input: { roleId: string; roleName: string; description: string; permissionIds: string[] }): Promise<unknown>;
  deleteRole(orgHandler: string, roleId: string): Promise<unknown>;
  fetchRoleGroups(orgHandler: string, roleId: string, projectId?: string, integrationId?: string): Promise<RoleGroupMapping[]>;
  fetchGroups(orgHandler: string, projectId?: string, integrationId?: string): Promise<Group[]>;
  createGroup(orgHandler: string, input: { groupName: string; description: string }): Promise<unknown>;
  updateGroup(orgHandler: string, input: { groupId: string; groupName: string; description: string }): Promise<unknown>;
  deleteGroup(orgHandler: string, groupId: string): Promise<unknown>;
  fetchGroupRoles(orgHandler: string, groupId: string, projectId?: string, integrationId?: string): Promise<GroupRoleMapping[]>;
  fetchGroupUsers(orgHandler: string, groupId: string): Promise<GroupUser[]>;
  addRolesToGroup(orgHandler: string, input: { groupId: string; roleIds: string[]; envUuid?: string }, projectId?: string, componentId?: string): Promise<unknown>;
  removeRoleFromGroup(orgHandler: string, input: { groupId: string; mappingId: number }): Promise<unknown>;
  addUsersToGroup(orgHandler: string, input: { groupId: string; userIds: string[] }): Promise<unknown>;
  removeUserFromGroup(orgHandler: string, input: { groupId: string; userId: string }): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Builds
// ---------------------------------------------------------------------------

export interface BuildsApi {
  fetchBuildRunLogs(orgHandler: string, projectId: string, componentId: string, runId: string): Promise<BuildRunLogs | null>;
  fetchBuildLogs(componentId: string, versionId: string, workflowName: string): Promise<BuildRunLogs | null>;
}

// ---------------------------------------------------------------------------
// Cloud Editor
// ---------------------------------------------------------------------------

export interface CloudEditorApi {
  getOrCreateSampleRegistry(orgUuid: string): Promise<ContainerRegistry>;
  callCreateCodeServer(params: { userId: string; organizationId: string; projectId: string; componentId: string; orgHandle: string; imageUrl: string; registryId: string; sourceCommitHash?: string }): Promise<string>;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export interface ComponentsApi {
  fetchComponents(orgHandler: string, projectId: string): Promise<GqlComponent[]>;
  fetchComponentByHandler(projectId: string, componentHandler: string): Promise<GqlComponentDetail>;
  fetchComponentEndpoints(componentId: string, versionId: string): Promise<GqlEndpoint[]>;
  createComponent(input: CreateComponentInput): Promise<GqlComponent>;
  deleteComponent(input: { orgHandler: string; componentId: string; projectId: string }): Promise<DeleteComponentResult>;
  updateComponent(input: UpdateComponentInput): Promise<GqlComponent>;
  updateAutoDeployEnabled(input: UpdateAutoDeployInput): Promise<{ id: string; autoDeployEnabled: boolean }>;
  generateComponentEndpoints(input: GenerateComponentEndpointsInput): Promise<GqlEnvEndpoint[]>;
  fetchComponentNameAvailability(projectId: string, componentNameCandidate: string): Promise<ComponentNameAvailability>;
  fetchComponentEndpointSpec(componentId: string, versionId: string, endpointId: string): Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface ConfigurationApi {
  fetchCertificateGroups(projectId: string, componentId: string): Promise<CertGroup[]>;
  fetchConfigGroups(projectId: string, componentId: string): Promise<CertGroup[]>;
  fetchCertificateMappings(projectId: string, componentId: string, envId: string, deploymentTrackId: string): Promise<CertMapping | null>;
  fetchSchemaConfig(projectId: string, componentId: string, envId: string, deploymentTrackId: string, commitHash?: string): Promise<SchemaConfigData | null>;
  fetchConfigMgt(orgHandler: string, projectId: string, componentId: string, envId: string, versionId: string, componentName: string, commitHash?: string): Promise<ConfigMgtData>;
  saveSchemaConfig(input: SaveSchemaConfigInput): Promise<{ configurations: SchemaConfigItem[] }>;
  postConfigMgt(input: PostConfigMgtInput): Promise<unknown>;
  postCertificateMappings(data: CertMapping): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Copilot
// ---------------------------------------------------------------------------

export interface CopilotApi {
  getAiCopilotAnswer(copilotUrl: string, nlQuery: string, abortSignal: AbortSignal, correlationId: string, chatContext?: Record<string, unknown>): Promise<Response>;
  provideCopilotFeedback(orgId: string, feedback: boolean, correlationId: string): Promise<void>;
  getCopilotDataCollectionPermission(orgId: string): Promise<{ status: string }>;
  updateCopilotDataCollectionPermission(orgId: string, disabled: boolean): Promise<void>;
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
  triggerBuild(input: DeployComponentInput): Promise<{ message: string; success: boolean }>;
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
// Executions
// ---------------------------------------------------------------------------

export interface ExecutionsApi {
  fetchExecutionConfigs(componentId: string, releaseId: string): Promise<GqlExecutionConfigs | null>;
  fetchTaskExecutions(releaseId: string): Promise<TaskExecution[]>;
  fetchExecutionArguments(runId: string, componentId: string, releaseId: string): Promise<ExecutionArgument[]>;
  fetchExecutionLogs(componentId: string, deploymentTrackId: string, executionId: string, environmentId: string): Promise<ExecutionLogEntry[]>;
  fetchTaskExecutionCount(releaseId: string): Promise<number | null>;
  updateJobConfigs(input: UpdateJobConfigsInput): Promise<boolean>;
  triggerTask(input: TriggerTaskInput): Promise<{ status: string; message: string; successCount: number; failedCount: number; details: string[] }>;
  triggerComponentRun(input: TriggerComponentInput): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

export interface InsightsApi {
  fetchInsightsEnvironments(orgUuid: string, projectId: string): Promise<InsightsEnvironment[]>;
  fetchComponentInsights(orgUuid: string, insightsEnv: InsightsEnvironment, apiId: string): Promise<ComponentInsights | null>;
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export interface LogsApi {
  fetchLogs(req: LogsRequest, logsApiUrl: string): Promise<LogRow[]>;
  fetchComponentLogs(req: ComponentLogsRequest, logsApiUrl: string): Promise<LogRow[]>;
}

// ---------------------------------------------------------------------------
// Marketplace
// ---------------------------------------------------------------------------

export interface MarketplaceApi {
  fetchThrottlingPolicies(): Promise<ThrottlingPolicy[]>;
  fetchApiDocuments(apimId: string): Promise<ApiDocument[]>;
  fetchRuleAdherence(projectId: string, componentId: string, apimId: string): Promise<RuleAdherenceResponse | null>;
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
// Prebuilt integrations
// ---------------------------------------------------------------------------

export interface PrebuiltApi {
  fetchPrebuiltIntegrations(url: string, signal?: AbortSignal): Promise<{ prebuiltIntegrations: PrebuiltIntegration[] }>;
  fetchPrebuiltAsset(baseUrl: string, filename: string, signal?: AbortSignal): Promise<Response>;
  checkNameAvailability(projectId: string, candidate: string): Promise<string>;
  fetchComponentDetail(projectId: string, handler: string): Promise<PrebuiltComponentRef>;
  fetchFirstEnvironment(orgUuid: string, projectId: string): Promise<PrebuiltEnvironmentRef>;
  fetchLatestCommitSha(componentId: string, branch: string): Promise<string>;
  savePrebuiltConfig(projectId: string, componentId: string, envId: string, deploymentTrackId: string, configurations: SchemaConfigItem[], commitHash: string): Promise<void>;
  // Pure data normalizer — sync but lives in the same module surface.
  normalizePrebuiltIntegrations(raw: { prebuiltIntegrations: PrebuiltIntegration[] }): PrebuiltIntegrationsData;
}

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
// Repository
// ---------------------------------------------------------------------------

export interface RepositoryApi {
  fetchComponentRepository(projectId: string, componentHandler: string): Promise<GqlRepository | null>;
  fetchCommitHistory(componentId: string, branch: string): Promise<GqlCommit[]>;
  fetchGitHubUserRepos(): Promise<GqlUserRepo[]>;
  fetchRepoBranches(repoOrg: string, repoName: string, isPublicRepo: boolean): Promise<GqlRepoBranch[]>;
  fetchRepoMetadata(org: string, repo: string, branch: string, subPath: string, isPublicRepo?: boolean): Promise<GqlRepoMetadata>;
  fetchChoreoSampleImages(orgUuid: string, projectId: string): Promise<ChoreoSampleImageEntry[]>;
  updateBuildpackConfigs(input: UpdateBuildpackConfigsInput): Promise<string>;
  obtainGithubToken(authorizationCode: string): Promise<{ success: boolean; message: string }>;
  fetchRepoContents(org: string, repo: string, branch: string, isPublicRepo?: boolean): Promise<RepoTreeNode[]>;
}

// ---------------------------------------------------------------------------
// Samples
// ---------------------------------------------------------------------------

export interface SamplesApi {
  fetchSamples(url: string, signal?: AbortSignal): Promise<{ samples: Sample[] }>;
}

// ---------------------------------------------------------------------------
// Aggregate — the full API surface consumed by the app
// ---------------------------------------------------------------------------

export interface AppApi {
  alerts: AlertsApi;
  apim: ApimApi;
  artifactToggleMutations: ArtifactToggleMutationsApi;
  artifacts: ArtifactsApi;
  auth: AuthApi;
  builds: BuildsApi;
  cloudEditor: CloudEditorApi;
  components: ComponentsApi;
  configuration: ConfigurationApi;
  copilot: CopilotApi;
  deployments: DeploymentsApi;
  environments: EnvironmentsApi;
  executions: ExecutionsApi;
  insights: InsightsApi;
  logs: LogsApi;
  marketplace: MarketplaceApi;
  org: OrgApi;
  prebuilt: PrebuiltApi;
  projects: ProjectsApi;
  repository: RepositoryApi;
  samples: SamplesApi;
}
