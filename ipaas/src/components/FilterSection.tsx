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

import { Box, Checkbox, Typography } from '@wso2/oxygen-ui';
import { ChevronDown, ChevronUp } from '@wso2/oxygen-ui-icons-react';
import { useState, type JSX } from 'react';

interface FilterSectionProps {
  title: string;
  items: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  labelFn?: (value: string) => string;
  defaultOpen?: boolean;
}

export default function FilterSection({ title, items, selected, onToggle, labelFn, defaultOpen = true }: FilterSectionProps): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Box sx={{ mb: 1 }}>
      <Box
        component="button"
        onClick={() => setOpen(!open)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          p: 1,
          px: 0,
          color: 'text.primary',
        }}>
        <Typography variant="body2" fontWeight={600}>
          {title}
        </Typography>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </Box>
      {open && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.25,
            maxHeight: 200,
            overflowY: 'auto',
            pl: 0.5,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'divider',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'action.disabled' },
            scrollbarWidth: 'thin',
            scrollbarColor: (theme: { palette: { divider: string } }) => `${theme.palette.divider} transparent`,
          }}>
          {items.map((item) => (
            <Box
              key={item}
              component="label"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                py: 0.25,
                px: 0.5,
                borderRadius: 0.5,
                '&:hover': { bgcolor: 'action.hover' },
              }}>
              <Checkbox size="small" checked={selected.has(item)} onChange={() => onToggle(item)} sx={{ p: 0.5 }} tabIndex={-1} />
              <Typography variant="body2" sx={{ fontSize: 13, userSelect: 'none' }}>
                {labelFn ? labelFn(item) : item}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
