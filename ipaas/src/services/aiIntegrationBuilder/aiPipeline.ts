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

import type { PrebuiltIntegration } from '../../types/prebuilt';
import {
  VALIDATION_SYSTEM_PROMPT,
  PREBUILT_MATCH_SYSTEM_PROMPT,
  CONNECTOR_CHECK_SYSTEM_PROMPT,
  PLAN_GENERATION_SYSTEM_PROMPT,
  buildValidationUserMessage,
  buildPrebuiltMatchUserMessage,
  buildConnectorCheckUserMessage,
  buildPlanGenerationUserMessage,
} from './prompts';
import { callLlm } from './llmClient';
import { getConnectors } from './connectorsCache';
import {
  addGeneration,
  updateGeneration,
  getChatHistoryForLLM,
  populateHistoryForLlm,
} from './chatStorage';
import { PIPELINE_STAGE, STEP_STATUS } from '../../constants/aiBuilder';
import type { AiIntegrationBuilderResponse, StepEvent } from '../../types/aiBuilder';
import type {
  ValidationOutput,
  PrebuiltMatchOutput,
  ConnectorCheckOutput,
  PlanOutput,
  ModelMessage,
  GenerationResponseType,
} from './types';

type MessagePair = Array<{ role: 'user' | 'assistant'; content: string }>;

function emit(
  onStepEvent: ((e: StepEvent) => void) | undefined,
  event: StepEvent
): void {
  onStepEvent?.(event);
}

function buildMessages(history: MessagePair, userContent: string): MessagePair {
  return [...history, { role: 'user' as const, content: userContent }];
}

function saveGenerationMessages(
  projectId: string,
  generationId: string,
  userQuery: string,
  assistantText: string,
  responseType: GenerationResponseType
): void {
  const modelMessages: ModelMessage[] = [
    { role: 'user', content: userQuery },
    { role: 'assistant', content: assistantText },
  ];
  updateGeneration(projectId, generationId, { modelMessages, responseType });
}

function serializePrebuiltForLlm(
  integrations: PrebuiltIntegration[]
): Record<string, unknown>[] {
  return integrations.map((integration) => ({
    displayName: integration.displayName,
    description: integration.description,
    componentType: integration.componentType,
    applications: integration.applications,
    tags: integration.tags,
    bidirectional: integration.bidirectional,
  }));
}

/**
 * Runs the pipeline: context → validation → prebuilt match → connector check → plan.
 * Emits StepEvents for progress; aborting via `signal` re-throws an AbortError.
 */
