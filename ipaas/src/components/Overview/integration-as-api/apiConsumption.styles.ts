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

/** Sized and placed like the Build History drawer: below the top nav, full height beneath it. */
export const securityDrawer = {
  '& .MuiDrawer-paper': {
    width: { xs: '100%', sm: 480 },
    top: { xs: '56px', sm: '64px' },
    height: 'auto',
    bottom: 0,
  },
} as const;

export const drawerFrame = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
} as const;

export const drawerHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: 2,
  py: 1.5,
  borderBottom: '1px solid',
  borderColor: 'divider',
  flexShrink: 0,
} as const;

export const drawerBody = {
  flex: 1,
  overflow: 'auto',
  px: 2,
  py: 2,
} as const;

export const drawerFooter = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 1,
  px: 3,
  py: 2,
  borderTop: '1px solid',
  borderColor: 'divider',
} as const;

export const tableHeadCell = {
  color: 'text.secondary',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
} as const;

export const schemeCell = {
  verticalAlign: 'top',
} as const;

export const schemeDescription = {
  display: 'block',
  mt: 0.75,
} as const;

/** Wrapper that carries a tooltip for a disabled control (which swallows pointer events). */
export const disabledTooltipTarget = {
  display: 'inline-flex',
} as const;

export const singleEndpointName = {
  minWidth: 200,
  px: 1.5,
  py: 0.75,
  borderRadius: 0.5,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'action.hover',
  fontSize: 13,
  fontWeight: 500,
} as const;

export const endpointSelect = {
  minWidth: 200,
} as const;

export const dialogTitle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
} as const;

export const dialogActions = {
  justifyContent: 'space-between',
  px: 3,
  py: 2,
} as const;

export const envChip = {
  height: 22,
  fontSize: '0.7rem',
} as const;

export const requiredMark = {
  color: 'error.main',
  ml: 0.25,
} as const;

export const centredRow = {
  display: 'flex',
  justifyContent: 'center',
  py: 1.5,
} as const;

export const subscribedNote = {
  color: 'success.main',
} as const;

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

export const textAction = {
  textTransform: 'none',
} as const;

export const loadingRow = {
  display: 'flex',
  justifyContent: 'center',
  py: 2.5,
} as const;

export const panelAlert = {
  mt: 1.5,
} as const;

export const consumerList = {
  mt: 1.5,
} as const;

export const consumerRowText = {
  flex: 1,
  minWidth: 0,
} as const;

export const consumerRowSubtitle = {
  display: 'block',
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

export const dialogAlert = {
  mb: 2,
} as const;

export const copyButton = {
  minWidth: 0,
  whiteSpace: 'nowrap',
} as const;

export const fieldLabel = {
  fontSize: 12,
  fontWeight: 500,
  color: 'text.secondary',
  mb: 0.75,
  display: 'flex',
  justifyContent: 'space-between',
} as const;

/** `fieldLabel` for a field that follows another one. */
export const nextFieldLabel = {
  ...fieldLabel,
  mt: 2.5,
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
