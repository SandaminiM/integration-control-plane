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
 * Endpoint network-visibility translation, in both directions.
 *
 * Two domain modules need it — `deployments.ts` reads visibility off the workload endpoints and
 * `components.ts` writes it back — so it lives on its own rather than in either of them, following
 * `_environmentShape.ts`.
 *
 * The wire value is the OpenChoreo endpoint-visibility enum, which is what the BFF stores on the
 * Workload. Its term for org-wide is `internal`; the console calls the same thing "Organization".
 * Reading `organization` off the wire finds nothing, which is what left an org-visible endpoint
 * showing a raw `internal` chip with no box ticked in the edit form.
 */

/** Wire value -> the label shown in the UI. */
export const VISIBILITY_LABEL: Record<string, string> = {
  external: 'Public',
  internal: 'Organization',
  project: 'Project',
};

/** UI label -> the wire value. */
export const VISIBILITY_WIRE: Record<string, string> = {
  Public: 'external',
  Organization: 'internal',
  Project: 'project',
};

/** Labels the BFF cannot map are passed through, so it rejects them rather than silently storing a wrong one. */
export const toVisibilityWire = (label: string): string => VISIBILITY_WIRE[label] ?? label;

export const toVisibilityLabel = (wire: string): string => VISIBILITY_LABEL[wire] ?? wire;
