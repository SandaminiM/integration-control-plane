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

import { Box, TreeView } from '@wso2/oxygen-ui';
import { Folder } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import type { RepoTreeNode } from '../api/queries';

const { TreeItem } = TreeView;

export function renderTree(nodes: RepoTreeNode[]): JSX.Element[] {
  return nodes
    .filter((n) => n.type === 'tree')
    .map((node) => (
      <TreeItem
        key={node.path}
        itemId={node.path}
        label={
          <Box display="flex" alignItems="center" gap={0.75}>
            <Folder size={14} style={{ flexShrink: 0 }} />
            <span>{node.subPath}</span>
          </Box>
        }>
        {node.children && node.children.length > 0 ? renderTree(node.children) : null}
      </TreeItem>
    ));
}

export function filterDirectories(nodes: RepoTreeNode[], query: string): RepoTreeNode[] {
  const result: RepoTreeNode[] = [];
  for (const node of nodes) {
    if (node.type !== 'tree') continue;
    const matches = node.subPath.toLowerCase().includes(query);
    const filteredChildren = node.children ? filterDirectories(node.children, query) : [];
    if (matches || filteredChildren.length > 0) {
      result.push({ ...node, children: filteredChildren });
    }
  }
  return result;
}

export function buildDefaultExpanded(path: string): string[] {
  if (!path || path === '/') return [];
  // "/src/main/java" → ["src", "src/main", "src/main/java"]
  const parts = path.replace(/^\//, '').split('/');
  return parts.map((_, i) => parts.slice(0, i + 1).join('/'));
}
