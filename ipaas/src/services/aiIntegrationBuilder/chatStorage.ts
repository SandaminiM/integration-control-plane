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

import type { AiIntegrationPlanGeneration, AiIntegrationBuilderWorkspaceState, AiIntegrationBuilderThreadState, ModelMessage } from './types';

const STORAGE_PREFIX = 'ai-integration-builder-workspace-';
const THREAD_ID = 'default';

function storageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function loadWorkspace(projectId: string): AiIntegrationBuilderWorkspaceState {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.thread?.generations && Array.isArray(parsed.thread.generations)) {
        return parsed;
      }
    }
  } catch {
    // corrupt storage — start fresh
  }

  const thread: AiIntegrationBuilderThreadState = {
    id: THREAD_ID,
    generations: [],
    updatedAt: Date.now(),
  };
  return { projectId, thread };
}

function saveWorkspace(state: AiIntegrationBuilderWorkspaceState): void {
  try {
    localStorage.setItem(storageKey(state.projectId), JSON.stringify(state));
  } catch {
    // quota exceeded — silently skip persistence
  }
}

/** Adds a generation before the pipeline runs; returns its id for updateGeneration(). */
export function addGeneration(projectId: string, userPrompt: string): string {
  const state = loadWorkspace(projectId);
  const id = generateId();

  const generation: AiIntegrationPlanGeneration = {
    id,
    userPrompt,
    modelMessages: [],
    timestamp: Date.now(),
    responseType: 'error', // overwritten by updateGeneration on completion
  };

  state.thread.generations.push(generation);
  state.thread.updatedAt = Date.now();
  saveWorkspace(state);
  return id;
}

/** Updates a generation's messages/responseType after the pipeline completes or aborts. */
export function updateGeneration(projectId: string, generationId: string, updates: Partial<Pick<AiIntegrationPlanGeneration, 'modelMessages' | 'responseType'>>): void {
  const state = loadWorkspace(projectId);
  const gen = state.thread.generations.find((g) => g.id === generationId);
  if (!gen) return;

  if (updates.modelMessages !== undefined) gen.modelMessages = updates.modelMessages;
  if (updates.responseType !== undefined) gen.responseType = updates.responseType;

  state.thread.updatedAt = Date.now();
  saveWorkspace(state);
}

/** Flattens all generations' model messages in chronological order. */
export function getChatHistoryForLLM(projectId: string): ModelMessage[] {
  const state = loadWorkspace(projectId);
  const messages: ModelMessage[] = [];

  for (const gen of state.thread.generations) {
    if (gen.modelMessages.length > 0) {
      messages.push(...gen.modelMessages);
    }
  }

  return messages;
}

/** Maps stored messages to the Anthropic array shape, keeping only user/assistant roles. */
export function populateHistoryForLlm(history: ModelMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return history
    .filter((m): m is ModelMessage & { role: 'user' | 'assistant' } => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : m.content.map((b) => b.text).join(''),
    }));
}

export function clearChatHistory(projectId: string): void {
  localStorage.removeItem(storageKey(projectId));
}
