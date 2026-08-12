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

import { Box, Button, PageContent, Stack, Typography } from '@wso2/oxygen-ui';
import { ArrowLeft } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import { useAppNavigate } from '../hooks/useAppNavigate';
interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({ title = 'Coming Soon', description = 'This feature is currently under development. Check back soon!' }: ComingSoonProps): JSX.Element {
  const navigate = useAppNavigate();

  return (
    <PageContent
      sx={{
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Stack alignItems="center" gap={3} sx={{ maxWidth: 480, textAlign: 'center' }}>
        {/* Illustration */}
        <Box sx={{ position: 'relative', width: 200, height: 160 }}>
          <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" width="200" height="160">
            {/* Background circle */}
            <circle cx="100" cy="80" r="72" fill="currentColor" fillOpacity="0.06" />

            {/* Outer ring */}
            <circle cx="100" cy="80" r="58" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="6 4" />

            {/* Clock face */}
            <circle cx="100" cy="80" r="38" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />

            {/* Clock hour hand */}
            <line x1="100" y1="80" x2="100" y2="54" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />

            {/* Clock minute hand */}
            <line x1="100" y1="80" x2="118" y2="72" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />

            {/* Clock center dot */}
            <circle cx="100" cy="80" r="3" fill="currentColor" fillOpacity="0.5" />

            {/* Clock tick marks */}
            <line x1="100" y1="44" x2="100" y2="48" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
            <line x1="100" y1="112" x2="100" y2="116" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
            <line x1="64" y1="80" x2="68" y2="80" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
            <line x1="132" y1="80" x2="136" y2="80" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />

            {/* Loading bar 1 */}
            <rect x="24" y="130" width="60" height="7" rx="3.5" fill="currentColor" fillOpacity="0.1" />
            <rect x="24" y="130" width="36" height="7" rx="3.5" fill="currentColor" fillOpacity="0.35" />

            {/* Loading bar 2 */}
            <rect x="116" y="130" width="60" height="7" rx="3.5" fill="currentColor" fillOpacity="0.1" />
            <rect x="116" y="130" width="48" height="7" rx="3.5" fill="currentColor" fillOpacity="0.25" />

            {/* Sparkle top-right */}
            <path d="M158 28 L160 22 L162 28 L168 30 L162 32 L160 38 L158 32 L152 30 Z" fill="currentColor" fillOpacity="0.3" />

            {/* Sparkle top-left */}
            <path d="M36 20 L37.5 16 L39 20 L43 21.5 L39 23 L37.5 27 L36 23 L32 21.5 Z" fill="currentColor" fillOpacity="0.2" />
          </svg>
        </Box>

        {/* Text */}
        <Stack alignItems="center" gap={1}>
          <Typography variant="h4" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 360 }}>
            {description}
          </Typography>
        </Stack>

        {/* Back button */}
        <Button variant="outlined" startIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Stack>
    </PageContent>
  );
}
