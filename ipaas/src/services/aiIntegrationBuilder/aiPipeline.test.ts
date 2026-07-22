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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runAiIntegrationPipeline } from './aiPipeline';
import * as llmClient from './llmClient';
import * as connectorsCache from './connectorsCache';
import { PIPELINE_STAGE, STEP_STATUS } from '../../constants/aiBuilder';
import type { PrebuiltIntegration } from '../../types/prebuilt';

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

describe('runAiIntegrationPipeline', () => {
  const mockGetToken = vi.fn(async () => 'mock-token');
  const testProjectId = 'test-project-123';
  const mockPrebuilts: PrebuiltIntegration[] = [
    {
      displayName: 'Salesforce to Slack',
      description: 'Send Slack notifications for Salesforce events',
      componentType: 'event-handler',
      applications: ['Salesforce', 'Slack'],
      tags: ['notification', 'salesforce'],
      bidirectional: false,
      buildPack: 'ballerina',
      repositoryUrl: 'https://github.com/test/repo',
      componentPath: 'salesforce_slack',
      imageUrl: 'https://example.com/image.png',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('emits stage events in correct order', async () => {
    const events: Array<{ stage: string; status: string }> = [];
    const onStepEvent = vi.fn((event) => events.push(event));

    vi.spyOn(llmClient, 'callLlm').mockResolvedValueOnce({
      parsed: { type: 'invalid', message: 'Not an integration' },
      rawContent: [{ type: 'text', text: 'Not an integration' }],
    });

    await runAiIntegrationPipeline(
      'help me with passwords',
      testProjectId,
      mockGetToken,
      mockPrebuilts,
      onStepEvent
    );

    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0].stage).toBe(PIPELINE_STAGE.Context);
    expect(events[0].status).toBe(STEP_STATUS.Started);
    expect(events[1].stage).toBe(PIPELINE_STAGE.Context);
    expect(events[1].status).toBe(STEP_STATUS.Done);
    expect(events[2].stage).toBe(PIPELINE_STAGE.Validation);
    expect(events[2].status).toBe(STEP_STATUS.Started);
  });

  it('returns invalid response when validation fails', async () => {
    vi.spyOn(llmClient, 'callLlm').mockResolvedValueOnce({
      parsed: { type: 'invalid', message: 'Not an integration scenario' },
      rawContent: [{ type: 'text', text: 'Not an integration scenario' }],
    });

    const result = await runAiIntegrationPipeline(
      'help me with passwords',
      testProjectId,
      mockGetToken,
      mockPrebuilts
    );

    expect(result.type).toBe('invalid');
    expect(result.message).toBe('Not an integration scenario');
  });

  it('returns prebuilt response with matching integration', async () => {
    vi.spyOn(llmClient, 'callLlm')
      .mockResolvedValueOnce({
        parsed: { type: 'valid' },
        rawContent: [{ type: 'text', text: '{"type":"valid"}' }],
      })
      .mockResolvedValueOnce({
        parsed: { match: true, selected_index: 0, message: 'Found a match' },
        rawContent: [{ type: 'text', text: '{"match":true,"selected_index":0}' }],
      });

    const result = await runAiIntegrationPipeline(
      'Send Slack notifications when Salesforce records update',
      testProjectId,
      mockGetToken,
      mockPrebuilts
    );

    expect(result.type).toBe('prebuilt');
    if (result.type === 'prebuilt') {
      expect(result.integrations).toHaveLength(1);
      expect(result.integrations[0].displayName).toBe('Salesforce to Slack');
    }
  });

  it('returns custom response when validation passes but no prebuilt matches', async () => {
    vi.spyOn(llmClient, 'callLlm')
      .mockResolvedValueOnce({
        parsed: { type: 'valid' },
        rawContent: [{ type: 'text', text: '{"type":"valid"}' }],
      })
      .mockResolvedValueOnce({
        parsed: { match: false },
        rawContent: [{ type: 'text', text: '{"match":false}' }],
      })
      .mockResolvedValueOnce({
        parsed: {
          required_connectors: ['ballerinax/github', 'ballerinax/slack'],
          http_fallback_services: [],
          unsupported_services: [],
          is_doable: true,
        },
        rawContent: [{ type: 'text', text: '{"is_doable":true}' }],
      })
      .mockResolvedValueOnce({
        parsed: {
          status: 'plan',
          message: 'Here is your plan',
          title: 'GitHub to Slack Integration',
          steps: [
            {
              title: 'Trigger on GitHub Event',
              description: 'Listen for push events on the repository.',
            },
          ],
        },
        rawContent: [{ type: 'text', text: '{"status":"plan"}' }],
      });

    vi.spyOn(connectorsCache, 'getConnectors').mockResolvedValueOnce([
      { organization: 'ballerinax', name: 'github', summary: 'GitHub integration' },
      { organization: 'ballerinax', name: 'slack', summary: 'Slack integration' },
    ]);

    const result = await runAiIntegrationPipeline(
      'Send Slack notification when GitHub code is pushed',
      testProjectId,
      mockGetToken,
      mockPrebuilts
    );

    expect(result.type).toBe('custom');
    if (result.type === 'custom') {
      expect(result.title).toBe('GitHub to Slack Integration');
      expect(result.steps).toHaveLength(1);
    }
  });

  it('returns unsupported response when connectors are missing', async () => {
    vi.spyOn(llmClient, 'callLlm')
      .mockResolvedValueOnce({
        parsed: { type: 'valid' },
        rawContent: [{ type: 'text', text: '{"type":"valid"}' }],
      })
      .mockResolvedValueOnce({
        parsed: { match: false },
        rawContent: [{ type: 'text', text: '{"match":false}' }],
      })
      .mockResolvedValueOnce({
        parsed: {
          required_connectors: ['ballerinax/github'],
          http_fallback_services: [],
          unsupported_services: ['Slack (trigger)'],
          is_doable: false,
          reason: 'Slack connector is not available',
        },
        rawContent: [{ type: 'text', text: '{"is_doable":false}' }],
      });

    vi.spyOn(connectorsCache, 'getConnectors').mockResolvedValueOnce([
      { organization: 'ballerinax', name: 'github', summary: 'GitHub integration' },
    ]);

    const result = await runAiIntegrationPipeline(
      'Send Slack notification when GitHub code is pushed',
      testProjectId,
      mockGetToken,
      mockPrebuilts
    );

    expect(result.type).toBe('unsupported');
    if (result.type === 'unsupported') {
      expect(result.unsupportedServices).toContain('Slack (trigger)');
    }
  });

  it('throws DOMException when signal is aborted', async () => {
    const controller = new AbortController();
    const abortSpy = vi.spyOn(controller.signal, 'aborted', 'get');

    // First call returns valid, second call check will abort
    abortSpy.mockReturnValueOnce(false).mockReturnValueOnce(true);

    vi.spyOn(llmClient, 'callLlm').mockResolvedValueOnce({
      parsed: { type: 'valid' },
      rawContent: [{ type: 'text', text: '{"type":"valid"}' }],
    });

    let caughtError: unknown;
    try {
      await runAiIntegrationPipeline(
        'test query',
        testProjectId,
        mockGetToken,
        mockPrebuilts,
        undefined,
        controller.signal
      );
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(DOMException);
    if (caughtError instanceof DOMException) {
      expect(caughtError.name).toBe('AbortError');
    }
  });
});
