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

// TODO: implement using icp APIs
const ni = (name: string): never => { throw new Error(`[icp] prebuilt.${name}: not implemented`); };

export const fetchPrebuiltIntegrations = (..._args: unknown[]): never => ni('fetchPrebuiltIntegrations');
export const normalizePrebuiltIntegrations = (..._args: unknown[]): never => ni('normalizePrebuiltIntegrations');
export const fetchPrebuiltAsset = (..._args: unknown[]): never => ni('fetchPrebuiltAsset');
export const checkNameAvailability = (..._args: unknown[]): never => ni('checkNameAvailability');
export const fetchComponentDetail = (..._args: unknown[]): never => ni('fetchComponentDetail');
export const fetchFirstEnvironment = (..._args: unknown[]): never => ni('fetchFirstEnvironment');
export const fetchLatestCommitSha = (..._args: unknown[]): never => ni('fetchLatestCommitSha');
export const savePrebuiltConfig = (..._args: unknown[]): never => ni('savePrebuiltConfig');
