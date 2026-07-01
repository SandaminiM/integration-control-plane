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

import { CircularProgress, PageContent } from '@wso2/oxygen-ui';
import type { JSX } from 'react';
import AutomationTest from './AutomationTest';
import ComingSoon from './ComingSoon';
import McpTest from './McpTest';
import { useComponentByHandler } from '../hooks/useComponents';
import { useIntegrationIdentity } from '../hooks/useIntegrationIdentity';
import { useProjectId } from '../hooks/useProjects';
import type { ComponentScope } from '../nav';

/**
 * The component "Test" page dispatches by integration type (identified once via
 * `useIntegrationIdentity`): Automation → AutomationTest, MCP → McpTest, everything
 * else → Coming Soon. Mirrors the per-type rendering used across Integration surfaces.
 */
export default function ComponentTest(scope: ComponentScope): JSX.Element {
  const { projectId } = useProjectId(scope.project);
  const { data: comp, isLoading } = useComponentByHandler(projectId, scope.component);
  const identity = useIntegrationIdentity(comp ?? undefined);

  if (isLoading) {
    return (
      <PageContent>
        <CircularProgress sx={{ display: 'block', mx: 'auto', py: 8 }} />
      </PageContent>
    );
  }

  if (identity?.type === 'automation') return <AutomationTest {...scope} />;
  if (identity?.type === 'mcp-server' || identity?.type === 'mcp-proxy') return <McpTest {...scope} />;
  return <ComingSoon title="Coming Soon" description="Testing tools are currently under development." />;
}
