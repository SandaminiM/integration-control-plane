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

// Wire shapes and internal schemas — private to the aiIntegrationBuilder service
// layer. Domain/UI types (responses, ConversationTurn, StepEvent, PipelineStage)
// live in src/types/aiBuilder.ts.

import type { AiIntegrationPlanStep } from '../../types/aiBuilder';

export interface TextContentBlock {
  type: 'text';
  text: string;
}

export type MessageContent = string | TextContentBlock[];

export interface ModelMessage {
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
}

export interface AnthropicRequest {
  model: string;
  max_tokens: number;
  temperature: number;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: MessageContent }>;
}

export interface AnthropicResponse {
  id: string;
  role: 'assistant';
  content: TextContentBlock[];
  usage: { input_tokens: number; output_tokens: number };
}

export interface CopilotTokenCache {
  accessToken: string;
  /** ms since epoch — exchange is refreshed 5 min before this */
  expiresAt: number;
}

// Structured LLM output schemas

export interface ValidationOutput {
  type: 'valid' | 'invalid';
  message?: string;
}

export interface PrebuiltMatchOutput {
  match: boolean;
  selected_index?: number;
  message?: string;
}

export interface HttpFallbackService {
  service: string;
  role: string;
  reason?: string;
}

export interface ConnectorCheckOutput {
  required_connectors: string[];
  http_fallback_services: HttpFallbackService[];
  unsupported_services: string[];
  is_doable: boolean;
  reason?: string;
}

export interface PlanOutput {
  status: 'plan' | 'unsupported';
  message: string;
  title?: string;
  steps?: AiIntegrationPlanStep[];
}

// Chat storage state (localStorage-backed thread per project)

export type GenerationResponseType = 'prebuilt' | 'custom' | 'unsupported' | 'invalid' | 'error' | 'aborted';

export interface AiIntegrationPlanGeneration {
  id: string;
  userPrompt: string;
  modelMessages: ModelMessage[];
  timestamp: number;
  responseType: GenerationResponseType;
}

export interface AiIntegrationBuilderThreadState {
  id: string;
  generations: AiIntegrationPlanGeneration[];
  updatedAt: number;
}

export interface AiIntegrationBuilderWorkspaceState {
  projectId: string;
  thread: AiIntegrationBuilderThreadState;
}

export interface BallerinaConnector {
  organization: string;
  name: string;
  summary: string;
}
