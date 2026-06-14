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
 * Types for the shared AI Agent chat surface (`components/AgentChat`), used by
 * both the Overview env-card body and the Test page.
 */

/** A single turn in the agent conversation. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Epoch millis the message was added — drives the displayed timestamp. */
  time: number;
}

/**
 * Endpoint-discovery + auth readiness of the chat, surfaced to the host so it
 * can render a status chip. `connected` means a `/chat` endpoint was found and
 * a test key obtained; `connecting` while discovering/authenticating; `error`
 * if authentication failed.
 */
export type AgentConnectionStatus = 'connecting' | 'connected' | 'error';
