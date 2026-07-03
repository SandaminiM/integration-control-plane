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
 * Compile-time assertion that this product's modules satisfy `src/api/contracts.ts`.
 *
 * This file is never imported at runtime — it exists only so `tsc` will error
 * when a product's exported function signature drifts from the contract.
 * The underscore-prefixed locals are exempt from `noUnusedLocals`.
 */

import type * as Contracts from '../contracts';
import * as alerts from './alerts';
import * as apim from './apim';
import * as artifactToggleMutations from './artifactToggleMutations';
import * as artifacts from './artifacts';
import * as auth from './auth';
import * as builds from './builds';
import * as cloudEditor from './cloudEditor';
import * as components from './components';
import * as configuration from './configuration';
import * as copilot from './copilot';
import * as deployments from './deployments';
import * as deploymentPipelines from './deploymentPipelines';
import * as onPremKeys from './onPremKeys';
import * as egressControl from './egressControl';
import * as workflows from './workflows';
import * as appSecurity from './appSecurity';
import * as credentials from './credentials';
import * as environments from './environments';
import * as executions from './executions';
import * as insights from './insights';
import * as logs from './logs';
import * as marketplace from './marketplace';
import * as mcpProxy from './mcpProxy';
import * as org from './org';
import * as prebuilt from './prebuilt';
import * as projects from './projects';
import * as projectAuthz from './projectAuthz';
import * as tailscale from './tailscale';
import * as devopsConfigs from './devopsConfigs';
import * as customDomains from './customDomains';
import * as repository from './repository';
import * as samples from './samples';
import * as subscriptions from './subscriptions';
import * as configGroups from './configGroups';

const _alerts: Contracts.AlertsApi = alerts;
const _apim: Contracts.ApimApi = apim;
const _artifactToggleMutations: Contracts.ArtifactToggleMutationsApi = artifactToggleMutations;
const _artifacts: Contracts.ArtifactsApi = artifacts;
const _auth: Contracts.AuthApi = auth;
const _builds: Contracts.BuildsApi = builds;
const _cloudEditor: Contracts.CloudEditorApi = cloudEditor;
const _components: Contracts.ComponentsApi = components;
const _configuration: Contracts.ConfigurationApi = configuration;
const _copilot: Contracts.CopilotApi = copilot;
const _deployments: Contracts.DeploymentsApi = deployments;
const _deploymentPipelines: Contracts.DeploymentPipelinesApi = deploymentPipelines;
const _onPremKeys: Contracts.OnPremKeysApi = onPremKeys;
const _egressControl: Contracts.EgressControlApi = egressControl;
const _workflows: Contracts.WorkflowsApi = workflows;
const _appSecurity: Contracts.AppSecurityApi = appSecurity;
const _credentials: Contracts.CredentialsApi = credentials;
const _environments: Contracts.EnvironmentsApi = environments;
const _executions: Contracts.ExecutionsApi = executions;
const _insights: Contracts.InsightsApi = insights;
const _logs: Contracts.LogsApi = logs;
const _marketplace: Contracts.MarketplaceApi = marketplace;
const _mcpProxy: Contracts.McpProxyApi = mcpProxy;
const _org: Contracts.OrgApi = org;
const _prebuilt: Contracts.PrebuiltApi = prebuilt;
const _projects: Contracts.ProjectsApi = projects;
const _projectAuthz: Contracts.ProjectAuthzApi = projectAuthz;
const _tailscale: Contracts.TailscaleApi = tailscale;
const _devopsConfigs: Contracts.DevopsConfigsApi = devopsConfigs;
const _customDomains: Contracts.CustomDomainsApi = customDomains;
const _repository: Contracts.RepositoryApi = repository;
const _samples: Contracts.SamplesApi = samples;
const _subscriptions: Contracts.SubscriptionsApi = subscriptions;
const _configGroups: Contracts.ConfigGroupsApi = configGroups;

void _alerts;
void _apim;
void _artifactToggleMutations;
void _artifacts;
void _auth;
void _builds;
void _cloudEditor;
void _components;
void _configuration;
void _copilot;
void _deployments;
void _deploymentPipelines;
void _onPremKeys;
void _egressControl;
void _workflows;
void _appSecurity;
void _credentials;
void _environments;
void _executions;
void _insights;
void _logs;
void _marketplace;
void _mcpProxy;
void _org;
void _prebuilt;
void _projects;
void _projectAuthz;
void _tailscale;
void _devopsConfigs;
void _customDomains;
void _repository;
void _samples;
void _subscriptions;
void _configGroups;
