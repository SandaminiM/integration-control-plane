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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  addGeneration,
  updateGeneration,
  getChatHistoryForLLM,
  populateHistoryForLlm,
  clearChatHistory,
} from './chatStorage';
import type { ModelMessage } from './types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('chatStorage', () => {
  const testProjectId = 'test-project-123';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('adds a generation and retrieves its ID', () => {
    const generationId = addGeneration(testProjectId, 'sync Salesforce to Slack');

    expect(generationId).toBeTruthy();
    expect(typeof generationId).toBe('string');
  });

  it('updates a generation with model messages and response type', () => {
    const generationId = addGeneration(testProjectId, 'sync Salesforce to Slack');

    const modelMessages: ModelMessage[] = [
      { role: 'user', content: 'sync Salesforce to Slack' },
      { role: 'assistant', content: 'here is your plan' },
    ];

    updateGeneration(testProjectId, generationId, {
      modelMessages,
      responseType: 'custom',
    });

    const history = getChatHistoryForLLM(testProjectId);
    expect(history).toHaveLength(2);
    expect(history[0].role).toBe('user');
    expect(history[0].content).toBe('sync Salesforce to Slack');
    expect(history[1].role).toBe('assistant');
    expect(history[1].content).toBe('here is your plan');
  });

  it('stores and retrieves multiple generations in order', () => {
    const gen1 = addGeneration(testProjectId, 'first query');
    const gen2 = addGeneration(testProjectId, 'second query');

    updateGeneration(testProjectId, gen1, {
      modelMessages: [
        { role: 'user', content: 'first query' },
        { role: 'assistant', content: 'response 1' },
      ],
      responseType: 'custom',
    });

    updateGeneration(testProjectId, gen2, {
      modelMessages: [
        { role: 'user', content: 'second query' },
        { role: 'assistant', content: 'response 2' },
      ],
      responseType: 'custom',
    });

    const history = getChatHistoryForLLM(testProjectId);
    expect(history).toHaveLength(4);
    expect(history[0].content).toBe('first query');
    expect(history[1].content).toBe('response 1');
    expect(history[2].content).toBe('second query');
    expect(history[3].content).toBe('response 2');
  });

  it('populateHistoryForLlm converts ModelMessage to flat messages', () => {
    const generationId = addGeneration(testProjectId, 'test query');

    const modelMessages: ModelMessage[] = [
      { role: 'user', content: 'test query' },
      { role: 'assistant', content: 'test response' },
    ];

    updateGeneration(testProjectId, generationId, {
      modelMessages,
      responseType: 'custom',
    });

    const history = getChatHistoryForLLM(testProjectId);
    const flatMessages = populateHistoryForLlm(history);

    expect(flatMessages).toHaveLength(2);
    expect(flatMessages[0]).toEqual({
      role: 'user',
      content: 'test query',
    });
    expect(flatMessages[1]).toEqual({
      role: 'assistant',
      content: 'test response',
    });
  });

  it('handles text content blocks in messages', () => {
    const generationId = addGeneration(testProjectId, 'test query');

    const modelMessages: ModelMessage[] = [
      { role: 'user', content: 'test query' },
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'part 1' },
          { type: 'text', text: ' part 2' },
        ],
      },
    ];

    updateGeneration(testProjectId, generationId, {
      modelMessages,
      responseType: 'custom',
    });

    const history = getChatHistoryForLLM(testProjectId);
    const flatMessages = populateHistoryForLlm(history);

    expect(flatMessages).toHaveLength(2);
    expect(flatMessages[1].content).toBe('part 1 part 2');
  });

  it('clears chat history for a project', () => {
    const generationId = addGeneration(testProjectId, 'test query');

    updateGeneration(testProjectId, generationId, {
      modelMessages: [
        { role: 'user', content: 'test query' },
        { role: 'assistant', content: 'response' },
      ],
      responseType: 'custom',
    });

    let history = getChatHistoryForLLM(testProjectId);
    expect(history).toHaveLength(2);

    clearChatHistory(testProjectId);

    history = getChatHistoryForLLM(testProjectId);
    expect(history).toHaveLength(0);
  });

  it('maintains separate workspaces for different projects', () => {
    const projectId1 = 'project-1';
    const projectId2 = 'project-2';

    const gen1 = addGeneration(projectId1, 'query 1');
    const gen2 = addGeneration(projectId2, 'query 2');

    updateGeneration(projectId1, gen1, {
      modelMessages: [
        { role: 'user', content: 'query 1' },
        { role: 'assistant', content: 'response 1' },
      ],
      responseType: 'custom',
    });

    updateGeneration(projectId2, gen2, {
      modelMessages: [
        { role: 'user', content: 'query 2' },
        { role: 'assistant', content: 'response 2' },
      ],
      responseType: 'custom',
    });

    const history1 = getChatHistoryForLLM(projectId1);
    const history2 = getChatHistoryForLLM(projectId2);

    expect(history1).toHaveLength(2);
    expect(history2).toHaveLength(2);
    expect(history1[0].content).toBe('query 1');
    expect(history2[0].content).toBe('query 2');
  });
});
