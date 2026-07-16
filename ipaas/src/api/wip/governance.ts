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

import { governanceClient, governanceTextClient, withScopeRetry } from './httpClients';
import type { Ruleset, RulesetList, DocumentInfo, DocumentList, GovernancePolicyInfo, GovernancePolicyList } from '../../types/governance';

const BASE_RULESETS = '/rulesets';
const BASE_DOCUMENTS = '/documents';
const BASE_POLICIES = '/governance-policies';

/** All org-level rulesets. */
export function listRulesets(): Promise<RulesetList> {
  return withScopeRetry(() => governanceClient.get<RulesetList>(BASE_RULESETS));
}

/** A single ruleset (with its content). */
export function getRuleset(rulesetId: string): Promise<Ruleset> {
  return withScopeRetry(() => governanceClient.get<Ruleset>(`${BASE_RULESETS}/${encodeURIComponent(rulesetId)}`));
}

/** Raw ruleset content (YAML/JSON text). */
export function getRulesetContent(rulesetId: string): Promise<string> {
  return withScopeRetry(() => governanceTextClient.get<string>(`${BASE_RULESETS}/${encodeURIComponent(rulesetId)}/content`));
}

/** Create a ruleset. */
export function createRuleset(ruleset: Ruleset): Promise<Ruleset> {
  return withScopeRetry(() => governanceClient.post<Ruleset>(BASE_RULESETS, ruleset));
}

/** Update an existing ruleset. */
export function updateRuleset(rulesetId: string, ruleset: Ruleset): Promise<Ruleset> {
  return withScopeRetry(() => governanceClient.put<Ruleset>(`${BASE_RULESETS}/${encodeURIComponent(rulesetId)}`, ruleset));
}

/** Delete a ruleset. */
export function deleteRuleset(rulesetId: string): Promise<void> {
  return withScopeRetry(() => governanceClient.delete(`${BASE_RULESETS}/${encodeURIComponent(rulesetId)}`));
}

/** All org-level documents. */
export function listDocuments(): Promise<DocumentList> {
  return withScopeRetry(() => governanceClient.get<DocumentList>(BASE_DOCUMENTS));
}

/** A single document. */
export function getDocument(documentId: string): Promise<DocumentInfo> {
  return withScopeRetry(() => governanceClient.get<DocumentInfo>(`${BASE_DOCUMENTS}/${encodeURIComponent(documentId)}`));
}

/** Create a document. */
export function createDocument(document: DocumentInfo): Promise<DocumentInfo> {
  return withScopeRetry(() => governanceClient.post<DocumentInfo>(BASE_DOCUMENTS, document));
}

/** Update an existing document. */
export function updateDocument(documentId: string, document: DocumentInfo): Promise<DocumentInfo> {
  return withScopeRetry(() => governanceClient.put<DocumentInfo>(`${BASE_DOCUMENTS}/${encodeURIComponent(documentId)}`, document));
}

/** Delete a document. */
export function deleteDocument(documentId: string): Promise<void> {
  return withScopeRetry(() => governanceClient.delete(`${BASE_DOCUMENTS}/${encodeURIComponent(documentId)}`));
}

/** All org-level governance policies. */
export function listPolicies(): Promise<GovernancePolicyList> {
  return withScopeRetry(() => governanceClient.get<GovernancePolicyList>(BASE_POLICIES));
}

/** A single governance policy. */
export function getPolicy(policyId: string): Promise<GovernancePolicyInfo> {
  return withScopeRetry(() => governanceClient.get<GovernancePolicyInfo>(`${BASE_POLICIES}/${encodeURIComponent(policyId)}`));
}

/** Create a governance policy. */
export function createPolicy(policy: GovernancePolicyInfo): Promise<GovernancePolicyInfo> {
  return withScopeRetry(() => governanceClient.post<GovernancePolicyInfo>(BASE_POLICIES, policy));
}

/** Update an existing governance policy. */
export function updatePolicy(policyId: string, policy: GovernancePolicyInfo): Promise<GovernancePolicyInfo> {
  return withScopeRetry(() => governanceClient.put<GovernancePolicyInfo>(`${BASE_POLICIES}/${encodeURIComponent(policyId)}`, policy));
}

/** Delete a governance policy. */
export function deletePolicy(policyId: string): Promise<void> {
  return withScopeRetry(() => governanceClient.delete(`${BASE_POLICIES}/${encodeURIComponent(policyId)}`));
}
