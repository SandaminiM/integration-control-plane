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

/** An available workflow type that an org can require approval for. */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
}

/** An org's saved configuration for a workflow type. */
export interface OrgWorkflowConfig {
  id: string;
  orgId: string;
  workflowDefinitionId: string;
  enabled: boolean;
  /** Approver role handles (always includes `admin`). */
  assigneeRoles: string[];
  /** Approver user ids. */
  assignees: string[];
  notifyEmails?: string[];
  formatRequestData?: boolean;
  externalWorkflowEngineEndpoint?: string;
}

/** Create/update body for a workflow config. */
export interface WorkflowConfigRequest {
  workflowDefinitionId: string;
  enabled: boolean;
  assigneeRoles: string[];
  assignees: string[];
  formatRequestData?: boolean;
  externalWorkflowEngineEndpoint?: string;
}
