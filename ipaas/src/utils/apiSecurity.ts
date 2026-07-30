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

/** Helpers for the cloud API security & consumption surface. */

/**
 * Turn a raw BFF failure into a message a user can act on.
 *
 * The cloud client throws `HTTP {status}: {body}` (see `api/cloud/_client.ts`),
 * and the body is usually a gateway string like `404 page not found` — useless
 * in a dialog. This maps the status to plain wording and falls back to the
 * caller's context sentence when the status carries nothing specific.
 *
 * Raw bodies are never surfaced: they leak internal routing detail and read as
 * a crash to the user.
 */
export function friendlyApiError(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const status = Number(/^HTTP (\d{3})/.exec(raw)?.[1]);

  switch (status) {
    case 400:
      return `${fallback} The request was rejected — check the values and try again.`;
    case 401:
      return 'Your session has expired. Sign in again and retry.';
    case 403:
      return 'You do not have permission to change this API’s security configuration.';
    case 404:
      return `${fallback} This endpoint is not exposed as an API on the gateway yet.`;
    case 409:
      return `${fallback} The endpoint is not exposed as an API yet — expose it first.`;
    case 503:
      return 'The API gateway is unavailable right now. Try again in a moment.';
    default:
      break;
  }

  if (status >= 500) return 'Something went wrong on the server. Try again in a moment.';
  // fetch() rejects with a TypeError before any status exists.
  if (/failed to fetch|networkerror|load failed/i.test(raw)) return 'Could not reach the server. Check your connection and try again.';
  return fallback;
}
