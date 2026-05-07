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

import { authenticatedFetch } from '../auth/tokenManager';
import { copilotDatacollectorBaseUrl } from '../config/api';
import { COPILOT_DEFAULT_PERSPECTIVE } from '../constants/copilot';
import { getOrCreateCopilotSessionId } from '../utils/copilot';

export async function getAiCopilotAnswer(copilotUrl: string, nlQuery: string, abortSignal: AbortSignal, correlationId: string, chatContext: Record<string, unknown> = {}): Promise<Response> {
  const sessionId = getOrCreateCopilotSessionId();

  return authenticatedFetch(copilotUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': sessionId,
      'correlation-id': correlationId,
    },
    body: JSON.stringify({
      question: nlQuery,
      version: 'v2.0',
      current_datetime: new Date().toISOString(),
      chat_context: chatContext,
      perspective: COPILOT_DEFAULT_PERSPECTIVE,
      product_origin: 'DEVANT',
    }),
    signal: abortSignal,
  });
}

export async function provideCopilotFeedback(orgId: string, feedback: boolean, correlationId: string): Promise<void> {
  const sessionId = getOrCreateCopilotSessionId();
  const url = `${copilotDatacollectorBaseUrl()}/feedback`;
  const res = await authenticatedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      org_id: orgId,
      session_id: sessionId,
      correlation_id: correlationId,
      feedback: feedback ? 1 : 0,
    }),
  });
  if (!res.ok) throw new Error('Failed to submit copilot feedback');
}

export async function getCopilotDataCollectionPermission(orgId: string): Promise<{ status: string }> {
  const url = `${copilotDatacollectorBaseUrl()}/permission?org_id=${encodeURIComponent(orgId)}`;
  const res = await authenticatedFetch(url);
  if (!res.ok) throw new Error('Failed to get copilot data collection permission');
  return res.json() as Promise<{ status: string }>;
}

export async function updateCopilotDataCollectionPermission(orgId: string, disabled: boolean): Promise<void> {
  const url = `${copilotDatacollectorBaseUrl()}/disable`;
  const res = await authenticatedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ org_id: orgId, disabled }),
  });
  if (!res.ok) throw new Error('Failed to update copilot data collection permission');
}
