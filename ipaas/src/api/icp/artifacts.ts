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
  throw new Error(`[icp] artifacts.${name}: not implemented`);
};

export const fetchArtifactTypes = (..._args: unknown[]): never => ni('fetchArtifactTypes');
export const fetchArtifacts = (..._args: unknown[]): never => ni('fetchArtifacts');
export const fetchArtifactSource = (..._args: unknown[]): never => ni('fetchArtifactSource');
export const fetchLocalEntryValue = (..._args: unknown[]): never => ni('fetchLocalEntryValue');
export const fetchArtifactParams = (..._args: unknown[]): never => ni('fetchArtifactParams');
export const fetchArtifactWsdl = (..._args: unknown[]): never => ni('fetchArtifactWsdl');
export const updateArtifactStatus = (..._args: unknown[]): never => ni('updateArtifactStatus');
export const updateListenerState = (..._args: unknown[]): never => ni('updateListenerState');
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const ARTIFACT_QUERY_MAP: any = {};
