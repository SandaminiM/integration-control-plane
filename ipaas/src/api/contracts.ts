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
import type { ArtifactType, Artifact, ArtifactParam, ArtifactStatusInput, ListenerStateInput, ArtifactToggleStatusInput, ArtifactToggleKind, TriggerTaskInput } from '../types/artifact';
import type {
  User,
  Role,
  RoleDetail,
  Group,
  GroupRoleMapping,
  GroupUser,
  PermissionsResponse,
  RoleGroupMapping,
  UserPermissionsResponse,
  ChangePasswordInput,
  ForceChangePasswordInput,
  CreateUserInput,
  UpdateUserInput,
  UpdateUserGroupsInput,
  CreateRoleInput,
  UpdateRoleInput,
  CreateGroupInput,
  UpdateGroupInput,
  AddRolesToGroupInput,
  RemoveRoleFromGroupInput,
  AddUsersToGroupInput,
  RemoveUserFromGroupInput,
  MessageResult,
  ResetPasswordResult,
  PendingInvitation,
  InviteUsersInput,
} from '../types/auth';
import type { BuildRunLogs, DeployComponentInput, UpdateBuildpackConfigsInput } from '../types/build';
import type { ContainerRegistry } from '../types/cloudEditor';
import type {
  Component,
  ComponentDetail,
  Endpoint,
  EnvEndpoint,
  CreateComponentInput,
  UpdateComponentInput,
  UpdateAutoDeployInput,
  GenerateComponentEndpointsInput,
  ComponentNameAvailability,
  DeleteComponentResult,
  DeploymentTrack,
  CreateDeploymentTrackInput,
  DeleteTrackResult,
  CheckDeletableResult,
} from '../types/component';
import type { CertGroup, CertMapping, SchemaConfigData, ConfigMgtData, SchemaConfigItem, SaveSchemaConfigInput, PostConfigMgtInput } from '../types/configuration';
import type { ComponentDeployment, BuildRun, ReleaseMgtDeployment, DeploymentTrackImage, DeployDeploymentTrackInput, PromoteInput, StopDeploymentInput, DeployPrebuiltImageInput } from '../types/deployment';
import type { CreateDeploymentPipelineRequest, DeploymentPipeline, EnvTemplate, PipelineDeletionEligibility } from '../types/deploymentPipeline';
import type { OnPremKey, OnPremKeySubscription } from '../types/onPremKey';
import type { EgressPolicy, EgressPolicyRequest } from '../types/egressPolicy';
import type { AuthzRole, CreateAuthzRoleInput, UpdateAuthzRoleInput } from '../types/projectAuthz';
import type { ByoiEndpointFileContents, CreateByoiComponentInput, CreateByoiComponentResult, DevopsVolume, DevopsVolumeMount, VolumeMountWriteData, VolumeWriteData } from '../types/tailscale';
import type { ConfigMapWriteData, ConfigMountPath, ConfigMountWriteData, DevopsConfigMap, DevopsConfigMapDetails, DevopsConfigMount, DevopsSecret, DevopsSecretDetails, ReleaseDetails, SecretWriteData } from '../types/devopsConfigs';
import type { CreateUrlMappingInput, CustomDomain, CustomDomainType, CustomUrlMapping } from '../types/customDomain';
import type { OrgWorkflowConfig, WorkflowConfigRequest, WorkflowDefinition } from '../types/workflow';
import type { Dataplane, IdentityProvider, IdentityProviderRequest, RoleGroupMappingResponse } from '../types/appSecurity';
import type { CreateGitCredentialInput, CredentialDeleteEligibility, GitCredential } from '../types/credentials';
import type { Environment, CloudDataPlane, EnvironmentInput } from '../types/environment';
import type { ExecutionConfigs, TaskExecution, ExecutionLogEntry, ExecutionArgument, UpdateJobConfigsInput, TriggerComponentInput, TriggerRunResult, RuntimeArgument } from '../types/executions';
import type { SubscriptionList, ComponentLimits } from '../types/subscription';
import type { InsightsEnvironment, ComponentInsights } from '../types/insights';
import type { LogsRequest, ComponentLogsRequest, LogRow } from '../types/logs';
import type { ApiDocument, RuleAdherenceResponse, ThrottlingPolicy } from '../types/marketplace';
import type { CreateMcpApiInput, CreatedMcpApi, McpFeatureOperation, McpProxyMetadata, CreateMcpProxyComponentInput } from '../types/mcpProxy';
import type { OrgEntry, OrgComponentLimits, OrgSubscription, RegisterUserResponse } from '../types/org';
import type { PrebuiltIntegrationsData, PrebuiltComponentRef, PrebuiltEnvironmentRef } from '../types/prebuilt';
import type { Project, ProjectContributor, ProjectHandlerAvailability, CreateProjectInput, CreateMonoRepoProjectInput, UpdateProjectInput } from '../types/project';
import type { Repository, Commit, UserRepo, RepoBranch, RepoMetadata, RepoTreeNode, ChoreoSampleImageEntry } from '../types/repository';
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
  deleteApimApi(apimId: string): Promise<void>;
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
  fetchArtifactTypes(componentId: string, envId: string): Promise<ArtifactType[]>;
  fetchArtifacts(artifactType: string, envId: string, componentId: string): Promise<Artifact[]>;
  fetchArtifactSource(envId: string, componentId: string, artifactType: string, artifactName: string): Promise<string>;
  fetchLocalEntryValue(componentId: string, entryName: string, envId: string): Promise<string>;
  fetchArtifactParams(componentId: string, artifactType: string, artifactName: string, envId: string, runtimeId?: string): Promise<ArtifactParam[]>;
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
  changePassword(input: ChangePasswordInput): Promise<MessageResult>;
  forceChangePassword(input: ForceChangePasswordInput): Promise<MessageResult>;
  resetPassword(orgHandler: string, userId: string): Promise<ResetPasswordResult>;
  revokeUserTokens(orgHandler: string, userId: string): Promise<MessageResult>;
  unlockAccount(orgHandler: string, userId: string): Promise<MessageResult>;
  createUser(orgHandler: string, input: CreateUserInput): Promise<unknown>;
  updateUser(orgHandler: string, input: UpdateUserInput): Promise<unknown>;
  updateUserGroups(orgHandler: string, input: UpdateUserGroupsInput): Promise<unknown>;
  deleteUser(orgHandler: string, userId: string): Promise<unknown>;
  fetchPendingInvitations(orgHandler: string): Promise<PendingInvitation[]>;
  inviteUsers(orgHandler: string, input: InviteUsersInput): Promise<unknown>;
  deleteInvitation(orgHandler: string, invitationId: string): Promise<unknown>;
  fetchRoles(orgHandler: string, projectId?: string, integrationId?: string): Promise<Role[]>;
  fetchRoleDetail(orgHandler: string, roleId: string, projectId?: string, integrationId?: string): Promise<RoleDetail>;
  fetchAllPermissions(): Promise<PermissionsResponse>;
  createRole(orgHandler: string, input: CreateRoleInput): Promise<unknown>;
  updateRole(orgHandler: string, input: UpdateRoleInput): Promise<unknown>;
  deleteRole(orgHandler: string, roleId: string): Promise<unknown>;
  fetchRoleGroups(orgHandler: string, roleId: string, projectId?: string, integrationId?: string): Promise<RoleGroupMapping[]>;
  fetchGroups(orgHandler: string, projectId?: string, integrationId?: string): Promise<Group[]>;
  createGroup(orgHandler: string, input: CreateGroupInput): Promise<unknown>;
  updateGroup(orgHandler: string, input: UpdateGroupInput): Promise<unknown>;
  deleteGroup(orgHandler: string, groupId: string): Promise<unknown>;
  fetchGroupRoles(orgHandler: string, groupId: string, projectId?: string, integrationId?: string): Promise<GroupRoleMapping[]>;
  fetchGroupUsers(orgHandler: string, groupId: string): Promise<GroupUser[]>;
  addRolesToGroup(orgHandler: string, input: AddRolesToGroupInput, projectId?: string, componentId?: string): Promise<unknown>;
  removeRoleFromGroup(orgHandler: string, input: RemoveRoleFromGroupInput): Promise<unknown>;
  addUsersToGroup(orgHandler: string, input: AddUsersToGroupInput): Promise<unknown>;
  removeUserFromGroup(orgHandler: string, input: RemoveUserFromGroupInput): Promise<unknown>;
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
  fetchComponents(orgHandler: string, projectId: string): Promise<Component[]>;
  fetchComponentByHandler(projectId: string, componentHandler: string): Promise<ComponentDetail>;
  fetchComponentEndpoints(componentId: string, versionId: string): Promise<Endpoint[]>;
  createComponent(input: CreateComponentInput): Promise<Component>;
  deleteComponent(input: { orgHandler: string; componentId: string; projectId: string }): Promise<DeleteComponentResult>;
  updateComponent(input: UpdateComponentInput): Promise<Component>;
  updateAutoDeployEnabled(input: UpdateAutoDeployInput): Promise<{ id: string; autoDeployEnabled: boolean }>;
  generateComponentEndpoints(input: GenerateComponentEndpointsInput): Promise<EnvEndpoint[]>;
  fetchComponentNameAvailability(projectId: string, componentNameCandidate: string): Promise<ComponentNameAvailability>;
  fetchComponentEndpointSpec(componentId: string, versionId: string, endpointId: string): Promise<string | null>;
  createMcpProxyComponent(input: CreateMcpProxyComponentInput): Promise<Component>;
  createDeploymentTrack(input: CreateDeploymentTrackInput): Promise<DeploymentTrack>;
  deleteDeploymentTrack(input: { orgHandler: string; componentId: string; projectId: string; deploymentTrackId: string }): Promise<DeleteTrackResult>;
  checkDeploymentTrackDeletable(input: { orgHandler: string; componentId: string; projectId: string; deploymentTrackId: string }): Promise<CheckDeletableResult>;
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
  fetchComponentDeployment(orgHandler: string, orgUuid: string, componentId: string, versionId: string, environmentId: string): Promise<ComponentDeployment | null>;
  fetchEnvEndpoints(componentId: string, versionId: string, releaseId: string): Promise<EnvEndpoint[]>;
  fetchDeploymentStatus(componentId: string, versionId: string): Promise<BuildRun[]>;
  fetchReleaseMgtDeployments(orgUuid: string, projectId: string, componentId: string, versionId: string, environmentId: string): Promise<ReleaseMgtDeployment[]>;
  fetchDeploymentTrackImages(componentId: string, versionId: string): Promise<DeploymentTrackImage[]>;
  deployDeploymentTrack(input: DeployDeploymentTrackInput): Promise<string>;
  triggerBuild(input: DeployComponentInput): Promise<{ message: string; success: boolean }>;
  promote(input: PromoteInput): Promise<string>;
  stopDeployment(input: StopDeploymentInput): Promise<string>;
  redeployDeployment(input: { orgHandler: string; componentId: string; releaseId: string; type: string; releaseMgtReleaseId?: string; releaseMgtDeploymentId?: string }): Promise<string>;
  deployPrebuiltImage(input: DeployPrebuiltImageInput): Promise<string>;
}

