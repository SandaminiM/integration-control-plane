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

export interface GqlArtifactType {
  artifactType: string;
  artifactCount: number;
}

export interface GqlArtifact {
  name: string;
  [key: string]: unknown;
}

export interface GqlArtifactParam {
  name: string;
  value: string;
}

export interface ArtifactStatusInput {
  envId: string;
  componentId: string;
  artifactType: string;
  artifactName: string;
  status: 'active' | 'inactive';
}

export interface ListenerStateInput {
  runtimeIds: string[];
  listenerName: string;
  action: 'START' | 'STOP';
}

export interface TriggerTaskInput {
  componentId: string;
  taskName: string;
}

export interface ArtifactToggleStatusInput {
  envId: string;
  componentId: string;
  artifactType: string;
  artifactName: string;
  value: 'enable' | 'disable';
}

export interface ArtifactTracingInput {
  envId: string;
  componentId: string;
  artifactType: string;
  artifactName: string;
  trace: 'enable' | 'disable';
}

export interface ArtifactStatisticsInput {
  envId: string;
  componentId: string;
  artifactType: string;
  artifactName: string;
  statistics: 'enable' | 'disable';
}

export type ArtifactToggleKind = 'tracing' | 'statistics';

export const ARTIFACT_TYPE_TO_SOURCE_TYPE: Record<string, string> = {
  RestApi: 'api',
  ProxyService: 'proxy-service',
  Endpoint: 'endpoint',
  InboundEndpoint: 'inbound-endpoint',
  Sequence: 'sequence',
  Task: 'task',
  LocalEntry: 'local-entry',
  CarbonApp: 'carbon-app',
  Connector: 'connector',
  RegistryResource: 'registry-resource',
  Listener: 'listener',
  Service: 'service',
  Automation: 'automation',
};
