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

import { Box, CircularProgress } from '@wso2/oxygen-ui';
import { AlertCircle, HelpCircle } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import type { DetectedMode } from '../../api/queries';

export default function TechDetectionIcon({ mode, isValidating, isError }: { mode: DetectedMode; isValidating: boolean; isError: boolean }): JSX.Element | null {
  if (isValidating) return <CircularProgress size={16} />;
  if (isError) return <AlertCircle size={16} color="var(--mui-palette-error-main, #d32f2f)" />;
  if (mode === 'non-empty') return <HelpCircle size={16} style={{ opacity: 0.5 }} />;
  if (mode === 'mi')
    return (
      <Box
        component="img"
        src="https://wso2.github.io/oxygen-ui/assets/wso2-mi-logo.png"
        alt="WSO2 MI"
        sx={{ width: 16, height: 16, objectFit: 'contain' }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  if (mode === 'ballerina')
    return (
      <Box
        component="img"
        src="https://ballerina.io/favicon.ico"
        alt="Ballerina"
        sx={{ width: 16, height: 16, objectFit: 'contain' }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  return null;
}
