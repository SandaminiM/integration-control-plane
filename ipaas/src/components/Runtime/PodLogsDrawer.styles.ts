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

export const banner = { mb: 2 } as const;

export const actions = { mb: 2 } as const;

export const sinceSecondsInput = { width: 160 } as const;

export const containerSelect = { minWidth: 180 } as const;

export const helpIcon = { display: 'flex', color: 'text.secondary', cursor: 'help' } as const;

export const search = {
  bgcolor: 'action.hover',
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '1px solid', borderColor: 'primary.main' },
  fontSize: '0.875rem',
} as const;

export const filterToggle = { mt: 1, mb: 1.5 } as const;

export const errorDetail = { mt: 0.5 } as const;

export const loading = { display: 'flex', justifyContent: 'center', py: 6 } as const;

export const logView = {
  flex: 1,
  minHeight: 0,
  m: 0,
  p: 2,
  overflow: 'auto',
  bgcolor: 'action.hover',
  borderRadius: 1,
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
} as const;

export const logLine = { display: 'block' } as const;
