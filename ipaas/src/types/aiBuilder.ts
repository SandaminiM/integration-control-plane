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

import type { PrebuiltIntegration } from './prebuilt';

export type PipelineStage = 'context' | 'validation' | 'prebuilt' | 'connector_check' | 'plan';

export type StepStatus = 'started' | 'done';

export interface StepEvent {
  stage: PipelineStage;
  status: StepStatus;
}

export interface AiIntegrationPlanStep {
  title: string;
  description: string;
}

export interface PrebuiltMatchResponse {
  type: 'prebuilt';
  message?: string;
  integrations: PrebuiltIntegration[];
}

export interface CustomIntegrationResponse {
  type: 'custom';
  message?: string;
  title: string;
  steps: AiIntegrationPlanStep[];
}

export interface UnsupportedResponse {
  type: 'unsupported';
  message?: string;
  unsupportedServices?: string[];
}

export interface InvalidPromptResponse {
  type: 'invalid';
  message?: string;
}

export interface AiIntegrationErrorResponse {
  type: 'error';
  message: string;
}

export type AiIntegrationBuilderResponse =
  | PrebuiltMatchResponse
  | CustomIntegrationResponse
  | UnsupportedResponse
  | InvalidPromptResponse
  | AiIntegrationErrorResponse;

export interface ConversationTurn {
  id: string;
  query: string;
  response: AiIntegrationBuilderResponse;
}

/** An example prompt chip: `short` labels the chip, `full` is inserted on click. */
export interface ExamplePrompt {
  short: string;
  full: string;
}
