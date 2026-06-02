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

import type { JSONSchema } from './schema';
import type { SchemaConfigItem } from './configuration';

export interface PrebuiltIntegration {
  displayName: string;
  description: string;
  applications: string[];
  bidirectional: boolean;
  componentType: string;
  buildPack: string;
  repositoryUrl: string;
  branch?: string;
  componentPath: string;
  tags: string[];
  imageUrl: string;
}

export interface PrebuiltIntegrationsData {
  prebuiltIntegrations: PrebuiltIntegration[];
  applications: string[];
}

export interface PrebuiltInstructionsResult {
  instructions: string | undefined;
  isInstructionsLoading: boolean;
  isInstructionsError: boolean;
}

export interface PrebuiltConfigSchemaResult {
  configSchema: JSONSchema | undefined;
  isConfigSchemaLoading: boolean;
  isConfigSchemaError: boolean;
}

export interface PrebuiltDiagramResult {
  diagram: string | undefined;
  isDiagramLoading: boolean;
  isDiagramError: boolean;
}

export interface DeployPrebuiltIntegrationInput {
  integration: PrebuiltIntegration;
  orgHandler: string;
  projectId: string;
  configValues?: SchemaConfigItem[];
}

export interface DeployPrebuiltIntegrationState {
  progress: number;
  stepLabel: string;
  error: string | null;
  isDeploying: boolean;
  isSuccess: boolean;
  componentHandler: string | null;
  configSaveError: boolean;
}

export interface PrebuiltComponentRef {
  id: string;
  handler: string;
  deploymentTracks: { id: string }[];
}

export interface PrebuiltEnvironmentRef {
  id: string;
  templateId?: string;
}
