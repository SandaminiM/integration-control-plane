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

import type { CopilotTokenCache } from './types';

const TOKEN_EXCHANGE_PATH = '/auth-api/v1.0/auth/token-exchange';

/** 5-minute buffer — refresh before actual expiry */
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/** In-memory singleton so we don't re-exchange on every LLM call */
let tokenCache: CopilotTokenCache | null = null;

/** In-flight exchange promise — prevents parallel exchanges on concurrent calls */
let inflight: Promise<CopilotTokenCache> | null = null;

function isExpired(cache: CopilotTokenCache): boolean {
  return cache.expiresAt - EXPIRY_BUFFER_MS < Date.now();
}

// POST {base}/auth-api/v1.0/auth/token-exchange { subjectToken } → { access_token, expires_in }
async function exchangeToken(stsToken: string): Promise<CopilotTokenCache> {
  const baseUrl = window.API_CONFIG.integrationBuilderCopilotBaseUrl;
  const url = `${baseUrl}${TOKEN_EXCHANGE_PATH}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subjectToken: stsToken }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body?.message ||
        body?.reason ||
        `Token exchange failed (${response.status})`
    );
  }

  const json = await response.json();
  return {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

/** Returns a valid Copilot token, refreshing within the expiry buffer and deduping concurrent calls. */
export async function getCopilotToken(
  getToken: () => Promise<string>
): Promise<string> {
  if (tokenCache && !isExpired(tokenCache)) {
    return tokenCache.accessToken;
  }

  if (inflight) {
    const result = await inflight;
    return result.accessToken;
  }

  inflight = (async () => {
    const stsToken = await getToken();
    const result = await exchangeToken(stsToken);
    tokenCache = result;
    return result;
  })().finally(() => {
    inflight = null;
  });

  const result = await inflight;
  return result.accessToken;
}

/** Clear the cached token — call on logout or 401 after retry */
export function clearCopilotTokenCache(): void {
  tokenCache = null;
  inflight = null;
}
