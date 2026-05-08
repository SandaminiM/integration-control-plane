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

import { COPILOT_SESSION_KEY } from '../constants/copilot';
import { generateUUID } from './string';

export function getCopilotSessionId(): string | null {
  try {
    return sessionStorage.getItem(COPILOT_SESSION_KEY);
  } catch {
    return null;
  }
}

export function setCopilotSessionId(id: string): void {
  try {
    sessionStorage.setItem(COPILOT_SESSION_KEY, id);
  } catch {
    // no-op if sessionStorage is unavailable
  }
}

export function removeCopilotSessionId(): void {
  try {
    sessionStorage.removeItem(COPILOT_SESSION_KEY);
  } catch {
    // no-op if sessionStorage is unavailable
  }
}

export function getOrCreateCopilotSessionId(): string {
  const existing = getCopilotSessionId();
  if (existing) return existing;
  const newId = generateUUID();
  setCopilotSessionId(newId);
  return newId;
}
