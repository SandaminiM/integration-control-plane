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

import { Navigate, useParams } from 'react-router';
import type { JSX } from 'react';
import { componentUrl, orgHomeUrl, projectHomeUrl } from '../paths';
import type { Level } from '../nav';

/**
 * Stand-in for a page the current product hides (see `CLOUD_HIDDEN_NAV_IDS` in
 * `nav.ts`). The path stays registered so a hand-typed or bookmarked URL bounces
 * to the enclosing scope's landing page instead of rendering an empty shell.
 */
export default function HiddenPageRedirect({ level }: { level: Level }): JSX.Element {
  const { orgHandler = '', projectHandler = '', componentHandler = '' } = useParams();
  const to = level === 'components' ? componentUrl(orgHandler, projectHandler, componentHandler) : level === 'projects' ? projectHomeUrl(orgHandler, projectHandler) : orgHomeUrl(orgHandler);
  return <Navigate to={to} replace />;
}

/** Level-bound form for the resource MATRIX, whose `pages` slots take a page component. */
export function HiddenIntegrationPage(): JSX.Element {
  return <HiddenPageRedirect level="components" />;
}
