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

import { lazy } from 'react';
import { type RouteProps, Navigate, Outlet } from 'react-router';
import { cookiePolicyUrl, loginUrl, orgRoleDetailUrl, projectRoleDetailUrl, componentRoleDetailUrl, projectGroupDetailUrl, componentGroupDetailUrl, signupUrl, registerOrgUrl } from '../paths';
import { ScopeResolver, generateMatrixRoutes, withScope, type Matrix } from '../nav';
import { IS_WIP, IS_CLOUD } from '../features';
import { createElement } from 'react';
const PrebuiltIntegrationConfigProvider = lazy(() => import('../contexts/PrebuiltIntegrationConfigContext').then((m) => ({ default: m.PrebuiltIntegrationConfigProvider })));

// Eager — needed on first paint for unauthenticated pages
import PublicLayout from '../layouts/PublicLayout';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import RouteErrorBoundary from '../components/RouteErrorBoundary';

// Lazy — authenticated app shell and all pages
const AppLayout = lazy(() => import('../layouts/AppLayout'));
const PolicyLayout = lazy(() => import('../layouts/PolicyLayout'));
const ProtectedRoute = lazy(() => import('../auth/ProtectedRoute'));
const OrgHomeRedirect = lazy(() => import('../components/OrgHomeRedirect'));

