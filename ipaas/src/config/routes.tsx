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

import { type RouteProps, Navigate } from 'react-router';
import { cookiePolicyUrl, loginUrl, orgRoleDetailUrl, privacyPolicyUrl, projectRoleDetailUrl, componentRoleDetailUrl, projectGroupDetailUrl, componentGroupDetailUrl, alertsSegment, buildsSegment } from '../paths';
import OrgHomeRedirect from '../components/OrgHomeRedirect';
import CreateUser from '../pages/CreateUser';
import EditUser from '../pages/EditUser';
import CreateRole from '../pages/CreateRole';
import CreateGroup from '../pages/CreateGroup';
import EditGroup from '../pages/EditGroup';
import EditEnvironment from '../pages/EditEnvironment';
import PublicLayout from '../layouts/PublicLayout';
import PolicyLayout from '../layouts/PolicyLayout';
import Login from '../pages/Login';
import CookiePolicy from '../pages/CookiePolicy';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import OIDCCallback from '../pages/OIDCCallback';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from '../auth/ProtectedRoute';
import Projects from '../pages/Projects';
import CreateProject from '../pages/CreateProject';
import CreateIntegrationOptions from '../pages/CreateIntegrationOptions';
import ImportIntegration from '../pages/ImportIntegration';
import BrowseSamples from '../pages/BrowseSamples';
import GitHubOAuthCallback from '../pages/GitHubOAuthCallback';
import Project from '../pages/Project';
import Component from '../pages/Component';
import RuntimeLogsProject from '../pages/RuntimeLogsProject';
import RuntimeLogsIntegration from '../pages/RuntimeLogsIntegration';
import Metrics from '../pages/Metrics';
import Environments from '../pages/Environments';
import CreateEnvironment from '../pages/CreateEnvironment';
import Runtime from '../pages/Runtime';
import { OrgAccessControl, ProjectAccessControl, ComponentAccessControl } from '../pages/AccessControl';
import RoleDetail from '../pages/RoleDetail';
import ProjectRoleDetail from '../pages/ProjectRoleDetail';
import ComponentRoleDetail from '../pages/ComponentRoleDetail';
import ProjectGroupDetail from '../pages/ProjectGroupDetail';
import ComponentGroupDetail from '../pages/ComponentGroupDetail';
import Profile from '../pages/Profile';
import ForceChangePassword from '../pages/ForceChangePassword';
import ComingSoon from '../pages/ComingSoon';
import ManageLoggers from '../pages/ManageLoggers';
import Alerts from '../pages/Alerts';
import { ScopeResolver, generateMatrixRoutes, withScope, type Matrix } from '../nav';
import { createElement } from 'react';
import Build from '../pages/Build';
import OrgBuild from '../pages/OrgBuild';
import ProjectBuild from '../pages/ProjectBuild';
import CloudEditorDeployment from '../pages/CloudEditorDeployment';

export interface AppRoute extends Omit<RouteProps, 'children'> {
  children?: AppRoute[];
}

const MATRIX: Matrix = {
  overview: { segment: '', pages: { organizations: Projects, projects: Project, components: Component } },
  logs: { segment: 'logs', pages: { projects: RuntimeLogsProject, components: RuntimeLogsIntegration } },
  alerts: { segment: alertsSegment, pages: { components: Alerts } },
  build: { segment: buildsSegment, pages: { organizations: OrgBuild, projects: ProjectBuild, components: Build } },
  metrics: { segment: 'metrics', pages: { projects: Metrics, components: Metrics } },
  runtimes: { segment: 'runtimes', pages: { projects: Runtime, components: Runtime } },
  environments: { segment: 'environments', pages: { organizations: Environments, projects: Environments } },
  'access-control': { segment: 'settings/access-control/:tab', pages: { organizations: OrgAccessControl, projects: ProjectAccessControl, components: ComponentAccessControl } },
};

const routes: AppRoute[] = [
  { path: '/', element: <Navigate to="/login" replace /> },
  {
    element: <PublicLayout />,
    children: [{ path: loginUrl(), element: <Login /> }],
  },
  {
    element: <PolicyLayout />,
    children: [
      { path: cookiePolicyUrl(), element: <CookiePolicy /> },
      { path: privacyPolicyUrl(), element: <PrivacyPolicy /> },
    ],
  },
  { path: '/signin', element: <OIDCCallback /> },
  { path: '/ghapp', element: <GitHubOAuthCallback /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/change-password', element: <ForceChangePassword /> },
      { path: '/editor', element: <CloudEditorDeployment /> },
      {
        element: <ScopeResolver />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: 'organizations/:orgHandler', element: <OrgHomeRedirect /> },
              ...generateMatrixRoutes(MATRIX),
              { path: 'organizations/:orgHandler/home', element: createElement(withScope(Projects, ['organizations'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/home', element: createElement(withScope(Project, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/overview', element: createElement(withScope(Component, ['components'])) },
              { path: 'organizations/:orgHandler/projects/new', element: createElement(withScope(CreateProject, ['organizations'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/components/new', element: createElement(withScope(CreateIntegrationOptions, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/components/new/import', element: createElement(withScope(ImportIntegration, ['projects'])) },
              { path: 'organizations/:orgHandler/projects/:projectHandler/components/new/samples', element: createElement(withScope(BrowseSamples, ['projects'])) },
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
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/test/console',
                element: <ComingSoon title="Coming Soon" description="The test console is currently under development. You'll be able to test your integrations directly from here." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/manage/lifecycle',
                element: <ComingSoon title="Coming Soon" description="Lifecycle management is currently under development. You'll be able to manage your API lifecycle directly from here." />,
              },
              {
                path: 'organizations/:orgHandler/projects/:projectHandler/components/:componentHandler/documents',
                element: <ComingSoon title="Coming Soon" description="API documentation is currently under development. You'll be able to manage your API documents directly from here." />,
              },
            ],
          },
        ],
      },
    ],
  },
];

export default routes;
