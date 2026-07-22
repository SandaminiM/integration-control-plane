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

import type { ExamplePrompt, PipelineStage, StepStatus } from '../types/aiBuilder';

export const PIPELINE_STAGE: Record<string, PipelineStage> = {
  Context: 'context',
  Validation: 'validation',
  Prebuilt: 'prebuilt',
  ConnectorCheck: 'connector_check',
  Plan: 'plan',
};

export const STEP_STATUS: Record<string, StepStatus> = {
  Started: 'started',
  Done: 'done',
};

/** Loading labels shown per pipeline stage while the request is in flight. */
export const STAGE_LABELS: Partial<Record<PipelineStage, string>> = {
  context: 'Analyzing your scenario…',
  validation: 'Validating your request…',
  prebuilt: 'Searching prebuilt integrations…',
  connector_check: 'Checking available connectors…',
  plan: 'Generating integration plan…',
};

export const AI_PROMPT_PLACEHOLDER = 'Describe what you want to build…';

export const CHIPS_PER_PAGE = 2;
export const CHIPS_ROTATE_INTERVAL_MS = 4000;

export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    short: 'Log Shopify orders to Google Sheets and notify Slack',
    full:
      'Automatically capture every new order from Shopify as a row in a shared Google Sheets for' +
      ' fulfillment tracking and reconciliation. At the same time, send a real-time notification' +
      ' to a designated Slack channel so the operations team can begin processing orders without delay.',
  },
  {
    short: 'Send Slack updates for merged PRs',
    full:
      'Monitor pull request events from GitHub and detect when a PR is merged into the main branch.' +
      ' Generate a concise summary including key details such as title, author, and changes, and send' +
      ' a notification to a designated Slack channel to keep the team informed in real time.',
  },
  {
    short: 'Alert sales team on new ad leads via Slack',
    full:
      'When a new lead is captured from Facebook lead ads, filter out duplicate and spam entries,' +
      ' then send a structured lead alert with contact details, source, and interest level to the' +
      ' sales team via Slack so reps can quickly reach qualified prospects.',
  },
  {
    short: 'Export Salesforce opportunities to Google Sheets',
    full:
      'Periodically connect to Salesforce and export all open opportunities, including fields such' +
      ' as name, stage, amount, close date, and owner, into Google Sheets. Keep the sheet updated' +
      ' on a schedule so the sales team always has an accurate and shareable view of the pipeline' +
      ' without logging into the CRM.',
  },
];
