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

import { describe, expect, it } from 'vitest';
import { derivePrebuiltSlug, getDotChoreoBaseUrl, matchPrebuiltIntegration, normalizePrebuiltIntegrations } from './prebuilt';
import type { PrebuiltIntegration } from '../types/prebuilt';
import type { Repository } from '../types/repository';

const integration: PrebuiltIntegration = {
  displayName: 'My Integration',
  description: 'desc',
  applications: ['Salesforce', 'Slack'],
  bidirectional: false,
  componentType: 'service',
  buildPack: 'ballerina',
  repositoryUrl: 'https://github.com/wso2/prebuilt-integrations/',
  branch: 'main',
  componentPath: '/integrations/my-integration',
  tags: ['crm'],
  imageUrl: 'https://example.com/image.png',
};

const repository: Repository = {
  gitProvider: 'github',
  organizationApp: 'wso2',
  nameApp: 'prebuilt-integrations',
  branch: 'main',
  appSubPath: 'integrations/my-integration',
};

describe('matchPrebuiltIntegration', () => {
  it('matches when repo url, component path and branch align', () => {
    expect(matchPrebuiltIntegration(repository, [integration])).toBe(integration);
  });

  it('returns undefined when prebuilts is undefined', () => {
    expect(matchPrebuiltIntegration(repository, undefined)).toBeUndefined();
  });

  it('returns undefined when prebuilts is empty', () => {
    expect(matchPrebuiltIntegration(repository, [])).toBeUndefined();
  });

  it('returns undefined when repository is null', () => {
    expect(matchPrebuiltIntegration(null, [integration])).toBeUndefined();
  });

  it('returns undefined when repository is undefined', () => {
    expect(matchPrebuiltIntegration(undefined, [integration])).toBeUndefined();
  });

  it('returns undefined when repository is missing organizationApp', () => {
    const repo: Repository = { ...repository, organizationApp: '' };
    expect(matchPrebuiltIntegration(repo, [integration])).toBeUndefined();
  });

  it('returns undefined when repository is missing nameApp', () => {
    const repo: Repository = { ...repository, nameApp: '' };
    expect(matchPrebuiltIntegration(repo, [integration])).toBeUndefined();
  });

  it('returns undefined when repository is missing appSubPath', () => {
    const repo: Repository = { ...repository, appSubPath: '' };
    expect(matchPrebuiltIntegration(repo, [integration])).toBeUndefined();
  });

  it('returns undefined when the repo url does not match', () => {
    const repo: Repository = { ...repository, organizationApp: 'someone-else' };
    expect(matchPrebuiltIntegration(repo, [integration])).toBeUndefined();
  });

  it('returns undefined when the component path does not match', () => {
    const repo: Repository = { ...repository, appSubPath: 'integrations/other' };
    expect(matchPrebuiltIntegration(repo, [integration])).toBeUndefined();
  });

  it('normalizes a leading slash on appSubPath before comparing', () => {
    const repo: Repository = { ...repository, appSubPath: '/integrations/my-integration' };
    expect(matchPrebuiltIntegration(repo, [integration])).toBe(integration);
  });

  it('returns undefined when the branch does not match', () => {
    const repo: Repository = { ...repository, branch: 'develop' };
    expect(matchPrebuiltIntegration(repo, [integration])).toBeUndefined();
  });

  it('matches against a default main branch when the integration has no branch set', () => {
    const noBranchIntegration: PrebuiltIntegration = { ...integration, branch: undefined };
    expect(matchPrebuiltIntegration(repository, [noBranchIntegration])).toBe(noBranchIntegration);
  });

  it('ignores branch entirely when the repository has no branch', () => {
    const repo: Repository = { ...repository, branch: '' };
    expect(matchPrebuiltIntegration(repo, [integration])).toBe(integration);
  });
});

describe('normalizePrebuiltIntegrations', () => {
  it('collects and sorts the union of application names across integrations', () => {
    const second: PrebuiltIntegration = { ...integration, applications: ['Zendesk', 'Slack'] };
    const result = normalizePrebuiltIntegrations({ prebuiltIntegrations: [integration, second] });
    expect(result.prebuiltIntegrations).toEqual([integration, second]);
    expect(result.applications).toEqual(['Salesforce', 'Slack', 'Zendesk']);
  });

  it('returns an empty applications list for an empty integrations array', () => {
    const result = normalizePrebuiltIntegrations({ prebuiltIntegrations: [] });
    expect(result).toEqual({ prebuiltIntegrations: [], applications: [] });
  });

  it('handles integrations with no applications field', () => {
    const noApps: PrebuiltIntegration = { ...integration, applications: undefined as unknown as string[] };
    const result = normalizePrebuiltIntegrations({ prebuiltIntegrations: [noApps] });
    expect(result.applications).toEqual([]);
  });
});

describe('derivePrebuiltSlug', () => {
  it('uses the last path segment when it is a valid handler', () => {
    expect(derivePrebuiltSlug(integration)).toBe('my-integration');
  });

  it('falls back to a sanitised display name when the path segment is too short', () => {
    const shortPath: PrebuiltIntegration = { ...integration, componentPath: '/ab' };
    expect(derivePrebuiltSlug(shortPath)).toBe('my-integration');
  });

  it('falls back to a sanitised display name when the path segment is not a valid handler', () => {
    const invalidPath: PrebuiltIntegration = { ...integration, componentPath: '/My_Integration' };
    expect(derivePrebuiltSlug(invalidPath)).toBe('my-integration');
  });

  it('truncates to 25 characters', () => {
    const longPath: PrebuiltIntegration = { ...integration, componentPath: '/this-is-a-very-long-component-path-slug' };
    const slug = derivePrebuiltSlug(longPath);
    expect(slug).toHaveLength(25);
    expect(slug).toBe('this-is-a-very-long-compo');
  });

  it('handles an empty component path by falling back to the display name', () => {
    const emptyPath: PrebuiltIntegration = { ...integration, componentPath: '' };
    expect(derivePrebuiltSlug(emptyPath)).toBe('my-integration');
  });
});

describe('getDotChoreoBaseUrl', () => {
  it('builds the raw githubusercontent .choreo url using the branch and component path', () => {
    expect(getDotChoreoBaseUrl(integration)).toBe('https://raw.githubusercontent.com/wso2/prebuilt-integrations/main/integrations/my-integration/.choreo/');
  });

  it('defaults to the main branch when the integration has no branch set', () => {
    const noBranch: PrebuiltIntegration = { ...integration, branch: undefined };
    expect(getDotChoreoBaseUrl(noBranch)).toBe('https://raw.githubusercontent.com/wso2/prebuilt-integrations/main/integrations/my-integration/.choreo/');
  });

  it('uses a non-main branch when provided', () => {
    const featureBranch: PrebuiltIntegration = { ...integration, branch: 'feature-x' };
    expect(getDotChoreoBaseUrl(featureBranch)).toBe('https://raw.githubusercontent.com/wso2/prebuilt-integrations/feature-x/integrations/my-integration/.choreo/');
  });
});
