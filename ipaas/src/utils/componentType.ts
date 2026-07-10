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

export interface ComponentTypeFlags {
  // Proxy — handled separately; full proxy deploy UI is not yet implemented
  isProxy: boolean; // proxy, gitProxy

  // Group A — Service / Integration as API (commit-based build)
  isService: boolean; // ballerinaService, miApiService
  isRestApi: boolean; // restAPI, miRestApi

  // Group B — BYOI (image-based, no build step)
  isByoi: boolean; // byoiService

  // Group C — Automation / Scheduled task
  isAutomation: boolean; // scheduledTask, miCronjob

  // Composite helpers
  isCommitBased: boolean; // any type that goes through the build pipeline (A + C)
  isImageBased: boolean; // same as isByoi, kept for symmetry
  isDeployable: boolean; // any type with a full deploy UI (A + B + C, excludes proxy)
}

/**
 * Derives a set of boolean flags from a component's `displayType` (and optionally
 * `componentSubType`).  All unknown / unsupported types return all-false flags —
 * the Deploy page should show a "Coming Soon" fallback for those.
 *
 * NOTE: legacy utility. Per the agreed architecture (see the
 * `icp-integration-architecture` memory), integration-type identification
 * must happen exactly once via `identifyIntegration`, never re-derived here.
 * Do NOT add new type discriminators (e.g. file-integration) to this function —
 * they belong in `identifyIntegration` and are consumed via
 * `useIntegrationIdentity`. This utility exists only because the Deploy
 * subsystem hasn't been migrated to the new architecture yet; a future
 * Deploy migration will delete it.
 */
export function getComponentTypeFlags(displayType: string, componentSubType?: string | null): ComponentTypeFlags {
  const isProxy = displayType === 'proxy' || displayType === 'gitProxy';
  const isService = displayType === 'ballerinaService' || displayType === 'miApiService';
  const isRestApi = displayType === 'restAPI' || displayType === 'miRestApi';
  // BYOI = image-based, no source build. `byoiCronjob` (e.g. RAG ingestion) is
  // both BYOI (image details, no commit) and a scheduled task (cron/executions).
  const isByoi = displayType === 'byoiService' || displayType === 'byoiCronjob';
  const isAutomation = displayType === 'scheduledTask' || displayType === 'miCronjob' || displayType === 'byoiCronjob';

  // Image-based types never go through the commit build pipeline, even the
  // cronjob one — so exclude BYOI from the commit-based group.
  const isCommitBased = (isService || isRestApi || isAutomation) && !isByoi;
  const isImageBased = isByoi;
  const isDeployable = isCommitBased || isImageBased;

  // Reserved for future sub-type distinctions (e.g. aiAgent, MCP).
  void componentSubType;

  return { isProxy, isService, isRestApi, isByoi, isAutomation, isCommitBased, isImageBased, isDeployable };
}
