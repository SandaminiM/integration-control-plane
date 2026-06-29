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

import { CircularProgress, IconButton, TextField, Tooltip } from '@wso2/oxygen-ui';
import { Pencil } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useState, type JSX } from 'react';

export interface InlineEditFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  editable: boolean;
  validate?: (value: string) => string;
  onSave: (value: string) => Promise<void>;
}

/** A read-only field that becomes editable via a pencil icon and saves on Enter/blur (no separate Save button). */
export default function InlineEditField({ label, value, placeholder, multiline, editable, validate, onSave }: InlineEditFieldProps): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  // Keep the draft in sync when the underlying value changes (e.g. after a save).
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const error = editing ? (validate?.(draft) ?? '') : '';

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const commit = async () => {
    const trimmed = draft.trim();
    if (trimmed === value.trim()) {
      cancel();
      return;
    }
    if (validate?.(draft)) return; // stay in edit mode while invalid
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      // Failure is surfaced by the caller's alert; keep edit mode open for a retry.
    } finally {
      setSaving(false);
    }
  };

  return (
    <TextField
      label={label}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => editing && void commit()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault();
          void commit();
        } else if (e.key === 'Escape') {
          cancel();
        }
      }}
      fullWidth
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      error={!!error}
      helperText={error || ' '}
      slotProps={{
        input: {
          readOnly: !editing,
          endAdornment: !editable ? undefined : saving ? (
            <CircularProgress size={16} />
          ) : editing ? null : (
            <Tooltip title={`Edit ${label.toLowerCase()}`}>
              <IconButton size="small" edge="end" aria-label={`Edit ${label.toLowerCase()}`} onClick={() => setEditing(true)}>
                <Pencil size={16} />
              </IconButton>
            </Tooltip>
          ),
        },
      }}
    />
  );
}
