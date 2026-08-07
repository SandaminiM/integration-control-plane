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

import { IS_CLOUD } from '../features';
import { Permissions } from './permissions';
import { isSettingsSectionVisible, type SettingsSectionDef } from './orgSettingsSections';

/**
 * Project Settings sections, in display order (Devant's order, minus Ballerina
 * Connector Configs and VPN Configuration). Project sections are gated by
 * project-management permissions; egress by environment management.
 */
export const PROJECT_SETTINGS_SECTIONS: readonly SettingsSectionDef[] = [
  { id: 'project-overview', label: 'Project', path: 'project-overview', permissions: [Permissions.PROJECT_MANAGE, Permissions.PROJECT_EDIT] },
  // Cloud keeps only the Project section; the rest are unsupported there.
  ...(IS_CLOUD
    ? []
    : [
        { id: 'access-control', label: 'Access Control', path: 'access-control/roles', permissions: [Permissions.PROJECT_MANAGE, Permissions.PROJECT_EDIT] },
        { id: 'application-security', label: 'Application Security', path: 'application-security', permissions: [Permissions.PROJECT_MANAGE] },
        { id: 'egress-control', label: 'Egress Control', path: 'egress-control', permissions: [Permissions.ENVIRONMENT_MANAGE] },
        { id: 'vpn-configuration', label: 'VPN Configuration', path: 'vpn-configuration', permissions: [Permissions.PROJECT_MANAGE] },
      ]),
];

/** The first project section the user is allowed to see, or `null` if none. */
export function firstAvailableProjectSettingsSection(hasAnyPermission: (perms: string[]) => boolean): SettingsSectionDef | null {
  return PROJECT_SETTINGS_SECTIONS.find((s) => isSettingsSectionVisible(s, hasAnyPermission)) ?? null;
}
