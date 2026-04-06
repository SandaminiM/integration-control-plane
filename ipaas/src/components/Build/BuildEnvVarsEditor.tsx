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

import { Box, Button, IconButton, Stack, TextField, Typography } from '@wso2/oxygen-ui';
import { Plus, Trash2 } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useMemo } from 'react';

export interface BuildEnvVar {
  id?: string;
  key: string;
  value: string;
}

interface BuildEnvVarsEditorProps {
  value: BuildEnvVar[];
  onChange: (vars: BuildEnvVar[]) => void;
  onHasError: (hasError: boolean) => void;
}

const ENV_KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function validateRow(vars: BuildEnvVar[], index: number): string | null {
  const { key, value } = vars[index];
  if (!key.trim()) return 'Key is required';
  if (!ENV_KEY_RE.test(key)) return 'Key must start with a letter or _ and contain only letters, digits, or _';
  if (vars.some((v, i) => i !== index && v.key === key)) return 'Key already exists';
  if (!value.trim()) return 'Value is required';
  return null;
}

export default function BuildEnvVarsEditor({ value, onChange, onHasError }: BuildEnvVarsEditorProps) {
  const errors = useMemo(() => value.map((_, i) => validateRow(value, i)), [value]);
  const hasError = errors.some(Boolean);

  useEffect(() => {
    onHasError(hasError);
  }, [hasError, onHasError]);

  const handleKeyChange = (index: number, newKey: string) => {
    const updated = value.map((v, i) => (i === index ? { ...v, key: newKey } : v));
    onChange(updated);
  };

  const handleValueChange = (index: number, newValue: string) => {
    const updated = value.map((v, i) => (i === index ? { ...v, value: newValue } : v));
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([...value, { key: '', value: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <Stack gap={1}>
      <Stack direction="row" alignItems="center" gap={0.75}>
        <Typography variant="body2">Environment Variables</Typography>
        <Typography variant="caption" color="text.secondary">
          (Optional)
        </Typography>
      </Stack>

      {value.length > 0 && (
        <Stack gap={0.5}>
          {/* Header row */}
          <Stack direction="row" gap={1} sx={{ px: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              Key
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              Value
            </Typography>
            <Box sx={{ width: 28 }} />
          </Stack>

          {value.map((envVar, index) => (
            <Stack key={index} gap={0.25}>
              <Stack direction="row" gap={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="KEY_NAME"
                  value={envVar.key}
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  error={!!errors[index] && (errors[index]!.includes('Key') || errors[index]!.includes('already'))}
                  sx={{ flex: 1, '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
                  inputProps={{ spellCheck: false }}
                />
                <TextField
                  size="small"
                  placeholder="value"
                  value={envVar.value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  error={!!errors[index] && errors[index]!.includes('Value')}
                  sx={{ flex: 1, '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
                  inputProps={{ spellCheck: false }}
                />
                <IconButton
                  size="small"
                  aria-label="Remove variable"
                  onClick={() => handleRemove(index)}
                  sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' }, flexShrink: 0 }}
                >
                  <Trash2 size={14} />
                </IconButton>
              </Stack>
              {errors[index] && (
                <Typography variant="caption" color="error" sx={{ pl: 0.5 }}>
                  {errors[index]}
                </Typography>
              )}
            </Stack>
          ))}
        </Stack>
      )}

      <Box>
        <Button
          variant="text"
          size="small"
          startIcon={<Plus size={14} />}
          onClick={handleAdd}
          sx={{ textTransform: 'none', fontSize: '0.75rem', px: 0.5, py: 0.25 }}
        >
          Add Variable
        </Button>
      </Box>
    </Stack>
  );
}
