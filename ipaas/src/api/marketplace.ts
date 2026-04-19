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

import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch, getOrgUuidFromToken } from '../auth/tokenManager';
import { getApimBaseUrl } from './apim';

// ---------- Types ----------

export interface ThrottlingPolicy {
  name: string;
  displayName: string;
  description: string;
  requestCount: number;
  unitTime?: number;
  timeUnit?: string;
}

export interface ApiDocument {
  documentId: string;
  name: string;
  type: string;
  summary?: string;
  sourceType?: string;
}

export interface RuleAdherenceRuleset {
  rulesetName: string;
  provider?: string;
  status: string;
  violatedRules: { list: { severity: string }[] };
  adheredRules?: { list: unknown[] };
}

export interface RuleAdherenceResponse {
  summary?: { ruleset: { total: number; adhered: number; violated: number } };
  count: number;
  list: RuleAdherenceRuleset[];
}

// ---------- Helpers ----------

function getGovernanceBaseUrl(): string | null {
  const match = (window.API_CONFIG?.choreoOrgApiUrl ?? '').match(/\/\/apis\.([^.]+)\.choreo\.dev/);
  return match ? `https://apis.${match[1]}.choreo.dev/governance/v1.0` : null;
}

// ---------- Fetch functions ----------

async function fetchThrottlingPolicies(): Promise<ThrottlingPolicy[]> {
  const base = getApimBaseUrl();
  const orgUuid = getOrgUuidFromToken() ?? '';
  if (!base || !orgUuid) return [];
  try {
    const res = await authenticatedFetch(`${base}/api/am/publisher/v2/throttling-policies/subscription?organizationId=${encodeURIComponent(orgUuid)}`);
    if (!res.ok) return [];
    const json: { list?: ThrottlingPolicy[] } = await res.json();
    return json.list ?? [];
  } catch {
    return [];
  }
}

async function fetchApiDocuments(apimId: string): Promise<ApiDocument[]> {
  const base = getApimBaseUrl();
  const orgUuid = getOrgUuidFromToken() ?? '';
  if (!base || !orgUuid || !apimId) return [];
  try {
    const res = await authenticatedFetch(`${base}/api/am/publisher/v2/apis/${encodeURIComponent(apimId)}/documents?organizationId=${encodeURIComponent(orgUuid)}`);
    if (!res.ok) return [];
    const json: { list?: ApiDocument[] } = await res.json();
    return json.list ?? [];
  } catch {
    return [];
  }
}

async function fetchRuleAdherence(projectId: string, componentId: string, apimId: string): Promise<RuleAdherenceResponse | null> {
  const base = getGovernanceBaseUrl();
  if (!base || !projectId || !componentId || !apimId) return null;
  try {
    const res = await authenticatedFetch(`${base}/projects/${encodeURIComponent(projectId)}/components/${encodeURIComponent(componentId)}/endpoints/${encodeURIComponent(apimId)}/rule-adherence`);
    if (!res.ok) return null;
    return res.json() as Promise<RuleAdherenceResponse>;
  } catch {
    return null;
  }
}

// ---------- Hooks ----------

export function useThrottlingPolicies() {
  return useQuery({
    queryKey: ['throttling-policies'],
    queryFn: fetchThrottlingPolicies,
    staleTime: 5 * 60_000,
  });
}

export function useApiDocuments(apimId: string | null) {
  return useQuery({
    queryKey: ['api-documents', apimId],
    queryFn: () => fetchApiDocuments(apimId!),
    enabled: !!apimId,
    staleTime: 5 * 60_000,
  });
}

export function useRuleAdherence(projectId: string, componentId: string, apimId: string | null) {
  return useQuery({
    queryKey: ['rule-adherence', projectId, componentId, apimId],
    queryFn: () => fetchRuleAdherence(projectId, componentId, apimId!),
    enabled: !!projectId && !!componentId && !!apimId,
    staleTime: 5 * 60_000,
  });
}
