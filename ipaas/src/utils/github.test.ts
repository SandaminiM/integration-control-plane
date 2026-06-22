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

import { describe, it, expect } from 'vitest';
import { parseGitHubUrl } from './github';

describe('parseGitHubUrl', () => {
  it('parses a standard HTTPS URL', () => {
    expect(parseGitHubUrl('https://github.com/wso2/my-repo')).toEqual({ org: 'wso2', repo: 'my-repo' });
  });

  it('strips .git suffix', () => {
    expect(parseGitHubUrl('https://github.com/wso2/my-repo.git')).toEqual({ org: 'wso2', repo: 'my-repo' });
  });

  it('trims surrounding whitespace', () => {
    expect(parseGitHubUrl('  https://github.com/wso2/my-repo  ')).toEqual({ org: 'wso2', repo: 'my-repo' });
  });

  it('is case-insensitive for the domain', () => {
    expect(parseGitHubUrl('HTTPS://GITHUB.COM/wso2/my-repo')).toEqual({ org: 'wso2', repo: 'my-repo' });
  });

  it('returns null for SSH URLs', () => {
    expect(parseGitHubUrl('git@github.com:wso2/my-repo.git')).toBeNull();
  });

  it('returns null for non-GitHub URLs', () => {
    expect(parseGitHubUrl('https://gitlab.com/wso2/my-repo')).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(parseGitHubUrl('')).toBeNull();
    expect(parseGitHubUrl('not-a-url')).toBeNull();
    expect(parseGitHubUrl('https://github.com/onlyone')).toBeNull();
  });
});