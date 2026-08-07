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

export const container = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  overflowX: 'auto',
} as const;

export const emptyState = { py: 4, maxWidth: 640 } as const;

export const loading = { display: 'flex', justifyContent: 'center', py: 6 } as const;

export const helpIcon = { display: 'flex', color: 'text.secondary', cursor: 'help' } as const;

export const message = { whiteSpace: 'pre-wrap', minWidth: 280 } as const;

export const time = { whiteSpace: 'nowrap' } as const;
