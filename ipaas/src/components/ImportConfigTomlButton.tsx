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

import { useRef, type ChangeEvent, type JSX } from 'react';
import { Button, Chip } from '@wso2/oxygen-ui';
import { Upload } from '@wso2/oxygen-ui-icons-react';
import { parseConfigToml, filterTomlValuesBySchema, type BaseType, type JSONSchema } from './SchemaConfigForm';

interface ImportConfigTomlButtonProps {
  schema: JSONSchema | null;
  fileName: string | null;
  onImport: (values: Map<string, BaseType>, fileName: string) => void;
  onClear: () => void;
  onError?: (message: string) => void;
}

export default function ImportConfigTomlButton({ schema, fileName, onImport, onClear, onError }: ImportConfigTomlButtonProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = (ev.target?.result as string) ?? '';
      const result = parseConfigToml(content);
      if (!result.success || !result.data) {
        onError?.('Failed to parse config.toml — ensure the file is valid TOML.');
        return;
      }
      if (!schema) {
        onError?.('Schema is not yet loaded. Please wait and try again.');
        return;
      }
      const filtered = filterTomlValuesBySchema(result.data, schema);
      onImport(filtered, file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      {fileName ? (
        <Chip label={fileName} onDelete={onClear} size="small" variant="outlined" sx={{ maxWidth: 180 }} />
      ) : (
        <Button variant="outlined" size="small" startIcon={<Upload size={14} />} onClick={() => fileInputRef.current?.click()}>
          Import Config.toml
        </Button>
      )}
      <input ref={fileInputRef} type="file" accept=".toml" style={{ display: 'none' }} onChange={handleFileChange} />
    </>
  );
}
