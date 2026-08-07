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

import { PageContent } from '@wso2/oxygen-ui';
import type { JSX } from 'react';
import OrgInfoHeader from '../components/Settings/AccessControl/OrgInfoHeader';
import OrgSettingsTabs from '../components/Settings/OrgSettingsTabs';
import type { OrgScope } from '../nav';

/**
 * Org identity section of Settings. Cloud hides Access Control, which is where the
 * identity block lives on the other products, so it gets its own section here.
 */
export default function OrgDetails({ org }: OrgScope): JSX.Element {
  return (
    <PageContent>
      <OrgSettingsTabs active="org-details" />
      <OrgInfoHeader orgHandler={org} />
    </PageContent>
  );
}
