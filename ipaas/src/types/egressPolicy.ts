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

export type EgressRuleType = 'CIDR' | 'FQDN';

/**
 * Egress policy mode. `allow-all` permits all outbound and the rules deny specific
 * destinations (stored in `egress_deny`); `deny-all` blocks all outbound and the
 * rules allow specific destinations (stored in `egress`).
 */
export type EgressMode = 'allow-all' | 'deny-all';

/** A single egress rule targeting a destination (CIDR range or FQDN). */
export interface EgressRule {
  rule_id: string;
  name: string;
  value: string;
  type: EgressRuleType;
  scope: string; // 'Organization' for org-level rules
  created_at: string;
  updated_at: string;
}

/** The org's single egress policy. */
export interface EgressPolicy {
  id: string;
  organization_id: string;
  name: string;
  /** Allow rules (used in deny-all mode). */
  egress: EgressRule[];
  /** Deny rules (used in allow-all mode). */
  egress_deny: EgressRule[];
  status: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/** Create/update body — the policy is replaced wholesale on every change. */
export interface EgressPolicyRequest {
  egress: EgressRule[];
  egress_deny: EgressRule[];
  policy_id?: string;
}
