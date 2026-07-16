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

export const RulesetAppliesTo = {
  API_METADATA: 'api_metadata',
  API_DEFINITIONS: 'api_definition',
  DOCUMENTATION: 'documentation',
} as const;
export type RulesetAppliesTo = (typeof RulesetAppliesTo)[keyof typeof RulesetAppliesTo];

export const PolicyType = {
  RULESET: 'ruleset',
  AI: 'ai',
} as const;
export type PolicyType = (typeof PolicyType)[keyof typeof PolicyType];

export interface RulesetInfo {
  id?: string;
  name: string;
  description: string;
  appliesTo: RulesetAppliesTo;
  artifactType?: string;
  documentationLink: string;
  provider: string;
  isDefault?: boolean | null;
  createdBy?: string | null;
  createdTime?: string | null;
  updatedBy?: string | null;
  updatedTime?: string | null;
}

export interface Ruleset extends RulesetInfo {
  rulesetContent: string;
}

export interface DocumentInfo {
  id?: string;
  name: string;
  description: string;
  appliesTo: RulesetAppliesTo;
  artifactType?: string;
  /** base64-encoded PDF, no `data:` prefix. */
  content: string;
  isDefault?: boolean | null;
  createdBy?: string | null;
  createdTime?: string | null;
  updatedBy?: string | null;
  updatedTime?: string | null;
}

export interface GovernancePolicyInfo {
  id?: string;
  name: string;
  description: string;
  policyType: PolicyType;
  labels: string[];
  /** Full ruleset objects — the API embeds them, it does not take IDs. */
  rulesets?: RulesetInfo[];
  documents?: DocumentInfo[];
  createdBy?: string | null;
  createdTime?: string | null;
  updatedBy?: string | null;
  updatedTime?: string | null;
}

export interface RulesetList {
  count: number;
  list: RulesetInfo[];
}

export interface DocumentList {
  count: number;
  list: DocumentInfo[];
}

export interface GovernancePolicyList {
  count: number;
  list: GovernancePolicyInfo[];
}

/** Error envelope returned by the governance API (e.g. code 301013 on invalid ruleset content). */
export interface GovernanceError {
  code: string;
  message: string;
  description?: string;
}
