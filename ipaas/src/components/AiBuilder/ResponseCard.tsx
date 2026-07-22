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

import { Box } from '@wso2/oxygen-ui';
import type { JSX, ReactNode } from 'react';
import { RESPONSE_CARD_ACTIONS_SX, RESPONSE_CARD_ERROR_SX, RESPONSE_CARD_SX } from './styles';

interface ResponseCardProps {
  children: ReactNode;
  /** Right-aligned action buttons rendered at the bottom of the card. */
  actions?: ReactNode;
  tone?: 'default' | 'error';
}

export function ResponseCard({ children, actions, tone = 'default' }: ResponseCardProps): JSX.Element {
  return (
    <Box sx={tone === 'error' ? RESPONSE_CARD_ERROR_SX : RESPONSE_CARD_SX}>
      {children}
      {actions && <Box sx={RESPONSE_CARD_ACTIONS_SX}>{actions}</Box>}
    </Box>
  );
}
