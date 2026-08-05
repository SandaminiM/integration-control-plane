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

import { CLOUD_EDITOR_WHEEL_ROW_HEIGHT } from '../../constants/cloudEditor';

const MASK = 'linear-gradient(to bottom, transparent 0, #000 20%, #000 80%, transparent 100%)';

export const WHEEL_VIEWPORT_SX = {
  position: 'relative',
  width: 260,
  height: 6 * CLOUD_EDITOR_WHEEL_ROW_HEIGHT,
  overflow: 'hidden',
  maskImage: MASK,
  WebkitMaskImage: MASK,
} as const;

export const WHEEL_INNER_SX = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  transition: 'transform 450ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  willChange: 'transform',
} as const;

export const WHEEL_ROW_SX = {
  height: CLOUD_EDITOR_WHEEL_ROW_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  pl: 0.5,
  transition: 'opacity 450ms cubic-bezier(0.25, 0.1, 0.25, 1), filter 450ms cubic-bezier(0.25, 0.1, 0.25, 1)',
} as const;

export const WHEEL_ICON_SX = {
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: 'text.secondary',
} as const;
