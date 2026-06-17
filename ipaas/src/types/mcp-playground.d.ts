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

/**
 * Minimal type surface for the `@wso2-org/mcp-playground` package (which ships
 * no types). Mirrors the props devant passes to its `MCPInspector`.
 */
declare module '@wso2-org/mcp-playground' {
  import type { ComponentType } from 'react';

  interface MCPInspectorProps {
    /** The MCP endpoint to connect to (e.g. `${publicUrl}/mcp`). */
    url: string;
    /** Auth token sent in the `headerName` header. */
    token?: string;
    /** Header carrying the token (devant uses `test-key`). */
    headerName?: string;
    /** Shows a loading state while the token is being fetched. */
    isTokenFetching?: boolean;
    /** Whether the header name is set by the host app rather than the user. */
    shouldSetHeaderNameExternally?: boolean;
    /** Theme tokens for the inspector UI. */
    theme?: unknown;
  }

  const MCPInspector: ComponentType<MCPInspectorProps>;
  export default MCPInspector;
}
