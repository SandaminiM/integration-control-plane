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
import { getOrgUuidFromToken } from '../auth/tokenManager';
import { apimClient, governanceClient } from './http';

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

// ---------- Fetch functions ----------

async function fetchThrottlingPolicies(): Promise<ThrottlingPolicy[]> {
  const orgUuid = getOrgUuidFromToken() ?? '';
  if (!orgUuid) return [];
  try {
    const data = await apimClient.get<{ list?: ThrottlingPolicy[] }>(`/api/am/publisher/v2/throttling-policies/subscription?organizationId=${encodeURIComponent(orgUuid)}`);
    return data.list ?? [];
  } catch {
    return [];
  }
}

async function fetchApiDocuments(apimId: string): Promise<ApiDocument[]> {
  const orgUuid = getOrgUuidFromToken() ?? '';
  if (!orgUuid || !apimId) return [];
  try {
    const data = await apimClient.get<{ list?: ApiDocument[] }>(`/api/am/publisher/v2/apis/${encodeURIComponent(apimId)}/documents?organizationId=${encodeURIComponent(orgUuid)}`);
    return data.list ?? [];
  } catch {
    return [];
  }
}

async function fetchRuleAdherence(projectId: string, componentId: string, apimId: string): Promise<RuleAdherenceResponse | null> {
  if (!projectId || !componentId || !apimId) return null;
  try {
    return await governanceClient.get<RuleAdherenceResponse>(`/projects/${encodeURIComponent(projectId)}/components/${encodeURIComponent(componentId)}/endpoints/${encodeURIComponent(apimId)}/rule-adherence`);
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