// ---------------------------------------------------------------------------
// Deployment (CD) pipelines
// ---------------------------------------------------------------------------

export interface DeploymentPipelinesApi {
  fetchEnvTemplates(orgNumericId: number): Promise<EnvTemplate[]>;
  fetchOrgDeploymentPipelines(orgUuid: string): Promise<DeploymentPipeline[]>;
  fetchProjectDeploymentPipelines(orgUuid: string, projectId: string): Promise<DeploymentPipeline[]>;
  createDeploymentPipeline(orgUuid: string, input: CreateDeploymentPipelineRequest): Promise<DeploymentPipeline>;
  updateDeploymentPipeline(orgUuid: string, pipelineId: string, input: CreateDeploymentPipelineRequest): Promise<DeploymentPipeline>;
  deleteDeploymentPipeline(orgUuid: string, pipelineId: string): Promise<void>;
  fetchPipelineDeletionEligibility(orgUuid: string, pipelineId: string): Promise<PipelineDeletionEligibility>;
  updateProjectDeploymentPipelines(orgUuid: string, projectId: string, deploymentPipelineIds: string[]): Promise<string[]>;
  setDefaultProjectDeploymentPipeline(orgUuid: string, projectId: string, defaultDeploymentPipelineId: string): Promise<string>;
}

