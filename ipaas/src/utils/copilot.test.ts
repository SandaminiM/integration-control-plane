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

import { afterEach, describe, expect, it } from 'vitest';
import { COPILOT_SESSION_KEY } from '../constants/copilot';
import { getCopilotSessionId, getOrCreateCopilotSessionId, removeCopilotSessionId, setCopilotSessionId } from './copilot';

afterEach(() => {
  sessionStorage.clear();
});

describe('getCopilotSessionId', () => {
  it('returns null when nothing is stored', () => {
    expect(getCopilotSessionId()).toBeNull();
  });

  it('returns the stored session id', () => {
    sessionStorage.setItem(COPILOT_SESSION_KEY, 'session-1');
    expect(getCopilotSessionId()).toBe('session-1');
  });
});

describe('setCopilotSessionId', () => {
  it('stores the session id under the copilot key', () => {
    setCopilotSessionId('session-2');
    expect(sessionStorage.getItem(COPILOT_SESSION_KEY)).toBe('session-2');
  });
});

describe('removeCopilotSessionId', () => {
  it('removes the stored session id', () => {
    sessionStorage.setItem(COPILOT_SESSION_KEY, 'session-3');
    removeCopilotSessionId();
    expect(sessionStorage.getItem(COPILOT_SESSION_KEY)).toBeNull();
  });

  it('is a no-op when nothing is stored', () => {
    expect(() => removeCopilotSessionId()).not.toThrow();
  });
});

describe('getOrCreateCopilotSessionId', () => {
  it('returns the existing session id when present', () => {
    sessionStorage.setItem(COPILOT_SESSION_KEY, 'existing-session');
    expect(getOrCreateCopilotSessionId()).toBe('existing-session');
  });

  it('creates and stores a new session id when none exists', () => {
    const id = getOrCreateCopilotSessionId();
    expect(id).toBeTruthy();
    expect(sessionStorage.getItem(COPILOT_SESSION_KEY)).toBe(id);
  });
});
