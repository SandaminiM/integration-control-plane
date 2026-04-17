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

import { Box, Typography } from '@wso2/oxygen-ui';
import type { JSX, KeyboardEvent } from 'react';

interface PillTabsProps {
  value: number;
  onChange: (v: number) => void;
  tabs: { label: string }[];
}

export default function PillTabs({ value, onChange, tabs }: PillTabsProps): JSX.Element {
  const count = tabs.length;
  const tabWidthCalc = `calc((100% - ${8 + (count - 1) * 4}px) / ${count})`;

  return (
    <Box role="tablist" sx={{ position: 'relative', display: 'flex', bgcolor: 'action.hover', borderRadius: 2, p: 0.5, gap: 0.5 }}>
      {/* Sliding indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 4,
          width: tabWidthCalc,
          borderRadius: 1.5,
          bgcolor: 'background.paper',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: `translateX(calc(${value} * (100% + 4px)))`,
          zIndex: 0,
        }}
      />
      {tabs.map((tab, index) => (
        <Box
          key={tab.label}
          role="tab"
          tabIndex={0}
          aria-selected={value === index}
          onClick={() => onChange(index)}
          onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(index); } }}
          sx={{
            flex: 1,
            textAlign: 'center',
            py: 0.75,
            px: 1,
            borderRadius: 1.5,
            cursor: 'pointer',
            userSelect: 'none',
            position: 'relative',
            zIndex: 1,
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
          }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: value === index ? 600 : 400,
              color: value === index ? 'text.primary' : 'text.secondary',
              fontSize: 13,
              lineHeight: 1.4,
              transition: 'color 0.2s ease, font-weight 0.2s ease',
            }}>
            {tab.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
