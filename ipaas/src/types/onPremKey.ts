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

/** An on-premises key used to connect an on-prem WSO2 API Manager to the platform. */
export interface OnPremKey {
  id: string;
  orgId: string;
  status: string; // 'ACTIVE' | 'REVOKED'
  displayName: string;
  handle: string; // UUID; the path segment for per-key operations
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  orgName?: string;
  /** The secret key value — returned only on generate/regenerate (shown once). */
  key?: string;
  expiresAt?: string;
}

/** The org's on-prem-key subscription window; drives the expiry banner. */
export interface OnPremKeySubscription {
  id: string;
  orgName: string;
  plan: string; // e.g. 'TRIAL'
  startDate: string;
  endDate: string;
}
