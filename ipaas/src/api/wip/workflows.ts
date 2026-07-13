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

import { choreoClient } from './httpClients';
import type { OrgWorkflowConfig, ReviewerDecisionRequest, WorkflowConfigRequest, WorkflowDefinition, WorkflowInstanceResponse, WorkflowReviewData } from '../../types/workflow';

// Workflow-management service (via choreoClient); the org is taken from the token.
const BASE = '/devwfmgt/v1.0';

export async function fetchWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
  return choreoClient.get<WorkflowDefinition[]>(`${BASE}/workflow/definitions`);
}

export async function fetchWorkflowConfigs(): Promise<OrgWorkflowConfig[]> {
  return choreoClient.get<OrgWorkflowConfig[]>(`${BASE}/workflow/configs`);
}

export async function createWorkflowConfig(input: WorkflowConfigRequest): Promise<OrgWorkflowConfig> {
  return choreoClient.post<OrgWorkflowConfig>(`${BASE}/workflow/configs`, input);
}

export async function updateWorkflowConfig(configId: string, input: WorkflowConfigRequest): Promise<OrgWorkflowConfig> {
  return choreoClient.put<OrgWorkflowConfig>(`${BASE}/workflow/configs/${encodeURIComponent(configId)}`, input);
}

// --- Workflow instances (approval requests) ---

/** Pending approval requests. */
export async function fetchWorkflowInstances(): Promise<WorkflowInstanceResponse[]> {
  return choreoClient.get<WorkflowInstanceResponse[]>(`${BASE}/workflow-instances?status=PENDING`);
}

/** Resolved approval requests (approved / rejected / cancelled). */
export async function fetchPastWorkflowInstances(): Promise<WorkflowInstanceResponse[]> {
  return choreoClient.get<WorkflowInstanceResponse[]>(`${BASE}/workflow-instances?status=APPROVED,REJECTED,CANCELLED`);
}

/** Extra review data (payload/metadata) shown in the drawer. */
export async function fetchWorkflowReviewData(workflowId: string): Promise<WorkflowReviewData> {
  return choreoClient.get<WorkflowReviewData>(`${BASE}/review/${encodeURIComponent(workflowId)}/data`);
}

/** Approve or reject a pending request. */
export async function reviewWorkflowInstance(workflowId: string, input: ReviewerDecisionRequest): Promise<void> {
  await choreoClient.post<void>(`${BASE}/review/${encodeURIComponent(workflowId)}/decision`, input);
}

/** Cancel a pending request the current user raised. */
export async function cancelWorkflowInstance(workflowId: string): Promise<void> {
  await choreoClient.post<void>(`${BASE}/workflow-instances/${encodeURIComponent(workflowId)}/cancellation`, {});
}
