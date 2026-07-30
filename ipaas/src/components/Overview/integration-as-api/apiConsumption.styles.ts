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

/** Shared styles for the cloud-only API Consumption UI (Consumers subcard, consumer dialog, security drawer). */

export const subCard = {
  mt: 2,
  p: 2,
  borderRadius: 1,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'action.hover',
} as const;

export const subCardHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1.5,
  flexWrap: 'wrap',
} as const;

export const subCardTitle = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  fontWeight: 500,
} as const;

export const consumerRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  p: 1.25,
  borderRadius: 1.5,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
} as const;

export const consumerAvatar = {
  width: 30,
  height: 30,
  borderRadius: 1.5,
  fontSize: 13,
  bgcolor: 'primary.main',
} as const;

export const emptyState = {
  mt: 1.5,
  p: 2.25,
  borderRadius: 1.5,
  border: '1px dashed',
  borderColor: 'divider',
  textAlign: 'center',
} as const;

export const fieldLabel = {
  fontSize: 12,
  fontWeight: 500,
  color: 'text.secondary',
  mb: 0.75,
  display: 'flex',
  justifyContent: 'space-between',
} as const;

export const credField = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 1.25,
  py: 0.75,
  borderRadius: 1,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'action.hover',
} as const;

export const credValue = {
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: 'monospace',
  fontSize: 12.5,
} as const;

export const codeBox = {
  borderRadius: 1,
  overflow: 'hidden',
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'action.hover',
} as const;

export const codeHead = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: 1.5,
  py: 1,
  borderBottom: '1px solid',
  borderColor: 'divider',
} as const;

export const codePre = {
  m: 0,
  px: 1.75,
  py: 1.5,
  fontFamily: 'monospace',
  fontSize: 11.5,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
} as const;
