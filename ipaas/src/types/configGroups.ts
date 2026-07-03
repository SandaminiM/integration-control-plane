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
 * Types for the org-level Config Groups admin feature (config-svc). A config group is a
 * named bundle of configuration keys, each carrying a per-environment value plus
 * secret (`isSensitive`) / file (`isFile`) flags. Mirrors Devant's config-svc contract.
 */

/** How a config value is entered/displayed in the UI. */
export type ConfigValueType = 'text' | 'secret' | 'file';

/** One environment's value for a key. For file keys, `value` is a base64 string. */
export interface ConfigValue {
  environmentUuid: string;
  value: string;
  valueRef?: string;
  valueVersion?: string;
}

/** A single configuration key within a group. */
export interface Configuration {
  keyUuid: string;
  key: string;
  values: ConfigValue[];
  isSensitive: boolean;
  isFile: boolean;
}

export interface ConfigGroupScope {
  organizationUuid?: string;
  projectUuid?: string;
  componentUuid?: string;
}

export interface ConfigEnvironmentSet {
  environmentSetUuid: string;
  environmentTemplates: string[];
}

/** A config group as returned by the API. */
export interface ConfigGroup {
  groupUuid: string;
  groupName: string;
  groupDisplayName?: string;
  description: string;
  type?: string;
  scopes?: ConfigGroupScope[];
  configurations: Configuration[];
  environmentSets?: ConfigEnvironmentSet[];
  revision?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Request body for `POST /configs/groups`. `keyUuid` is empty for new keys. */
export interface CreateConfigGroupRequest {
  groupName: string;
  groupDisplayName: string;
  description: string;
  /** Required by the backend — the org this group belongs to. */
  scopes: ConfigGroupScope[];
  configurations: Configuration[];
}

/** Request body for `PUT /configs/groups/{groupUuid}` — create fields plus the group id. */
export interface EditConfigGroupRequest extends CreateConfigGroupRequest {
  groupUuid: string;
}

/** `GET /configs/groups/check-group-name` response. */
export interface ConfigGroupNameAvailability {
  isGroupNameUnique: boolean;
  alternativeGroupName?: string;
}

// --- Usage (which projects/components/releases reference a group) ---

export interface ConfigGroupUsageRelease {
  envTemplateId: string;
  envTemplateName: string;
}

export interface ConfigGroupUsageComponent {
  componentId: string;
  componentName: string;
  componentHandler: string;
  usageInReleases: ConfigGroupUsageRelease[];
}

export interface ConfigGroupUsageProject {
  projectId: string;
  projectName: string;
  projectHandler: string;
  usageInComponents: ConfigGroupUsageComponent[];
}

export interface ConfigGroupUsage {
  configGroupId: string;
  usageInProjects: ConfigGroupUsageProject[];
}

// --- Create/edit form shapes (shared between ConfigGroupForm and its pages) ---

/** One configuration key defined in step 1 (name + Text/File + secret flag). */
export interface KeyDefinition {
  keyUuid?: string;
  key: string;
  isFile: boolean;
  isSensitive: boolean;
}

/** A step-2 value-set: a group of environments plus one value per key (keyed by key name). */
export interface ValueSetDraft {
  environmentIds: string[];
  values: Record<string, string>;
}

/** Initial form state for the create/edit wizard. */
export interface ConfigGroupInitialValues {
  displayName: string;
  handle: string;
  description: string;
  keys: KeyDefinition[];
  valueSets: ValueSetDraft[];
}

/** What the form emits on submit — the built `configurations` plus identity fields. */
export interface ConfigGroupSubmitValues {
  displayName: string;
  handle: string;
  description: string;
  configurations: Configuration[];
}
