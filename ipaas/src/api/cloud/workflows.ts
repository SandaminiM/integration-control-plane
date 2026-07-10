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

import type { OrgWorkflowConfig, ReviewerDecisionRequest, WorkflowConfigRequest, WorkflowDefinition, WorkflowInstanceResponse, WorkflowReviewData } from '../../types/workflow';

// Intentionally a stub (the standard cloud-stub contract — see src/api/AGENTS.md).
const ni = (name: string): never => {
  throw new Error(`[cloud] workflows.${name}: not implemented`);
};

export const fetchWorkflowDefinitions = (): Promise<WorkflowDefinition[]> => ni('fetchWorkflowDefinitions');
export const fetchWorkflowConfigs = (): Promise<OrgWorkflowConfig[]> => ni('fetchWorkflowConfigs');
export const createWorkflowConfig = (_input: WorkflowConfigRequest): Promise<OrgWorkflowConfig> => ni('createWorkflowConfig');
export const updateWorkflowConfig = (_configId: string, _input: WorkflowConfigRequest): Promise<OrgWorkflowConfig> => ni('updateWorkflowConfig');
export const fetchWorkflowInstances = (): Promise<WorkflowInstanceResponse[]> => ni('fetchWorkflowInstances');
export const fetchPastWorkflowInstances = (): Promise<WorkflowInstanceResponse[]> => ni('fetchPastWorkflowInstances');
export const fetchWorkflowReviewData = (_workflowId: string): Promise<WorkflowReviewData> => ni('fetchWorkflowReviewData');
export const reviewWorkflowInstance = (_workflowId: string, _input: ReviewerDecisionRequest): Promise<void> => ni('reviewWorkflowInstance');
export const cancelWorkflowInstance = (_workflowId: string): Promise<void> => ni('cancelWorkflowInstance');
