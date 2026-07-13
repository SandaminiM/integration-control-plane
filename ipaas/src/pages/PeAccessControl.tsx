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

import { PageContent, PageTitle } from '@wso2/oxygen-ui';
import { useEffect, type JSX } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAccessControl } from '../contexts/AccessControlContext';
import { ALL_USER_MGT_PERMISSIONS } from '../constants/permissions';
import { UsersTab } from '../components/Settings/AccessControl/UsersTab';
import { RolesTab } from '../components/Settings/AccessControl/RolesTab';
import { GroupsTab } from '../components/Settings/AccessControl/GroupsTab';

type PeUserMgmtTab = 'users' | 'roles' | 'groups';

const TAB_TITLES: Record<PeUserMgmtTab, string> = {
  users: 'Users',
  roles: 'Roles',
  groups: 'Groups',
};

/**
 * Platform Engineer perspective — User Management pages.
 *
 * Reuses the same Access Control tab components (`UsersTab` / `RolesTab` /
 * `GroupsTab`) that the Developer-mode Settings screen uses, exactly like Devant
 * mounts the shared Access Control components under its PE routes. The PE left
 * nav (Users / Roles / Groups) drives the selection, so no top-tab chrome or
 * Settings header is rendered here — each PE leaf maps to a single tab.
 */
export default function PeAccessControl({ tab }: { tab: PeUserMgmtTab }): JSX.Element {
  const { orgHandler = 'default' } = useParams();
  const navigate = useNavigate();
  const { hasAnyPermission, isOrgPermissionsLoaded } = useAccessControl();

  const canSeeAccessControl = hasAnyPermission([...ALL_USER_MGT_PERMISSIONS]);

  useEffect(() => {
    if (!isOrgPermissionsLoaded) return;
    if (!canSeeAccessControl) {
      navigate(`/organizations/${orgHandler}`);
    }
  }, [isOrgPermissionsLoaded, canSeeAccessControl, navigate, orgHandler]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>{TAB_TITLES[tab]}</PageTitle.Header>
      </PageTitle>
      {tab === 'users' && <UsersTab orgHandler={orgHandler} />}
      {tab === 'roles' && <RolesTab orgHandler={orgHandler} />}
      {tab === 'groups' && <GroupsTab orgHandler={orgHandler} />}
    </PageContent>
  );
}
