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

import { describe, expect, it, vi } from 'vitest';

vi.mock('@wso2/oxygen-ui', () => ({
  Box: () => null,
  TreeView: { TreeItem: () => null },
}));

vi.mock('@wso2/oxygen-ui-icons-react', () => ({
  Folder: () => null,
}));

import { renderTree, filterDirectories, buildDefaultExpanded } from './directoryTree';
import type { RepoTreeNode } from '../types/repository';

const nodes: RepoTreeNode[] = [
  {
    path: 'src',
    subPath: 'src',
    type: 'tree',
    children: [
      { path: 'src/main', subPath: 'main', type: 'tree', children: [{ path: 'src/main/App.tsx', subPath: 'App.tsx', type: 'blob' }] },
      { path: 'src/index.ts', subPath: 'index.ts', type: 'blob' },
    ],
  },
  { path: 'README.md', subPath: 'README.md', type: 'blob' },
  { path: 'test', subPath: 'test', type: 'tree' },
];

describe('renderTree', () => {
  it('does not throw when rendering a fixture tree', () => {
    expect(() => renderTree(nodes)).not.toThrow();
  });

  it('returns one element per tree node, filtering out blob nodes', () => {
    expect(renderTree(nodes).length).toBe(2);
  });

  it('returns an empty array when there are no tree nodes', () => {
    expect(renderTree([{ path: 'README.md', subPath: 'README.md', type: 'blob' }])).toEqual([]);
  });

  it('returns an empty array for an empty node list', () => {
    expect(renderTree([])).toEqual([]);
  });

  it('keys each element by its node path', () => {
    const elements = renderTree(nodes);
    expect(elements.map((el) => el.key)).toEqual(['src', 'test']);
  });
});

describe('filterDirectories', () => {
  it('keeps directories whose name matches the query', () => {
    const result = filterDirectories(nodes, 'src');
    expect(result.map((n) => n.path)).toEqual(['src']);
  });

  it('keeps a parent directory when a descendant matches, and prunes non-matching siblings', () => {
    const result = filterDirectories(nodes, 'main');
    expect(result).toEqual([
      {
        path: 'src',
        subPath: 'src',
        type: 'tree',
        children: [{ path: 'src/main', subPath: 'main', type: 'tree', children: [] }],
      },
    ]);
  });

  it('excludes blob nodes entirely', () => {
    const result = filterDirectories(nodes, 'readme');
    expect(result).toEqual([]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterDirectories(nodes, 'nonexistent')).toEqual([]);
  });

  it('returns an empty array for an empty node list', () => {
    expect(filterDirectories([], 'anything')).toEqual([]);
  });

  it('matches every directory for an empty query', () => {
    const result = filterDirectories(nodes, '');
    expect(result.map((n) => n.path)).toEqual(['src', 'test']);
  });
});

describe('buildDefaultExpanded', () => {
  it('returns an empty array for an empty path', () => {
    expect(buildDefaultExpanded('')).toEqual([]);
  });

  it('returns an empty array for the root path', () => {
    expect(buildDefaultExpanded('/')).toEqual([]);
  });

  it('builds cumulative segments for a nested path', () => {
    expect(buildDefaultExpanded('/src/main/java')).toEqual(['src', 'src/main', 'src/main/java']);
  });

  it('handles a path without a leading slash', () => {
    expect(buildDefaultExpanded('src/main')).toEqual(['src', 'src/main']);
  });

  it('handles a single-segment path', () => {
    expect(buildDefaultExpanded('src')).toEqual(['src']);
  });
});
