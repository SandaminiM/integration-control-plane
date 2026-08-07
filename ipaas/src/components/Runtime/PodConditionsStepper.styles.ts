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

/** Half-width rule either side of the status icon, joining the steps into one track. */
const connector = { content: '""', flex: 1, height: '1px', bgcolor: 'divider' } as const;

export const track = { mt: 2, mb: 4 } as const;

export const step = {
  flexBasis: '100%',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
} as const;

export const iconRow = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  mb: 2,
  '&::before': connector,
  '&::after': connector,
} as const;

export const icon = (met: boolean) =>
  ({
    display: 'flex',
    color: met ? 'success.main' : 'action.disabled',
  }) as const;

export const label = { px: 1 } as const;

export const time = { mt: 0.5 } as const;

export const message = {
  mt: 0.5,
  px: 1,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  cursor: 'help',
} as const;

export const helpIcon = { display: 'flex', color: 'text.secondary', cursor: 'help' } as const;
