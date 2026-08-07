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

import { POD_DRAWER_TOP_OFFSET, POD_DRAWER_WIDTH } from '../../constants/runtime';

export const drawer = (expanded: boolean) =>
  ({
    '& .MuiDrawer-paper': {
      width: expanded ? '100%' : { xs: '100vw', sm: POD_DRAWER_WIDTH },
      maxWidth: '100%',
      position: 'fixed',
      top: POD_DRAWER_TOP_OFFSET,
      height: `calc(100% - ${POD_DRAWER_TOP_OFFSET}px)`,
      display: 'flex',
      flexDirection: 'column',
    },
  }) as const;

export const header = {
  px: 3,
  py: 2,
  borderBottom: '1px solid',
  borderColor: 'divider',
  flexShrink: 0,
} as const;

export const title = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export const headerActions = { flexShrink: 0 } as const;

export const body = {
  flex: 1,
  overflow: 'auto',
  px: 3,
  py: 2,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
} as const;
