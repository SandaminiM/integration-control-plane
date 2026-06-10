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
const ni = (name: string): never => {
  throw new Error(`[icp] apim.${name}: not implemented`);
};

export const fetchApimApi = (..._args: unknown[]): never => ni('fetchApimApi');
export const updateApimApi = (..._args: unknown[]): never => ni('updateApimApi');
export const generateTestKey = (..._args: unknown[]): never => ni('generateTestKey');
export const deploySettingsV2 = (..._args: unknown[]): never => ni('deploySettingsV2');
export const fetchLifecycleState = (..._args: unknown[]): never => ni('fetchLifecycleState');
export const fetchLifecycleHistory = (..._args: unknown[]): never => ni('fetchLifecycleHistory');
export const changeLifecycleState = (..._args: unknown[]): never => ni('changeLifecycleState');
export const fetchApimSwagger = (..._args: unknown[]): never => ni('fetchApimSwagger');
