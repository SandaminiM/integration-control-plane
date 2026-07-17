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

import { Box, Divider, MenuItem } from '@wso2/oxygen-ui';
import { Plug, Plus } from '@wso2/oxygen-ui-icons-react';
import type { JSX, ReactNode } from 'react';

/**
 * Footer actions appended inside the GitHub Organization / Repository dropdown
 * menus (Devant parity). Each is a `<MenuItem>` carrying a sentinel value; the
 * select's onChange intercepts these values and runs the matching action
 * (opening a GitHub popup) instead of selecting a repo/org. They are never a
 * valid selection, so the select's `value` always maps to a real option.
 */
export const GH_SELECT_ACTION = {
  addOrg: '__gh_add_org__',
  connectRepos: '__gh_connect_repos__',
  createRepo: '__gh_create_repo__',
} as const;

const ACTION_SX = { color: 'primary.main', gap: 1 } as const;

function actionItem(value: string, label: string, icon: ReactNode): JSX.Element {
  return (
    <MenuItem key={value} value={value} sx={ACTION_SX}>
      <Box component="span" sx={{ display: 'flex' }}>
        {icon}
      </Box>
      {label}
    </MenuItem>
  );
}

/** Leading items for the Organization select (rendered above the org options). `showInstall` gates the App-install action (needs a configured slug). */
export function organizationActionItems(showInstall: boolean): JSX.Element[] {
  if (!showInstall) return [];
  return [actionItem(GH_SELECT_ACTION.addOrg, 'Add organization', <Plus size={16} />), <Divider key="gh-org-divider" />];
}

/** Leading items for the Repository select (rendered above the repo options). Connect needs a configured slug; Create is always available. */
export function repositoryActionItems(showInstall: boolean): JSX.Element[] {
  const items: JSX.Element[] = [];
  if (showInstall) items.push(actionItem(GH_SELECT_ACTION.connectRepos, 'Connect more repositories', <Plug size={16} />));
  items.push(actionItem(GH_SELECT_ACTION.createRepo, 'Create repository', <Plus size={16} />));
  items.push(<Divider key="gh-repo-divider" />);
  return items;
}
