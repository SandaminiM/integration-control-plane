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

export interface GqlEnvironment {
  id: string;
  name: string;
  critical: boolean;
  templateId?: string;
  dpId?: string;
  description?: string;
  createdAt?: string;
  apimEnvId?: string;
  scaleToZeroEnabled?: boolean;
}

export interface CloudDataPlane {
  id: string;
  external_gateway_virtual_host: string;
  internal_gateway_virtual_host: string;
  region: string;
  is_cilium?: boolean;
}

export interface GqlLogger {
  componentName: string;
  logLevel: string;
  runtimeIds: string[];
}

export interface EnvironmentInput {
  name: string;
  description: string;
  critical: boolean;
}

export interface UpdateLogLevelInput {
  runtimeIds: string[];
  componentName: string;
  logLevel: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
}
