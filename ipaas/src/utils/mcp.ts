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

import type { McpTool, McpToolParameter } from '../types/mcp';

/** Flatten an MCP tool's input schema into a list of parameters for display. */
export function getMcpToolParameters(tool: McpTool): McpToolParameter[] {
  const props = tool.inputSchema?.properties;
  if (!props) return [];
  const required = tool.inputSchema?.required ?? [];
  return Object.entries(props).map(([name, schema]) => ({
    name,
    type: schema.type,
    description: schema.description ?? '',
    required: required.includes(name),
  }));
}
