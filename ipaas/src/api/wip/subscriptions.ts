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

import { choreoClient, subscriptionsClient } from './httpClients';
import type { ComponentLimits, SubscriptionList } from '../../types/subscription';

/** The org's subscriptions — used to tell whether it's on a paid plan. Mirrors Devant. */
export async function getSubscriptions(orgUuid: string): Promise<SubscriptionList> {
  return subscriptionsClient.get<SubscriptionList>(`/api/organizations/${encodeURIComponent(orgUuid)}/subscriptions?cloudType=devant&origin=choreo-console`);
}

/** The org's component usage vs. the free-tier allowance. The response wraps the data in `{ data }`. */
export async function getComponentLimits(orgUuid: string): Promise<ComponentLimits> {
  const res = await choreoClient.get<{ data: ComponentLimits }>(`/component-mgt/1.0.0/orgs/${encodeURIComponent(orgUuid)}/component-limits?originCloud=devant`);
  return res.data;
}
