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

// ---------------------------------------------------------------------------
// Compliance dashboards (governance insights)
// ---------------------------------------------------------------------------

export interface RuleViolationCounts {
  error: number;
  warn: number;
  info: number;
}

/** Compliant/non-compliant breakdown used by project + component summaries. */
export interface ComplianceStatusSummary {
  total: number;
  compliant: number;
  nonCompliant: number;
  notApplicable?: number;
}

/** Adhered/violated breakdown used by policy + ruleset summaries. */
export interface AdherenceStatusSummary {
  total: number;
  adhered: number;
  violated: number;
  unapplied?: number;
}

export interface ComplianceRulesetEntry {
  rulesetId: string;
  rulesetName: string;
  status: string;
  ruleViolations?: RuleViolationCounts;
}

/** policyId/policyName are null for the synthetic standalone-ruleset entry the API emits. */
export interface CompliancePolicyEntry {
  policyId: string | null;
  policyName: string | null;
  policyType?: string;
  status: string;
  rulesets: { count: number; list: ComplianceRulesetEntry[] };
}

export interface ProjectComplianceEntry {
  projectId: string;
  projectName: string;
  status: string;
  ruleViolations?: RuleViolationCounts;
  policies: { count: number; list: CompliancePolicyEntry[] };
}

export interface ProjectComplianceResponse {
  summary: { project: ComplianceStatusSummary; component: ComplianceStatusSummary };
  count: number;
  list: ProjectComplianceEntry[];
}

export interface PolicyAdherenceProjectRef {
  projectId: string;
  projectName: string;
  status: string;
}

export interface PolicyAdherenceEntry {
  policyId: string;
  policyName: string;
  policyType?: string;
  status: string;
  projects?: { count: number; summary: ComplianceStatusSummary; list: PolicyAdherenceProjectRef[] };
}

export interface PolicyAdherenceResponse {
  summary: { policy: AdherenceStatusSummary };
  count: number;
  list: PolicyAdherenceEntry[];
}

export interface ComponentVersionComplianceRef {
  versionId: string;
  version: string;
  status: string;
  ruleViolations?: RuleViolationCounts;
  policies?: { count: number; list: CompliancePolicyEntry[] };
}

export interface PolicyAdherenceComponentRef {
  componentId: string;
  componentName: string;
  status: string;
  versions?: { count: number; list: ComponentVersionComplianceRef[] };
}

export interface ProjectPolicyAdherenceEntry {
  policyId: string;
  policyName: string;
  policyType?: string;
  status: string;
  components?: { count: number; summary: ComplianceStatusSummary; list: PolicyAdherenceComponentRef[] };
}

export interface ProjectPolicyAdherenceResponse {
  summary: { policy: AdherenceStatusSummary };
  count: number;
  list: ProjectPolicyAdherenceEntry[];
}

export interface ComponentComplianceEntry {
  componentId: string;
  componentName: string;
  status: string;
  ruleViolations?: RuleViolationCounts;
  policies: { count: number; list: CompliancePolicyEntry[] };
  versions?: { count: number; list: ComponentVersionComplianceRef[] };
}

export interface ComponentComplianceResponse {
  summary: { component: ComplianceStatusSummary };
  count: number;
  list: ComponentComplianceEntry[];
}

export interface EndpointPolicyAdherenceEntry {
  policyId: string | null;
  policyName: string | null;
  status: string;
  rulesets?: { count: number; list: ComplianceRulesetEntry[] };
}

export interface EndpointPolicyAdherenceResponse {
  summary: { policy: AdherenceStatusSummary };
  count: number;
  list: EndpointPolicyAdherenceEntry[];
}

export interface EndpointRulesetAdherenceResponse {
  summary: { ruleset: AdherenceStatusSummary };
  count: number;
  list: ComplianceRulesetEntry[];
}

export interface RulePathDetail {
  path: string;
  message: string;
}

export interface AdherenceRule {
  ruleId: string;
  ruleName: string;
  severity: 'error' | 'warn' | 'info' | string;
  message: string;
  paths?: { count: number; list: string[] };
  pathDetails?: { count: number; list: RulePathDetail[] };
}

export interface RuleAdherenceRulesetEntry {
  rulesetId: string;
  rulesetName: string;
  provider?: string | null;
  status: string;
  documentationLink?: string | null;
  ruleViolations: RuleViolationCounts;
  violatedRules: { count: number; list: AdherenceRule[] };
  adheredRules?: { count: number; list: AdherenceRule[] };
}

export interface RuleAdherenceResponse {
  summary: { ruleset: AdherenceStatusSummary };
  count: number;
  list: RuleAdherenceRulesetEntry[];
}