// ---------------------------------------------------------------------------
// On-prem keys
// ---------------------------------------------------------------------------

export interface OnPremKeysApi {
  fetchOnPremKeys(orgHandle: string): Promise<OnPremKey[]>;
  fetchOnPremKeySubscription(orgHandle: string): Promise<OnPremKeySubscription>;
  generateOnPremKey(orgHandle: string, displayName: string): Promise<OnPremKey>;
  regenerateOnPremKey(orgHandle: string, handle: string): Promise<OnPremKey>;
  renameOnPremKey(orgHandle: string, handle: string, displayName: string): Promise<OnPremKey>;
  revokeOnPremKey(orgHandle: string, handle: string): Promise<OnPremKey>;
}

// ---------------------------------------------------------------------------
// Application security (identity providers, role-group mappings, data planes)
// ---------------------------------------------------------------------------

export interface AppSecurityApi {
  fetchIdentityProviders(): Promise<IdentityProvider[]>;
  fetchIdentityProvider(id: string): Promise<IdentityProvider>;
  createIdentityProvider(input: IdentityProviderRequest): Promise<IdentityProvider>;
  updateIdentityProvider(id: string, input: IdentityProviderRequest): Promise<IdentityProvider>;
  deleteIdentityProvider(id: string): Promise<void>;
  fetchRoleGroupMappings(): Promise<RoleGroupMappingResponse>;
  updateRoleGroupMapping(roleId: string, groups: string[]): Promise<void>;
  fetchDataplanes(): Promise<Dataplane[]>;
}

