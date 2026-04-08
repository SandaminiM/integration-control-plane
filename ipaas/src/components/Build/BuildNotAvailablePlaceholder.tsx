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

import { Box, PageContent, Typography } from '@wso2/oxygen-ui';
import { Hammer } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';

export default function BuildNotAvailablePlaceholder({ level }: { level: string }): JSX.Element {
  return (
    <PageContent>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
        <Hammer size={40} style={{ opacity: 0.3 }} />
        <Typography variant="h3" color="text.secondary">
          Build is not available at the {level} level
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Navigate to a component to view and manage builds.
        </Typography>
      </Box>
    </PageContent>
  );
}