const OIDCCallback = lazy(() => import('../pages/OIDCCallback'));
const GitHubOAuthCallback = lazy(() => import('../pages/GitHubOAuthCallback'));
const RegisterOrganization = lazy(() => import('../pages/RegisterOrganization'));
const CookiePolicy = lazy(() => import('../pages/CookiePolicy'));
const ForceChangePassword = lazy(() => import('../pages/ForceChangePassword'));
const CloudEditorDeployment = lazy(() => import('../pages/CloudEditorDeployment'));
const ProjectsRedirect = lazy(() => import('../pages/ProjectsRedirect'));
const OrgHome = lazy(() => import('../pages/OrgHome'));
const Projects = lazy(() => import('../pages/Projects'));
const Project = lazy(() => import('../pages/Project'));
const Component = lazy(() => import('../pages/Component'));
const CreateProject = lazy(() => import('../pages/CreateProject'));
const ImportProject = lazy(() => import('../pages/ImportProject'));
const CreateIntegrationOptions = lazy(() => import('../pages/CreateIntegrationOptions'));
const ImportIntegration = lazy(() => import('../pages/ImportIntegration'));
const McpProxyFromApi = lazy(() => import('../pages/McpProxyFromApi'));
const McpPolicies = lazy(() => import('../pages/McpPolicies'));
const ComponentTest = lazy(() => import('../pages/ComponentTest'));
const OrgCdPipelines = lazy(() => import('../pages/OrgCdPipelines'));
const OrgConfigGroups = lazy(() => import('../pages/OrgConfigGroups'));
const CreateConfigGroup = lazy(() => import('../pages/CreateConfigGroup'));
const OrgGenAIServices = lazy(() => import('../pages/OrgGenAIServices'));
const RegisterGenAIService = lazy(() => import('../pages/RegisterGenAIService'));
const GenAIServiceDetail = lazy(() => import('../pages/GenAIServiceDetail'));
const ThirdPartyServices = lazy(() => import('../pages/ThirdPartyServices'));
const RegisterThirdPartyService = lazy(() => import('../pages/RegisterThirdPartyService'));
const ThirdPartyServiceDetail = lazy(() => import('../pages/ThirdPartyServiceDetail'));
const EditConfigGroup = lazy(() => import('../pages/EditConfigGroup'));
const OrgAuditLogs = lazy(() => import('../pages/OrgAuditLogs'));
const ProjectCdPipelines = lazy(() => import('../pages/ProjectCdPipelines'));
const OrgDatabases = lazy(() => import('../pages/OrgDatabases'));
const CreateDatabaseServer = lazy(() => import('../pages/CreateDatabaseServer'));
const DatabaseServerDetail = lazy(() => import('../pages/DatabaseServerDetail'));
const OrgVectorDatabases = lazy(() => import('../pages/OrgVectorDatabases'));
const CreateVectorDatabaseServer = lazy(() => import('../pages/CreateVectorDatabaseServer'));
const VectorDatabaseServerDetail = lazy(() => import('../pages/VectorDatabaseServerDetail'));
const ProjectSettings = lazy(() => import('../pages/ProjectSettings'));
const ProjectOverview = lazy(() => import('../pages/ProjectOverview'));
const ProjectEgressControl = lazy(() => import('../pages/ProjectEgressControl'));
const ProjectApplicationSecurity = lazy(() => import('../pages/ProjectApplicationSecurity'));
const ProjectVpnConfiguration = lazy(() => import('../pages/ProjectVpnConfiguration'));
const ComponentSettings = lazy(() => import('../pages/ComponentSettings'));
const ComponentDeploymentTracks = lazy(() => import('../pages/ComponentDeploymentTracks'));
const ComponentProxyVersions = lazy(() => import('../pages/ComponentProxyVersions'));
const ComponentUrlSettings = lazy(() => import('../pages/ComponentUrlSettings'));
const ComponentConfigs = lazy(() => import('../pages/ComponentConfigs'));
const CdPipelineEditor = lazy(() => import('../pages/CdPipelineEditor'));
const OrgSettings = lazy(() => import('../pages/OrgSettings'));
const OnPremKeys = lazy(() => import('../pages/OnPremKeys'));
const EgressControl = lazy(() => import('../pages/EgressControl'));
const Workflows = lazy(() => import('../pages/Workflows'));
const ApplicationSecurity = lazy(() => import('../pages/ApplicationSecurity'));
const Credentials = lazy(() => import('../pages/Credentials'));
const BrowseSamples = lazy(() => import('../pages/BrowseSamples'));
const BrowsePrebuiltIntegrations = lazy(() => import('../pages/BrowsePrebuiltIntegrations'));
const PrebuiltIntegrationSetup = lazy(() => import('../pages/PrebuiltIntegrationSetup'));
const PrebuiltIntegrationDeploy = lazy(() => import('../pages/PrebuiltIntegrationDeploy'));
const Build = lazy(() => import('../pages/Build'));
const OrgBuild = lazy(() => import('../pages/OrgBuild'));
const ProjectBuild = lazy(() => import('../pages/ProjectBuild'));
const OrgDeploy = lazy(() => import('../pages/OrgDeploy'));
const ProjectDeploy = lazy(() => import('../pages/ProjectDeploy'));
const Deploy = lazy(() => import('../pages/Deploy'));
const TestConsole = lazy(() => import('../pages/TestConsole'));
const AgentChatConsole = lazy(() => import('../pages/AgentChatConsole'));
const Lifecycle = lazy(() => import('../pages/Lifecycle'));
const Alerts = lazy(() => import('../pages/Alerts'));
const Environments = lazy(() => import('../pages/Environments'));
const CreateEnvironment = lazy(() => import('../pages/CreateEnvironment'));
const EditEnvironment = lazy(() => import('../pages/EditEnvironment'));
const RuntimeLogsProject = lazy(() => import('../pages/RuntimeLogsProject'));
const RuntimeLogsIntegration = lazy(() => import('../pages/RuntimeLogsIntegration'));
const { OrgAccessControl, ProjectAccessControl, ComponentAccessControl } = {
  OrgAccessControl: lazy(() => import('../pages/AccessControl').then((m) => ({ default: m.OrgAccessControl }))),
  ProjectAccessControl: lazy(() => import('../pages/AccessControl').then((m) => ({ default: m.ProjectAccessControl }))),
  ComponentAccessControl: lazy(() => import('../pages/AccessControl').then((m) => ({ default: m.ComponentAccessControl }))),
};
const RoleDetail = lazy(() => import('../pages/RoleDetail'));
const ProjectRoleDetail = lazy(() => import('../pages/ProjectRoleDetail'));
const ComponentRoleDetail = lazy(() => import('../pages/ComponentRoleDetail'));
const ProjectGroupDetail = lazy(() => import('../pages/ProjectGroupDetail'));
const ComponentGroupDetail = lazy(() => import('../pages/ComponentGroupDetail'));
const CreateUser = lazy(() => import('../pages/CreateUser'));
const EditUser = lazy(() => import('../pages/EditUser'));
const CreateRole = lazy(() => import('../pages/CreateRole'));
const CreateGroup = lazy(() => import('../pages/CreateGroup'));
const EditGroup = lazy(() => import('../pages/EditGroup'));
const Profile = lazy(() => import('../pages/Profile'));
const ComingSoon = lazy(() => import('../pages/ComingSoon'));

