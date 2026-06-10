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

import { Alert, Box, Typography } from '@wso2/oxygen-ui';
import type { ReactNode } from 'react';
import type { OverviewHeaderSlotProps } from '../../../types/integration';

/**
 * Diagnostic component used by the `UnsupportedFallback` IntegrationModule
 * when the registry has no real module for a type yet (Phase 0 default) or
 * when `identifyIntegration` returns `'unsupported'`. Surfaces the raw wire
 * fields so a developer can immediately tell what was missed.
 */
export default function UnsupportedOverview({ identity }: OverviewHeaderSlotProps): ReactNode {
  const subtypeLabel = identity.raw.componentSubType ? ` / ${identity.raw.componentSubType}` : '';
  return (
    <Box sx={{ py: 4 }}>
      <Alert severity="info">
        <Typography variant="body2">
          The Overview for this integration type is not yet implemented in the new structure. Resolved as <strong>{identity.type}</strong> from
          <code>{` ${identity.raw.displayType}${subtypeLabel}`}</code>.
        </Typography>
      </Alert>
    </Box>
  );
}