export async function runAiIntegrationPipeline(
  query: string,
  projectId: string,
  getToken: () => Promise<string>,
  prebuiltIntegrations: PrebuiltIntegration[],
  onStepEvent?: (event: StepEvent) => void,
  signal?: AbortSignal
): Promise<AiIntegrationBuilderResponse> {
  // Stage 0: context
  emit(onStepEvent, {
    stage: PIPELINE_STAGE.Context,
    status: STEP_STATUS.Started,
  });

  const generationId = addGeneration(projectId, query);
  const history = populateHistoryForLlm(getChatHistoryForLLM(projectId));

  // For follow-up messages, prepend the most recent user query so every pipeline
  // stage has explicit context about what is being refined, not just the short delta.
  const lastUserQuery =
    [...history].reverse().find((m) => m.role === 'user')?.content ?? '';
  const contextualizedQuery = lastUserQuery
    ? `${lastUserQuery}\n\nUser refinement: ${query}`
    : query;

  emit(onStepEvent, {
    stage: PIPELINE_STAGE.Context,
    status: STEP_STATUS.Done,
  });

  // Abort guard — re-throw and mark generation after aborting
  function checkAbort(): void {
    if (signal?.aborted) {
      updateGeneration(projectId, generationId, { responseType: 'aborted' });
      throw new DOMException('Pipeline aborted by user', 'AbortError');
    }
  }

  try {
    // Stage 1: validation
    emit(onStepEvent, {
      stage: PIPELINE_STAGE.Validation,
      status: STEP_STATUS.Started,
    });
    checkAbort();

    const validationUserContent =
      buildValidationUserMessage(contextualizedQuery);
    const { parsed: validation, rawContent: validationRaw } =
      await callLlm<ValidationOutput>(
        VALIDATION_SYSTEM_PROMPT,
        buildMessages(history, validationUserContent),
        getToken,
        signal
      );

    emit(onStepEvent, {
      stage: PIPELINE_STAGE.Validation,
      status: STEP_STATUS.Done,
    });

    if (validation.type === 'invalid') {
      saveGenerationMessages(
        projectId,
        generationId,
        query,
        validationRaw[0]?.text ?? '',
        'invalid'
      );
      return { type: 'invalid', message: validation.message };
    }

    // Stage 2: prebuilt match
    emit(onStepEvent, {
      stage: PIPELINE_STAGE.Prebuilt,
      status: STEP_STATUS.Started,
    });
    checkAbort();

    const serializedPrebuilts = serializePrebuiltForLlm(prebuiltIntegrations);
    const prebuiltUserContent = buildPrebuiltMatchUserMessage(
      contextualizedQuery,
      serializedPrebuilts
    );
    const { parsed: prebuiltMatch, rawContent: prebuiltRaw } =
      await callLlm<PrebuiltMatchOutput>(
        PREBUILT_MATCH_SYSTEM_PROMPT,
        buildMessages(history, prebuiltUserContent),
        getToken,
        signal
      );

    emit(onStepEvent, {
      stage: PIPELINE_STAGE.Prebuilt,
      status: STEP_STATUS.Done,
    });

    if (
      prebuiltMatch.match &&
      prebuiltMatch.selected_index != null &&
      prebuiltMatch.selected_index >= 0 &&
      prebuiltMatch.selected_index < prebuiltIntegrations.length
    ) {
      const matched = prebuiltIntegrations[prebuiltMatch.selected_index];
      saveGenerationMessages(
        projectId,
        generationId,
        query,
        prebuiltRaw[0]?.text ?? '',
        'prebuilt'
      );
      return {
        type: 'prebuilt',
        message: prebuiltMatch.message,
        integrations: [matched],
      };
    }

    // Stage 3: connector check
    emit(onStepEvent, {
      stage: PIPELINE_STAGE.ConnectorCheck,
      status: STEP_STATUS.Started,
    });
    checkAbort();

    const connectors = await getConnectors();
    const connectorUserContent = buildConnectorCheckUserMessage(
      contextualizedQuery,
      connectors
    );
    const { parsed: connectorCheck, rawContent: connectorRaw } =
      await callLlm<ConnectorCheckOutput>(
        CONNECTOR_CHECK_SYSTEM_PROMPT,
        buildMessages(history, connectorUserContent),
        getToken,
        signal
      );

    emit(onStepEvent, {
      stage: PIPELINE_STAGE.ConnectorCheck,
      status: STEP_STATUS.Done,
    });

    if (!connectorCheck.is_doable) {
      saveGenerationMessages(
        projectId,
        generationId,
        query,
        connectorRaw[0]?.text ?? '',
        'unsupported'
      );
      return {
        type: 'unsupported',
        message: connectorCheck.reason,
        unsupportedServices: connectorCheck.unsupported_services,
      };
    }

    // Stage 4: plan generation
    emit(onStepEvent, {
      stage: PIPELINE_STAGE.Plan,
      status: STEP_STATUS.Started,
    });
    checkAbort();

    const planUserContent = buildPlanGenerationUserMessage(
      contextualizedQuery,
      connectorCheck.required_connectors,
      (connectorCheck.http_fallback_services ?? []).map((s) => s.service)
    );
    const { parsed: plan, rawContent: planRaw } = await callLlm<PlanOutput>(
      PLAN_GENERATION_SYSTEM_PROMPT,
      buildMessages(history, planUserContent),
      getToken,
      signal
    );

    emit(onStepEvent, {
      stage: PIPELINE_STAGE.Plan,
      status: STEP_STATUS.Done,
    });

    if (plan.status === 'unsupported') {
      saveGenerationMessages(
        projectId,
        generationId,
        query,
        planRaw[0]?.text ?? '',
        'unsupported'
      );
      return { type: 'unsupported', message: plan.message };
    }

    saveGenerationMessages(
      projectId,
      generationId,
      query,
      planRaw[0]?.text ?? '',
      'custom'
    );
    return {
      type: 'custom',
      message: plan.message,
      title: plan.title ?? query,
      steps: plan.steps ?? [],
    };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    updateGeneration(projectId, generationId, { responseType: 'error' });
    throw err;
  }
}
