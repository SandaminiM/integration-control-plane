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
import { useState } from 'react';

interface TagInputProps {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

export default function TagInput({ values, onChange, placeholder, suggestions }: TagInputProps) {
  const [input, setInput] = useState('');
  const filteredSuggestions = (suggestions ?? []).filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s),
  );
  const showSuggestions = input.length > 0 && filteredSuggestions.length > 0;

  const addValue = (val: string) => {
    const trimmed = val.trim().replace(/,$/, '');
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addValue(input);
    } else if (e.key === 'Backspace' && !input && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 0.75,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          minHeight: 40,
        }}>
        {values.map((v) => (
          <Box
            key={v}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              bgcolor: 'action.selected',
              borderRadius: 0.75,
              px: 0.75,
              py: 0.25,
              fontSize: '0.75rem',
            }}>
            <span>{v}</span>
            <Box
              component="span"
              onClick={() => onChange(values.filter((x) => x !== v))}
              sx={{ cursor: 'pointer', ml: 0.25, opacity: 0.6, '&:hover': { opacity: 1 }, lineHeight: 1 }}>
              ×
            </Box>
          </Box>
        ))}
        <Box
          component="input"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : ''}
          sx={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '0.8125rem',
            flex: 1,
            minWidth: 80,
            color: 'text.primary',
            '&::placeholder': { color: 'text.disabled' },
          }}
        />
      </Box>
      {showSuggestions && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1400,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 3,
            maxHeight: 160,
            overflowY: 'auto',
          }}>
          {filteredSuggestions.map((s) => (
            <Box
              key={s}
              onMouseDown={(e) => { e.preventDefault(); addValue(s); }}
              sx={{
                px: 1.5,
                py: 0.75,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}>
              {s}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
