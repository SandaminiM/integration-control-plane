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
import { parseRecent, pushRecent } from './recentAccess';

const e = (key: string, at = 1) => ({ key, at });

describe('pushRecent', () => {
  it('puts a new key first with its visit time', () => {
    expect(pushRecent([e('a'), e('b')], 'c', 5)).toEqual([e('c', 5), e('a'), e('b')]);
  });

  it('moves an existing key to the front with the new time, without duplicating it', () => {
    expect(pushRecent([e('a'), e('b'), e('c')], 'b', 9)).toEqual([e('b', 9), e('a'), e('c')]);
  });

  it('drops the oldest entries past the limit', () => {
    expect(pushRecent([e('a'), e('b'), e('c')], 'd', 2, 3)).toEqual([e('d', 2), e('a'), e('b')]);
  });
});

describe('parseRecent', () => {
  it('reads a stored list', () => {
    expect(parseRecent('[{"key":"a","at":1},{"key":"b","at":2}]')).toEqual([e('a', 1), e('b', 2)]);
  });

  it('treats a missing, malformed or non-list value as empty', () => {
    expect(parseRecent(null)).toEqual([]);
    expect(parseRecent('{not json')).toEqual([]);
    expect(parseRecent('{"a":1}')).toEqual([]);
  });

  it('drops entries that are not well formed', () => {
    expect(parseRecent('[{"key":"a","at":1},"b",{"key":"c"},null]')).toEqual([e('a', 1)]);
  });
});