export interface AppRoute extends Omit<RouteProps, 'children'> {
  children?: AppRoute[];
}

const MATRIX: Matrix = {
  overview: { segment: '', pages: { organizations: Projects, projects: Project, components: Component } },
  build: { segment: 'build', pages: { organizations: OrgBuild, projects: ProjectBuild, components: Build } },
  deploy: { segment: 'deploy', pages: { organizations: OrgDeploy, projects: ProjectDeploy, components: Deploy } },
  alerts: { segment: 'alerts', pages: { components: Alerts } },
  logs: { segment: 'logs', pages: { projects: RuntimeLogsProject, components: RuntimeLogsIntegration } },

  environments: { segment: 'environments', pages: { organizations: Environments, projects: Environments } },
  'access-control': { segment: 'settings/access-control/:tab', pages: { organizations: OrgAccessControl, projects: ProjectAccessControl, components: ComponentAccessControl } },
};

const routes: AppRoute[] = [
  { path: '/', element: <Navigate to="/login" replace /> },
  {
    element: <PublicLayout />,
    children: [
      { path: loginUrl(), element: <Login /> },
      { path: signupUrl(), element: <Signup /> },
    ],
  },
  {
    element: <PolicyLayout />,
    children: [{ path: cookiePolicyUrl(), element: <CookiePolicy /> }],
  },
  { path: '/signin', element: <OIDCCallback /> },
  { path: '/ghapp', element: <GitHubOAuthCallback /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: registerOrgUrl(), element: <RegisterOrganization /> },
      { path: '/change-password', element: <ForceChangePassword /> },
      { path: '/editor', element: <CloudEditorDeployment /> },
      {
        element: <ScopeResolver />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: 'organizations/:orgHandler', element: <OrgHomeRedirect /> },
              { path: 'organizations/:orgHandler/develop', element: <ComingSoon title="Coming Soon" description="Development tools are currently under development." /> },
              { path: 'organizations/:orgHandler/deploy', element: <ComingSoon title="Coming Soon" description="Deployment management is currently under development." /> },
              { path: 'organizations/:orgHandler/test', element: <ComingSoon title="Coming Soon" description="Testing tools are currently under development." /> },
              { path: 'organizations/:orgHandler/insights/usage', element: <ComingSoon title="Coming Soon" description="Usage insights are currently under development." /> },
              { path: 'organizations/:orgHandler/insights/delivery', element: <ComingSoon title="Coming Soon" description="Delivery insights are currently under development." /> },
              { path: 'organizations/:orgHandler/insights/compliance', element: <ComingSoon title="Coming Soon" description="Compliance insights are currently under development." /> },
              { path: 'organizations/:orgHandler/logs', element: <ComingSoon title="Coming Soon" description="Organization-level logs are currently under development." /> },
              { path: 'organizations/:orgHandler/metrics', element: <ComingSoon title="Coming Soon" description="Organization-level metrics are currently under development." /> },
              { path: 'organizations/:orgHandler/rag/scheduled-ingestion', element: <ComingSoon title="Coming Soon" description="Scheduled ingestion is currently under development." /> },
              { path: 'organizations/:orgHandler/rag/service', element: <ComingSoon title="Coming Soon" description="RAG service management is currently under development." /> },
              { path: 'organizations/:orgHandler/rag/retrieval', element: <ComingSoon title="Coming Soon" description="Retrieval configuration is currently under development." /> },
              { path: 'organizations/:orgHandler/admin/databases', element: createElement(withScope(OrgDatabases, ['organizations'])) },
              { path: 'organizations/:orgHandler/admin/databases/new', element: createElement(withScope(CreateDatabaseServer, ['organizations'])) },
              { path: 'organizations/:orgHandler/admin/databases/:dbServerId/:tab', element: createElement(withScope(DatabaseServerDetail, ['organizations'])) },
              { path: 'organizations/:orgHandler/admin/vector-databases', element: createElement(withScope(OrgVectorDatabases, ['organizations'])) },
              { path: 'organizations/:orgHandler/admin/vector-databases/new', element: createElement(withScope(CreateVectorDatabaseServer, ['organizations'])) },
              { path: 'organizations/:orgHandler/admin/vector-databases/:dbServerId/:tab', element: createElement(withScope(VectorDatabaseServerDetail, ['organizations'])) },
              { path: 'organizations/:orgHandler/admin/message-brokers', element: <ComingSoon title="Coming Soon" description="Message Brokers management is currently under development." /> },
              { path: 'organizations/:orgHandler/admin/third-party', element: createElement(RouteErrorBoundary, null, createElement(withScope(ThirdPartyServices, ['organizations']))) },
              { path: 'organizations/:orgHandler/admin/third-party/new', element: createElement(RouteErrorBoundary, null, createElement(withScope(RegisterThirdPartyService, ['organizations']))) },
              { path: 'organizations/:orgHandler/admin/third-party/:serviceId', element: createElement(RouteErrorBoundary, null, createElement(withScope(ThirdPartyServiceDetail, ['organizations']))) },
              { path: 'organizations/:orgHandler/admin/genai-services', element: createElement(RouteErrorBoundary, null, createElement(withScope(OrgGenAIServices, ['organizations']))) },
              { path: 'organizations/:orgHandler/admin/genai-services/new', element: createElement(RouteErrorBoundary, null, createElement(withScope(RegisterGenAIService, ['organizations']))) },
              { path: 'organizations/:orgHandler/admin/genai-services/:serviceId', element: createElement(RouteErrorBoundary, null, createElement(withScope(GenAIServiceDetail, ['organizations']))) },
              { path: 'organizations/:orgHandler/admin/config-groups', element: createElement(RouteErrorBoundary, null, createElement(withScope(OrgConfigGroups, ['organizations']))) },
              { path: 'organizations/:orgHandler/admin/config-groups/new', element: createElement(RouteErrorBoundary, null, createElement(withScope(CreateConfigGroup, ['organizations']))) },
              { path: 'organizations/:orgHandler/admin/config-groups/:configGroupUuid', element: createElement(RouteErrorBoundary, null, createElement(withScope(EditConfigGroup, ['organizations']))) },
              { path: 'organizations/:orgHandler/admin/governance', element: <ComingSoon title="Coming Soon" description="Governance management is currently under development." /> },
              { path: 'organizations/:orgHandler/admin/cd-pipelines', element: createElement(withScope(OrgCdPipelines, ['organizations'])) },
              { path: 'organizations/:orgHandler/admin/cd-pipelines/new', element: <CdPipelineEditor /> },
              { path: 'organizations/:orgHandler/admin/cd-pipelines/:pipelineId/edit', element: <CdPipelineEditor /> },
              { path: 'organizations/:orgHandler/admin/data-planes', element: <ComingSoon title="Coming Soon" description="Data Planes management is currently under development." /> },
              { path: 'organizations/:orgHandler/admin/audit-logs', element: <OrgAuditLogs /> },
              { path: 'organizations/:orgHandler/admin/approvals', element: <ComingSoon title="Coming Soon" description="Approvals management is currently under development." /> },
              { path: 'organizations/:orgHandler/admin/certificates', element: <ComingSoon title="Coming Soon" description="Certificates management is currently under development." /> },
              { path: 'organizations/:orgHandler/settings', element: createElement(withScope(OrgSettings, ['organizations'])) },
              { path: 'organizations/:orgHandler/settings/egress-control', element: createElement(withScope(EgressControl, ['organizations'])) },
              { path: 'organizations/:orgHandler/settings/workflows', element: createElement(withScope(Workflows, ['organizations'])) },
              { path: 'organizations/:orgHandler/settings/credentials', element: createElement(withScope(Credentials, ['organizations'])) },
              { path: 'organizations/:orgHandler/settings/on-prem-keys', element: createElement(withScope(OnPremKeys, ['organizations'])) },
              { path: 'organizations/:orgHandler/settings/application-security/:tab', element: createElement(withScope(ApplicationSecurity, ['organizations'])) },
              ...generateMatrixRoutes(MATRIX),
              { path: 'organizations/:orgHandler/projects/:projectHandler/develop', element: <ComingSoon title="Coming Soon" description="Development tools are currently under development." /> },
              { path: 'organizations/:orgHandler/projects/:projectHandler/deploy', element: <ComingSoon title="Coming Soon" description="Deployment management is currently under development." /> },
              { path: 'organizations/:orgHandler/projects/:projectHandler/test', element: <ComingSoon title="Coming Soon" description="Testing tools are currently under development." /> },
              { path: 'organizations/:orgHandler/projects/:projectHandler/insights/usage', element: <ComingSoon title="Coming Soon" description="Usage insights are currently under development." /> },
              { path: 'organizations/:orgHandler/projects/:projectHandler/insights/delivery', element: <ComingSoon title="Coming Soon" description="Delivery insights are currently under development." /> },
              { path: 'organizations/:orgHandler/projects/:projectHandler/insights/compliance', element: <ComingSoon title="Coming Soon" description="Compliance insights are currently under development." /> },
              { path: 'organizations/:orgHandler/projects/:projectHandler/runtimes', element: <ComingSoon title="Coming Soon" description="Runtime management is currently under development." /> },
              { path: 'organizations/:orgHandler/projects/:projectHandler/metrics', element: <ComingSoon title="Coming Soon" description="Metrics are currently under development." /> },
              { path: 'organizations/:orgHandler/projects/:projectHandler/observe/runtimelogs', element: createElement(withScope(RuntimeLogsProject, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/observe/metrics', element: <ComingSoon title="Coming Soon" description="Metrics are currently under development." /> },
              { path: 'organizations/:orgHandler/projects/:projectHandler/admin/connections', element: <ComingSoon title="Coming Soon" description="Connections management is currently under development." /> },
              { path: 'organizations/:orgHandler/projects/:projectHandler/admin/third-party-services', element: createElement(RouteErrorBoundary, null, createElement(withScope(ThirdPartyServices, ['projects']))) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/admin/third-party-services/new', element: createElement(RouteErrorBoundary, null, createElement(withScope(RegisterThirdPartyService, ['projects']))) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/admin/third-party-services/:serviceId', element: createElement(RouteErrorBoundary, null, createElement(withScope(ThirdPartyServiceDetail, ['projects']))) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/admin/gen-ai-services', element: createElement(RouteErrorBoundary, null, createElement(withScope(OrgGenAIServices, ['projects']))) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/admin/gen-ai-services/new', element: createElement(RouteErrorBoundary, null, createElement(withScope(RegisterGenAIService, ['projects']))) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/admin/gen-ai-services/:serviceId', element: createElement(RouteErrorBoundary, null, createElement(withScope(GenAIServiceDetail, ['projects']))) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/admin/cd-pipelines', element: createElement(withScope(ProjectCdPipelines, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/devops/environments', element: createElement(withScope(Environments, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/settings', element: createElement(withScope(ProjectSettings, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/settings/project-overview', element: createElement(withScope(ProjectOverview, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/settings/egress-control', element: createElement(withScope(ProjectEgressControl, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/settings/application-security', element: createElement(withScope(ProjectApplicationSecurity, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/settings/vpn-configuration', element: createElement(withScope(ProjectVpnConfiguration, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/redirect', element: <ProjectsRedirect /> },
              { path: 'organizations/:orgHandler/home', element: createElement(withScope(OrgHome, ['organizations'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/home', element: createElement(withScope(Project, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/overview', element: createElement(withScope(Component, ['components'])) },
              { path: 'organizations/:orgHandler/projects/new', element: createElement(withScope(CreateProject, ['organizations'])) },
              { path: 'organizations/:orgHandler/projects/import', element: createElement(withScope(ImportProject, ['organizations'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/components/new', element: createElement(withScope(CreateIntegrationOptions, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/components/new/import', element: createElement(withScope(ImportIntegration, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/components/new/samples', element: createElement(withScope(BrowseSamples, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/components/new/generate-mcp', element: createElement(withScope(McpProxyFromApi, ['projects'])) },
              { path: 'organizations/:orgHandler/environments/new', element: createElement(withScope(CreateEnvironment, ['organizations'])) },
              { path: 'organizations/:orgHandler/environments/:envId/edit', element: <EditEnvironment /> },
              { path: 'organizations/:orgHandler/settings/access-control/users/new', element: <CreateUser /> },
              { path: 'organizations/:orgHandler/settings/access-control/users/:userId/edit', element: <EditUser /> },
              { path: 'organizations/:orgHandler/settings/access-control/roles/new', element: <CreateRole /> },
              { path: 'organizations/:orgHandler/settings/access-control/groups/new', element: <CreateGroup /> },
              { path: 'organizations/:orgHandler/settings/access-control/groups/:groupId/edit', element: <EditGroup /> },
              { path: orgRoleDetailUrl(':orgHandler', ':roleId'), element: <RoleDetail /> },
              { path: projectRoleDetailUrl(':orgHandler', ':projectHandler', ':roleId'), element: <ProjectRoleDetail /> },
              { path: componentRoleDetailUrl(':orgHandler', ':projectHandler', ':componentHandler', ':roleId'), element: <ComponentRoleDetail /> },
              { path: projectGroupDetailUrl(':orgHandler', ':projectHandler', ':groupId'), element: <ProjectGroupDetail /> },
              { path: componentGroupDetailUrl(':orgHandler', ':projectHandler', ':componentHandler', ':groupId'), element: <ComponentGroupDetail /> },
              { path: '/profile', element: <Profile /> },
              // cloud: prebuilt integrations are supported on OpenChoreo, so the
              // routes are enabled for cloud as well as wip (icp is stubs-only).
              ...(IS_WIP || IS_CLOUD
                ? [
                    { path: 'organizations/:orgHandler/projects/:projectHandler/prebuilt-integrations', element: createElement(withScope(BrowsePrebuiltIntegrations, ['projects'])) },
                    {
                      element: (
                        <PrebuiltIntegrationConfigProvider>
                          <Outlet />
                        </PrebuiltIntegrationConfigProvider>
                      ),
                      children: [
                        { path: 'organizations/:orgHandler/projects/:projectHandler/prebuilt-integrations/:slug', element: createElement(withScope(PrebuiltIntegrationSetup, ['projects'])) },
                        { path: 'organizations/:orgHandler/projects/:projectHandler/prebuilt-integrations/:slug/deploy', element: createElement(withScope(PrebuiltIntegrationDeploy, ['projects'])) },
                      ],
                    },
                  ]
                : []),
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/new/import-coming-soon',
                element: <ComingSoon title="Coming Soon" description="Importing from this Git provider is currently not available. You'll be able to import integrations from this source soon." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/test',
                element: createElement(withScope(ComponentTest, ['components'])),
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/test/console',
                element: createElement(withScope(TestConsole, ['components'])),
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/test/agent-chat',
                element: createElement(withScope(AgentChatConsole, ['components'])),
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/test/api-chat',
                element: <ComingSoon title="Coming Soon" description="API Chat is currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/manage/lifecycle',
                element: createElement(withScope(Lifecycle, ['components'])),
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/manage/policies',
                element: createElement(withScope(McpPolicies, ['components'])),
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/documents',
                element: <ComingSoon title="Coming Soon" description="API documentation is currently under development. You'll be able to manage your API documents directly from here." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/plans',
                element: <ComingSoon title="Coming Soon" description="Subscription plans management is currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/deploy',
                element: <ComingSoon title="Coming Soon" description="Deployment management is currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/insights/usage',
                element: <ComingSoon title="Coming Soon" description="Usage insights are currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/insights/delivery',
                element: <ComingSoon title="Coming Soon" description="Delivery insights are currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/insights/compliance',
                element: <ComingSoon title="Coming Soon" description="Compliance insights are currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/metrics',
                element: <ComingSoon title="Coming Soon" description="Metrics are currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/admin/connections',
                element: <ComingSoon title="Coming Soon" description="Connections management is currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/runtimes',
                element: <ComingSoon title="Coming Soon" description="Runtime management is currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/admin/containers',
                element: <ComingSoon title="Coming Soon" description="Containers management is currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/admin/configs',
                element: createElement(withScope(ComponentConfigs, ['components'])),
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/admin/health-checks',
                element: <ComingSoon title="Coming Soon" description="Health Checks configuration is currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/admin/scaling',
                element: <ComingSoon title="Coming Soon" description="Scaling configuration is currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/admin/storage',
                element: <ComingSoon title="Coming Soon" description="Storage management is currently under development." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/settings',
                element: createElement(withScope(ComponentSettings, ['components'])),
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/settings/deployment-tracks',
                element: createElement(withScope(ComponentDeploymentTracks, ['components'])),
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/settings/proxy-versions',
                element: createElement(withScope(ComponentProxyVersions, ['components'])),
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/settings/url-settings',
                element: createElement(withScope(ComponentUrlSettings, ['components'])),
              },
            ],
          },
        ],
      },
    ],
  },
];

export default routes;
