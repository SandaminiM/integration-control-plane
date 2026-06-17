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

import type { JSX } from 'react';
import ComingSoon from './ComingSoon';
import McpPlaygroundInspector from './McpPlaygroundInspector';
import type { ComponentScope } from '../nav';

/**
 * Temporary kill-switch for the MCP playground. While `false`, the Test page
 * shows the Coming Soon placeholder. Flip to `true` (after installing the
 * optional `@wso2-org/mcp-playground` package and uncommenting the MCPInspector
 * import + usage in McpPlaygroundInspector) to show the playground.
 */
const isPlaygroundEnabled: boolean = false;

/** MCP Server "Test" page — Coming Soon, or the MCP playground when enabled. */
export default function McpTest(scope: ComponentScope): JSX.Element {
  if (!isPlaygroundEnabled) {
    return <ComingSoon title="Coming Soon" description="Testing tools are currently under development." />;
  }
  return <McpPlaygroundInspector scope={scope} />;
}
