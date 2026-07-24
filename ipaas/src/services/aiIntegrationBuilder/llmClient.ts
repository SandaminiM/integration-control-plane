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

import { getCopilotToken, clearCopilotTokenCache } from './tokenExchange';
import type { AnthropicRequest, AnthropicResponse } from './types';

const LLM_PATH = '/llm-api/v1.0/claude/messages';

async function fetchWithAuth(body: AnthropicRequest, getToken: () => Promise<string>, signal?: AbortSignal): Promise<AnthropicResponse> {
  const baseUrl = window.API_CONFIG.integrationBuilderCopilotBaseUrl;
  const url = `${baseUrl}${LLM_PATH}`;

  const doFetch = async (token: string): Promise<Response> =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-product': 'bi',
        'x-usage-context': 'copilot',
        'x-metadata': JSON.stringify({
          isCloudEditor: true,
          product: 'devant',
        }),
      },
      body: JSON.stringify(body),
      signal,
    });

  let token = await getCopilotToken(getToken);
  let response = await doFetch(token);

  if (response.status === 401) {
    // Token expired mid-session — clear cache, re-exchange once, retry
    clearCopilotTokenCache();
    token = await getCopilotToken(getToken);
    response = await doFetch(token);

    if (response.status === 401) {
      throw new Error('Authentication failed. Please sign in again.');
    }
  }

  if (response.status === 429) {
    const err = new Error('Usage limit exceeded. Please try again later.');
    Object.defineProperty(err, 'name', { value: 'UsageLimitError' });
    throw err;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`LLM request failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<AnthropicResponse>;
}

/** Calls the LLM proxy and returns the parsed JSON plus the raw content blocks. */
export async function callLlm<T>(systemPrompt: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>, getToken: () => Promise<string>, signal?: AbortSignal): Promise<{ parsed: T; rawContent: Array<{ type: 'text'; text: string }> }> {
  const request: AnthropicRequest = {
    model: window.API_CONFIG.integrationBuilderLlmModel,
    max_tokens: window.API_CONFIG.integrationBuilderMaxTokens,
    temperature: 0,
    system: systemPrompt,
    messages,
  };

  const response = await fetchWithAuth(request, getToken, signal);

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) {
    throw new Error('LLM returned no text content');
  }

  let parsed: T;
  try {
    // Strip markdown code fences if model wraps JSON in ```json ... ```
    const raw = textBlock.text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse LLM response as JSON: ${textBlock.text}`);
  }

  return {
    parsed,
    rawContent: response.content as Array<{ type: 'text'; text: string }>,
  };
}
