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

import { COMPLIANCE_FAILED_STATUSES, COMPLIANCE_STATUS_LABELS, COMPLIANCE_SUCCESS_STATUSES } from '../constants/compliance';
import type { ComplianceNestedItem, ComplianceRuleGroup, CompliancePieSlice } from '../types/compliance';
import type { AdherenceStatusSummary, ComplianceStatusSummary, CompliancePolicyEntry, RuleAdherenceRulesetEntry } from '../types/governance';

export function complianceStatusLabel(status: string): string {
  return COMPLIANCE_STATUS_LABELS[status] ?? status;
}

export function complianceStatusColor(status: string): 'success' | 'error' | 'default' {
  if (COMPLIANCE_SUCCESS_STATUSES.has(status)) return 'success';
  if (COMPLIANCE_FAILED_STATUSES.has(status)) return 'error';
  return 'default';
}

export function isFailedStatus(status: string): boolean {
  return COMPLIANCE_FAILED_STATUSES.has(status);
}

/** Rule messages embed `{{placeholder}}` template markers; render them as `[placeholder]`. */
export function formatRuleMessage(message: string): string {
  return message.replace(/\{\{(.*?)\}\}/g, '[$1]');
}

/** Failed entries first, then alphabetical — matches Devant's expanded-row ordering. */
export function sortNestedItems(items: ComplianceNestedItem[]): ComplianceNestedItem[] {
  return items
    .slice()
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    .sort((a, b) => Number(isFailedStatus(b.status)) - Number(isFailedStatus(a.status)));
}

/** Projects a policies list (with nested rulesets) into expanded-row items. */
export function mapPolicyNestedItems(policies: CompliancePolicyEntry[]): ComplianceNestedItem[] {
  return policies.map((p) => ({
    id: p.policyId,
    name: p.policyName,
    status: p.status,
    subItems: p.rulesets.list.map((r) => ({
      id: r.rulesetId,
      name: r.rulesetName,
      status: r.status,
      violations: r.ruleViolations,
    })),
  }));
}

export function countViolated(entries: { status: string }[]): number {
  return entries.filter((e) => e.status === 'violated').length;
}

/**
 * policyId → policyType, merged from every response list in scope. The type
 * decides which governance editor route a policy link opens.
 */
export function buildPolicyTypeMap(
  policyEntries: { policyId: string | null; policyType?: string }[],
  complianceEntries: { policies: { list: CompliancePolicyEntry[] } }[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of policyEntries) {
    if (p.policyId && p.policyType) map[p.policyId] = p.policyType;
  }
  for (const e of complianceEntries) {
    for (const p of e.policies.list) {
      if (p.policyId && p.policyType) map[p.policyId] = p.policyType;
    }
  }
  return map;
}

/** Buckets a rule-adherence response into error/warn/info/passed groups, filtered by a search phrase. */
export function groupRulesBySeverity(rulesets: RuleAdherenceRulesetEntry[], searchText: string): ComplianceRuleGroup[] {
  const needle = searchText.trim().toLowerCase();
  const matches = (ruleName: string, message: string, rulesetName: string) =>
    !needle || ruleName.toLowerCase().includes(needle) || message.toLowerCase().includes(needle) || rulesetName.toLowerCase().includes(needle);

  const groups: ComplianceRuleGroup[] = [
    { severity: 'error', rules: [] },
    { severity: 'warn', rules: [] },
    { severity: 'info', rules: [] },
    { severity: 'passed', rules: [] },
  ];
  const bySeverity = new Map(groups.map((g) => [g.severity, g]));

  for (const ruleset of rulesets) {
    for (const rule of ruleset.violatedRules?.list ?? []) {
      const group = rule.severity === 'error' || rule.severity === 'warn' || rule.severity === 'info' ? bySeverity.get(rule.severity) : undefined;
      if (group && matches(rule.ruleName, rule.message, ruleset.rulesetName)) {
        group.rules.push({ rule, rulesetName: ruleset.rulesetName });
      }
    }
    for (const rule of ruleset.adheredRules?.list ?? []) {
      if (matches(rule.ruleName, rule.message, ruleset.rulesetName)) {
        bySeverity.get('passed')!.rules.push({ rule, rulesetName: ruleset.rulesetName });
      }
    }
  }
  return groups;
}

export function complianceSlices(summary?: ComplianceStatusSummary): CompliancePieSlice[] {
  return [
    { name: 'Compliant', value: summary?.compliant ?? 0, tone: 'success' },
    { name: 'Non-Compliant', value: summary?.nonCompliant ?? 0, tone: 'error' },
    { name: 'Not Applicable', value: summary?.notApplicable ?? 0, tone: 'neutral' },
  ];
}

export function adherenceSlices(summary?: AdherenceStatusSummary): CompliancePieSlice[] {
  return [
    { name: 'Adhered', value: summary?.adhered ?? 0, tone: 'success' },
    { name: 'Violated', value: summary?.violated ?? 0, tone: 'error' },
    { name: 'Unapplied', value: summary?.unapplied ?? 0, tone: 'neutral' },
  ];
}
