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
import { getComponentTypeFlags } from './componentType';

describe('getComponentTypeFlags', () => {
  it('flags proxy types', () => {
    expect(getComponentTypeFlags('proxy')).toEqual({
      isProxy: true,
      isService: false,
      isRestApi: false,
      isByoi: false,
      isAutomation: false,
      isCommitBased: false,
      isImageBased: false,
      isDeployable: false,
    });
    expect(getComponentTypeFlags('gitProxy').isProxy).toBe(true);
  });

  it('flags service types as commit-based and deployable', () => {
    for (const type of ['ballerinaService', 'miApiService']) {
      const flags = getComponentTypeFlags(type);
      expect(flags.isService).toBe(true);
      expect(flags.isCommitBased).toBe(true);
      expect(flags.isDeployable).toBe(true);
      expect(flags.isImageBased).toBe(false);
    }
  });

  it('flags rest API types as commit-based and deployable', () => {
    for (const type of ['restAPI', 'miRestApi']) {
      const flags = getComponentTypeFlags(type);
      expect(flags.isRestApi).toBe(true);
      expect(flags.isCommitBased).toBe(true);
      expect(flags.isDeployable).toBe(true);
    }
  });

  it('flags byoiService as image-based and deployable but not commit-based', () => {
    const flags = getComponentTypeFlags('byoiService');
    expect(flags.isByoi).toBe(true);
    expect(flags.isImageBased).toBe(true);
    expect(flags.isCommitBased).toBe(false);
    expect(flags.isDeployable).toBe(true);
  });

  it('flags scheduledTask and miCronjob as automation and commit-based', () => {
    for (const type of ['scheduledTask', 'miCronjob']) {
      const flags = getComponentTypeFlags(type);
      expect(flags.isAutomation).toBe(true);
      expect(flags.isCommitBased).toBe(true);
      expect(flags.isByoi).toBe(false);
      expect(flags.isDeployable).toBe(true);
    }
  });

  it('flags byoiCronjob as both automation and byoi, but not commit-based', () => {
    const flags = getComponentTypeFlags('byoiCronjob');
    expect(flags.isAutomation).toBe(true);
    expect(flags.isByoi).toBe(true);
    expect(flags.isImageBased).toBe(true);
    expect(flags.isCommitBased).toBe(false);
    expect(flags.isDeployable).toBe(true);
  });

  it('returns all-false flags for unknown types', () => {
    expect(getComponentTypeFlags('unknownType')).toEqual({
      isProxy: false,
      isService: false,
      isRestApi: false,
      isByoi: false,
      isAutomation: false,
      isCommitBased: false,
      isImageBased: false,
      isDeployable: false,
    });
  });

  it('ignores componentSubType', () => {
    expect(getComponentTypeFlags('ballerinaService', 'aiAgent')).toEqual(getComponentTypeFlags('ballerinaService', null));
    expect(getComponentTypeFlags('ballerinaService')).toEqual(getComponentTypeFlags('ballerinaService', undefined));
  });
});
