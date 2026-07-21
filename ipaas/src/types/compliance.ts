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

// View models for the Compliance dashboards. Pages project the governance API
// responses (src/types/governance.ts) into these shapes; the Compliance
// components render them without knowing which scope they came from.

import type { AdherenceRule, RuleViolationCounts } from './governance';

/** Innermost line of an expanded row (e.g. a ruleset under a policy). `id`/`name` are null for the synthetic standalone-ruleset entry. */
export interface ComplianceLine {
  id: string | null;
  name: string | null;
  status: string;
  violations?: RuleViolationCounts;
}

/** Expanded-row entry (e.g. a policy under a project, or a project under a policy). */
export interface ComplianceNestedItem extends ComplianceLine {
  subItems?: ComplianceLine[];
}

/** Top-level table row. `failed`/`total` drive the "1/3 Violated" indicator and bar. */
export interface ComplianceRow {
  id: string;
  name: string;
  status: string;
  violations?: RuleViolationCounts;
  failed: number;
  total: number;
  searchText: string;
  items: ComplianceNestedItem[];
}

export type RuleSeverityGroup = 'error' | 'warn' | 'info' | 'passed';

/** One rule occurrence within a severity group, tagged with its owning ruleset. */
export interface ComplianceRuleHit {
  rule: AdherenceRule;
  rulesetName: string;
}

export interface ComplianceRuleGroup {
  severity: RuleSeverityGroup;
  rules: ComplianceRuleHit[];
}

/** One donut slice. `tone` maps to theme colors in CompliancePie. */
export interface CompliancePieSlice {
  name: string;
  value: number;
  tone: 'success' | 'error' | 'neutral';
}
