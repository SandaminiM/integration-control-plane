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
 * Types for the "convert an existing HTTP API into an MCP proxy" flow. The wire
 * shapes mirror devant exactly (same backend): the `generate-mcp-features`
 * request/response and the APIM create-API payload.
 */

/** One selected source-API operation, sent to `generate-mcp-features`. */
export interface McpProxyMetadata {
  /** The source APIM API id. */
  id: string;
  /** HTTP verb of the source operation (e.g. "GET"). */
  verb: string;
  /** Operation path of the source operation (e.g. "/users/{id}"). */
  target: string;
  /** Always "Tool" — each operation becomes an MCP tool. */
  mcpFeature: 'Tool';
}

/**
 * An MCP feature/operation returned by `generate-mcp-features`. Passed verbatim
 * as the `operations` of the created MCP API, so it's intentionally loose.
 */
export type McpFeatureOperation = Record<string, unknown>;

/** Inputs the create-MCP-API call needs; the rest of the payload is fixed. */
export interface CreateMcpApiInput {
  name: string;
  displayName: string;
  version: string;
  description: string;
  /** API base path / context. */
  context: string;
  /** Subscription policies (e.g. ["Bronze"]). */
  policies: string[];
  /** MCP feature operations from `generate-mcp-features`. */
  operations: McpFeatureOperation[];
  /** Backend endpoint URL (devant uses https://localhost:9001). */
  endpoint: string;
  projectId: string;
}

/** Created APIM API — the fields the proxy component needs. */
export interface CreatedMcpApi {
  id: string;
  version: string;
}

/**
 * Input for the proxy `createComponent` GraphQL mutation. Mirrors devant's
 * `createChoreoComponent` for MCP: a `proxy` component referencing the created
 * APIM API by `apiId`, with `componentSubType: MCP` and no source repo.
 */
export interface CreateMcpProxyComponentInput {
  name: string;
  displayName: string;
  description: string;
  orgHandler: string;
  projectId: string;
  /** The created APIM API id this proxy fronts. */
  apiId: string;
  /** The created APIM API version (proxies keep the API version). */
  version: string;
}

/** Proxy-deployer responses (loose — only the fields we read). */
export interface ProxyDeployerResponse {
  requestId?: string;
  status?: string;
}

export interface ProxyBuild {
  id: string;
  status?: string;
  conclusion?: string;
}

export interface ProxyBuildsResponse {
  builds?: ProxyBuild[];
}
