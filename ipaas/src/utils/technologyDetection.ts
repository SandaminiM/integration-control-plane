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

import type { RepoMetadata, DetectedMode, RepoTreeNode } from '../types/repository';
import type { WorkspaceModule } from '../types/project';
import { formatRepoNameToDisplayName } from './string';

export function detectTechnology(metadata: RepoMetadata | undefined): DetectedMode {
  if (!metadata) return null;

  const { hasBallerinaTomlInPath, hasBallerinaTomlInRoot, hasPomXmlInPath, hasPomXmlInRoot, isSubPathEmpty } = metadata;

  if (hasBallerinaTomlInPath || hasBallerinaTomlInRoot) return 'ballerina';
  if (hasPomXmlInPath || hasPomXmlInRoot) return 'mi';
  if (isSubPathEmpty) return 'empty';
  return 'non-empty';
}

export function isBallerinaWorkspace(nodes: RepoTreeNode[]): boolean {
  const hasRootToml = nodes.some((n) => n.subPath === 'Ballerina.toml' && n.type === 'blob');
  if (!hasRootToml) return false;
  const subdirs = nodes.filter((n) => n.type === 'tree');
  return subdirs.some((dir) => dir.children?.some((child) => child.subPath === 'Ballerina.toml' && child.type === 'blob'));
}

export function extractWorkspaceModules(nodes: RepoTreeNode[]): WorkspaceModule[] {
  return nodes
    .filter((n) => n.type === 'tree' && n.children?.some((child) => child.subPath === 'Ballerina.toml' && child.type === 'blob'))
    .map((n) => ({
      path: n.path,
      name: n.subPath,
      displayName: formatRepoNameToDisplayName(n.subPath),
      integrationType: 'service' as const,
    }));
}

export function isBallerinaModule(node: RepoTreeNode): boolean {
  return node.type === 'tree' && (node.children?.some((c) => c.subPath === 'Ballerina.toml' && c.type === 'blob') ?? false);
}
