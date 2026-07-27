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
import { DEFAULT_HTTP_METHOD_COLORS, getHttpMethodColors, HTTP_METHOD_COLORS } from './httpMethods';

describe('getHttpMethodColors', () => {
  it('returns the colors for each known method', () => {
    Object.keys(HTTP_METHOD_COLORS).forEach((method) => {
      expect(getHttpMethodColors(method)).toEqual(HTTP_METHOD_COLORS[method]);
    });
  });

  it('is case-insensitive', () => {
    expect(getHttpMethodColors('get')).toEqual(HTTP_METHOD_COLORS.GET);
    expect(getHttpMethodColors('Post')).toEqual(HTTP_METHOD_COLORS.POST);
  });

  it('falls back to the default colors for an unknown method', () => {
    expect(getHttpMethodColors('CONNECT')).toEqual(DEFAULT_HTTP_METHOD_COLORS);
  });

  it('falls back to the default colors for an empty string', () => {
    expect(getHttpMethodColors('')).toEqual(DEFAULT_HTTP_METHOD_COLORS);
  });
});
