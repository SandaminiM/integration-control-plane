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

export const viewerSx = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  overflow: 'hidden',
} as const;

export const headerSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 1.5,
  px: 2,
  py: 1.25,
  borderBottom: '1px solid',
  borderColor: 'divider',
} as const;

export const headerActionsSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
} as const;

export const dividerSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  px: 2,
  py: 1.5,
} as const;

export const dividerLineSx = {
  flex: 1,
  borderTop: '1px dashed',
  borderColor: 'divider',
} as const;