// ---------------------------------------------------------------------------
// Credentials (git)
// ---------------------------------------------------------------------------

export interface CredentialsApi {
  fetchGitCredentials(): Promise<GitCredential[]>;
  createGitCredential(input: CreateGitCredentialInput): Promise<GitCredential>;
  checkGitCredentialDeletion(credentialId: string): Promise<CredentialDeleteEligibility>;
  deleteGitCredential(credentialId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Approval workflows
// ---------------------------------------------------------------------------

export interface WorkflowsApi {
  fetchWorkflowDefinitions(): Promise<WorkflowDefinition[]>;
  fetchWorkflowConfigs(): Promise<OrgWorkflowConfig[]>;
  createWorkflowConfig(input: WorkflowConfigRequest): Promise<OrgWorkflowConfig>;
  updateWorkflowConfig(configId: string, input: WorkflowConfigRequest): Promise<OrgWorkflowConfig>;
}

// ---------------------------------------------------------------------------
// Egress control
// ---------------------------------------------------------------------------

export interface EgressControlApi {
  fetchEgressPolicy(orgUuid: string, projectId?: string): Promise<EgressPolicy | null>;
  createEgressPolicy(orgUuid: string, input: EgressPolicyRequest, projectId?: string): Promise<EgressPolicy>;
  updateEgressPolicy(orgUuid: string, policyId: string, input: EgressPolicyRequest, projectId?: string): Promise<EgressPolicy>;
  deleteEgressPolicy(orgUuid: string, policyId: string, projectId?: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Project authorization (Application Security)
// ---------------------------------------------------------------------------

export interface ProjectAuthzApi {
  fetchAuthzRoles(projectId: string): Promise<AuthzRole[]>;
  createAuthzRole(projectId: string, input: CreateAuthzRoleInput): Promise<AuthzRole>;
  updateAuthzRole(projectId: string, input: UpdateAuthzRoleInput): Promise<AuthzRole>;
  deleteAuthzRole(roleId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Custom domains / URL mappings (URL Settings)
// ---------------------------------------------------------------------------

export interface CustomDomainsApi {
  fetchCustomDomains(type?: CustomDomainType): Promise<CustomDomain[]>;
  fetchComponentUrlMappings(componentId: string): Promise<CustomUrlMapping[]>;
  createUrlMapping(input: CreateUrlMappingInput): Promise<CustomUrlMapping>;
  updateUrlMapping(urlId: string, input: CreateUrlMappingInput): Promise<CustomUrlMapping>;
  deleteUrlMapping(urlId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Tailscale VPN (BYOI proxy create/config/deploy)
// ---------------------------------------------------------------------------

export interface TailscaleApi {
  getSampleRegistryId(orgUuid: string): Promise<string>;
  createByoiComponent(input: CreateByoiComponentInput): Promise<CreateByoiComponentResult>;
  deployByoiImage(componentId: string, releaseId: string, imageUrl: string): Promise<{ message: string; success: boolean }>;
  createVolume(orgUuid: string, projectId: string, data: VolumeWriteData): Promise<DevopsVolume>;
  mountVolume(orgUuid: string, projectId: string, path: { appId: string; appEnvId: string; containerId: string }, data: VolumeMountWriteData): Promise<DevopsVolumeMount>;
  getByoiEndpointsYaml(orgUuid: string, projectId: string, componentId: string, releaseId: string): Promise<ByoiEndpointFileContents>;
  updateByoiEndpointsYaml(orgUuid: string, projectId: string, componentId: string, releaseId: string, endpointsYaml: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Devops configs — ConfigMaps, Secrets, and container config-mounts
// ---------------------------------------------------------------------------

export interface DevopsConfigsApi {
  getReleaseById(orgUuid: string, projectId: string, componentId: string, releaseId: string): Promise<ReleaseDetails>;
  getSecrets(orgUuid: string, projectId: string, environmentId: string): Promise<DevopsSecret[]>;
  getSecretDetails(orgUuid: string, projectId: string, environmentId: string, secretId: string): Promise<DevopsSecretDetails>;
  createSecret(orgUuid: string, projectId: string, data: SecretWriteData): Promise<DevopsSecret>;
  updateSecret(orgUuid: string, projectId: string, secretId: string, data: SecretWriteData): Promise<DevopsSecret>;
  deleteSecret(orgUuid: string, projectId: string, environmentId: string, secretId: string): Promise<void>;
  getConfigMaps(orgUuid: string, projectId: string, environmentId: string): Promise<DevopsConfigMap[]>;
  getConfigMapDetails(orgUuid: string, projectId: string, environmentId: string, configMapId: string): Promise<DevopsConfigMapDetails>;
  createConfigMap(orgUuid: string, projectId: string, data: ConfigMapWriteData): Promise<DevopsConfigMap>;
  updateConfigMapData(orgUuid: string, projectId: string, configMapId: string, data: ConfigMapWriteData): Promise<DevopsConfigMapDetails>;
  deleteConfigMap(orgUuid: string, projectId: string, environmentId: string, configMapId: string): Promise<void>;
  getContainerConfigMounts(orgUuid: string, projectId: string, componentId: string, releaseId: string, containerId: string): Promise<DevopsConfigMount[]>;
  mountConfig(orgUuid: string, projectId: string, componentId: string, data: ConfigMountWriteData): Promise<DevopsConfigMount>;
  updateConfigMount(orgUuid: string, projectId: string, path: ConfigMountPath, data: Record<string, unknown>): Promise<DevopsConfigMount>;
  removeConfigMount(orgUuid: string, projectId: string, path: ConfigMountPath): Promise<void>;
}

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------

export interface EnvironmentsApi {
  fetchEnvironments(orgUuid: string, projectId: string): Promise<Environment[]>;
  fetchAllEnvironments(): Promise<Environment[]>;
  fetchCloudDataPlanes(orgUuid: string): Promise<CloudDataPlane[]>;
  createEnvironment(input: EnvironmentInput): Promise<Environment>;
  updateEnvironment(input: EnvironmentInput & { environmentId: string }): Promise<Environment>;
  deleteEnvironment(environmentId: string): Promise<string>;
}

// ---------------------------------------------------------------------------
// Executions
// ---------------------------------------------------------------------------

export interface ExecutionsApi {
  fetchExecutionConfigs(componentId: string, releaseId: string): Promise<ExecutionConfigs | null>;
  fetchTaskExecutions(releaseId: string): Promise<TaskExecution[]>;
  fetchRuntimeArguments(componentId: string, deploymentTrackId: string, commitHash: string): Promise<RuntimeArgument[]>;
  fetchExecutionArguments(runId: string, componentId: string, releaseId: string): Promise<ExecutionArgument[]>;
  fetchExecutionLogs(componentId: string, deploymentTrackId: string, executionId: string, environmentId: string): Promise<ExecutionLogEntry[]>;
  fetchTaskExecutionCount(releaseId: string): Promise<number | null>;
  updateJobConfigs(input: UpdateJobConfigsInput): Promise<boolean>;
  triggerTask(input: TriggerTaskInput): Promise<{ status: string; message: string; successCount: number; failedCount: number; details: string[] }>;
  triggerComponentRun(input: TriggerComponentInput): Promise<TriggerRunResult>;
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
// MCP proxy (convert an existing HTTP API to an MCP server)
// ---------------------------------------------------------------------------

export interface McpProxyApi {
  generateMcpFeatures(items: McpProxyMetadata[]): Promise<McpFeatureOperation[]>;
  createMcpApi(input: CreateMcpApiInput): Promise<CreatedMcpApi>;
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
  fetchProjectsByOrgId(orgNumericId: number): Promise<Project[]>;
  createDefaultProject(orgNumericId: number, orgHandler: string, projectHandler?: string): Promise<{ id: string; handler: string }>;
  fetchOrgComponentLimits(orgUuid: string): Promise<OrgComponentLimits>;
  fetchOrgSubscriptions(orgUuid: string): Promise<OrgSubscription[]>;
}

// ---------------------------------------------------------------------------
// Prebuilt integrations
// ---------------------------------------------------------------------------

export interface PrebuiltApi {
  fetchPrebuiltIntegrations(url: string, signal?: AbortSignal): Promise<PrebuiltIntegrationsData>;
  fetchPrebuiltAsset(baseUrl: string, filename: string, signal?: AbortSignal): Promise<Response>;
  checkNameAvailability(projectId: string, candidate: string): Promise<string>;
  fetchComponentDetail(projectId: string, handler: string): Promise<PrebuiltComponentRef>;
  fetchFirstEnvironment(orgUuid: string, projectId: string): Promise<PrebuiltEnvironmentRef>;
  fetchLatestCommitSha(componentId: string, branch: string): Promise<string>;
  savePrebuiltConfig(projectId: string, componentId: string, envId: string, deploymentTrackId: string, configurations: SchemaConfigItem[], commitHash: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export interface ProjectsApi {
  fetchProjects(orgId: number): Promise<Project[]>;
  fetchProject(orgId: number, projectId: string): Promise<Project>;
  fetchProjectByHandler(orgId: number, projectHandler: string): Promise<Project>;
  fetchProjectContributors(orgId: number, projectId: string): Promise<ProjectContributor[]>;
  fetchProjectComponentLabels(orgId: number, projectId: string): Promise<string[]>;
  fetchProjectHandlerAvailability(orgId: number, candidate: string): Promise<ProjectHandlerAvailability>;
  createProject(input: CreateProjectInput): Promise<Project>;
  createMonoRepoProject(input: CreateMonoRepoProjectInput): Promise<Project>;
  updateProject(input: UpdateProjectInput): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export interface RepositoryApi {
  fetchComponentRepository(projectId: string, componentHandler: string): Promise<Repository | null>;
  fetchCommitHistory(componentId: string, branch: string): Promise<Commit[]>;
  fetchGitHubUserRepos(): Promise<UserRepo[]>;
  fetchRepoBranches(repoOrg: string, repoName: string, isPublicRepo: boolean): Promise<RepoBranch[]>;
  fetchRepoMetadata(org: string, repo: string, branch: string, subPath: string, isPublicRepo?: boolean): Promise<RepoMetadata>;
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

export interface SubscriptionsApi {
  getSubscriptions(orgUuid: string): Promise<SubscriptionList>;
  getComponentLimits(orgUuid: string): Promise<ComponentLimits>;
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
  deploymentPipelines: DeploymentPipelinesApi;
  onPremKeys: OnPremKeysApi;
  appSecurity: AppSecurityApi;
  credentials: CredentialsApi;
  workflows: WorkflowsApi;
  egressControl: EgressControlApi;
  environments: EnvironmentsApi;
  executions: ExecutionsApi;
  insights: InsightsApi;
  logs: LogsApi;
  marketplace: MarketplaceApi;
  mcpProxy: McpProxyApi;
  org: OrgApi;
  prebuilt: PrebuiltApi;
  projects: ProjectsApi;
  projectAuthz: ProjectAuthzApi;
  tailscale: TailscaleApi;
  devopsConfigs: DevopsConfigsApi;
  customDomains: CustomDomainsApi;
  repository: RepositoryApi;
  samples: SamplesApi;
  subscriptions: SubscriptionsApi;
}
