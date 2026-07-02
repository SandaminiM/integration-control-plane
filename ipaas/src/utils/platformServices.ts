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

/**
 * Pure transforms backing the create-database wizard: derive which cloud providers
 * and regions are offered from the service-plan list, and filter plans by the
 * selected provider+region. No React, no I/O. Mirrors Devant's convertPlatformSvcPlans.
 */

import { CLOUD_PROVIDERS, CLOUD_REGIONS } from '../constants/platformServices';
import type { CloudProvider, CloudRegion, ServicePlan, ServicePlanRegion } from '../types/platformServices';

/** Providers offered across all plans, in the canonical display order. */
export function deriveProviders(plans: ServicePlan[]): CloudProvider[] {
  const offered = new Set<CloudProvider>();
  plans.forEach((plan) => plan.regions?.forEach((r) => offered.add(r.cloud_provider)));
  return CLOUD_PROVIDERS.filter((p) => offered.has(p.id)).map((p) => p.id);
}

/** Regions offered across all plans, in the canonical display order. */
export function deriveRegions(plans: ServicePlan[]): CloudRegion[] {
  const offered = new Set<CloudRegion>();
  plans.forEach((plan) => plan.regions?.forEach((r) => offered.add(r.cloud_region)));
  return CLOUD_REGIONS.filter((r) => offered.has(r.id)).map((r) => r.id);
}

/** Does the plan offer this exact provider+region combination? */
export function isPlanAvailableInRegion(plan: ServicePlan, provider: CloudProvider, region: CloudRegion): boolean {
  return !!plan.regions?.some((r) => r.cloud_provider === provider && r.cloud_region === region);
}

/** Plans available for the selected provider+region. */
export function plansForProviderRegion(plans: ServicePlan[], provider: CloudProvider, region: CloudRegion): ServicePlan[] {
  return plans.filter((plan) => isPlanAvailableInRegion(plan, provider, region));
}

/** The provider+region-specific spec/pricing row for a plan, if the combination exists. */
export function planRegionSpec(plan: ServicePlan, provider: CloudProvider, region: CloudRegion): ServicePlanRegion | undefined {
  return plan.regions?.find((r) => r.cloud_provider === provider && r.cloud_region === region);
}
