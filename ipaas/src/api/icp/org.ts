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

// TODO: implement using ICP local REST APIs

import type { OrgEntry, OrgComponentLimits, OrgSubscription, RegisterUserResponse } from '../../types/org';
import type { Project } from '../../types/project';

const ni = (name: string): never => {
  throw new Error(`[icp] org.${name}: not implemented`);
};

export const fetchOrgList = (): Promise<OrgEntry[]> => ni('fetchOrgList');
export const fetchOrgs = (): Promise<OrgEntry[]> => ni('fetchOrgs');
export const validateOrgName = (_orgName: string): Promise<boolean> => ni('validateOrgName');
export const registerUser = (_orgName: string, _termsAccepted: boolean, _serviceName: string): Promise<RegisterUserResponse> => ni('registerUser');
export const initOrg = (_orgUuid: string, _region: string): Promise<void> => ni('initOrg');
export const fetchProjectsByOrgId = (_orgNumericId: number): Promise<Project[]> => ni('fetchProjectsByOrgId');
export const createDefaultProject = (_orgNumericId: number, _orgHandler: string, _projectHandler?: string): Promise<{ id: string; handler: string }> => ni('createDefaultProject');
export const fetchOrgComponentLimits = (_orgUuid: string): Promise<OrgComponentLimits> => ni('fetchOrgComponentLimits');
export const fetchOrgSubscriptions = (_orgUuid: string): Promise<OrgSubscription[]> => ni('fetchOrgSubscriptions');
