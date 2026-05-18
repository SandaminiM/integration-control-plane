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

import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { Box, Collapse, IconButton, Stack, Typography } from '@wso2/oxygen-ui';
import { ChevronDown, ChevronUp, Trash2 } from '@wso2/oxygen-ui-icons-react';
import type { BaseType, JSONSchema } from '../../../types/schema';
import { type LinkingInfo } from '../schemaUtils';
import { ObjectElement } from './ObjectElement';

interface ConfigGroup {
  groupUuid: string;
  groupName: string;
  groupDisplayName?: string;
  configurations: { keyUuid: string; key: string; isSensitive?: boolean }[];
}

interface ObjectElementContainerProps {
  type: string;
  title: string;
  schema: JSONSchema;
  valueMap: Map<string, BaseType>;
  allowLinking?: boolean;
  configGroups?: ConfigGroup[];
  linkingMap?: Map<string, LinkingInfo>;
  setLinkingMap?: Dispatch<SetStateAction<Map<string, LinkingInfo>>>;
  sensitiveMap?: Map<string, boolean>;
  setSensitiveMap?: Dispatch<SetStateAction<Map<string, boolean>>>;
  handleValueChange: (key: string, value: BaseType, valueMap?: Map<string, BaseType>) => void;
  validationMap: Map<string, boolean>;
  handleValidationChange: (jsonPath: string, isValid: boolean, validationMap?: Map<string, boolean>) => void;
  jsonPath: string;
  isRequired?: boolean;
  hasDeleteBtn?: boolean;
  onDelete?: (jsonPath: string) => void;
  isRequiredAtRequiredLevel: boolean;
}

export function ObjectElementContainer({
  title,
  schema,
  valueMap,
  allowLinking,
  configGroups,
  linkingMap,
  setLinkingMap,
  sensitiveMap,
  setSensitiveMap,
  handleValueChange,
  jsonPath,
  isRequired,
  validationMap,
  handleValidationChange,
  hasDeleteBtn,
  onDelete,
  isRequiredAtRequiredLevel,
}: ObjectElementContainerProps) {
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ mt: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onClick={() => setOpen((p) => !p)}
        sx={{ px: 1.5, py: 0.75, cursor: 'pointer', userSelect: 'none', bgcolor: 'action.hover', borderBottom: open ? '1px solid' : 'none', borderColor: 'divider' }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        <Stack direction="row" alignItems="center" gap={0.5}>
          {hasDeleteBtn && (
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(jsonPath);
              }}
              aria-label="delete array element">
              <Trash2 size={14} />
            </IconButton>
          )}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </Stack>
      </Stack>
      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 1.5, width: '100%' }}>
          <ObjectElement
            title={title}
            type={schema.type}
            schema={schema || { type: 'object', properties: {} }}
            valueMap={valueMap}
            handleValueChange={handleValueChange}
            jsonPath={jsonPath}
            isRequired={isRequired}
            validationMap={validationMap}
            handleValidationChange={handleValidationChange}
            isRequiredAtRequiredLevel={isRequiredAtRequiredLevel}
            allowLinking={allowLinking}
            configGroups={configGroups}
            linkingMap={linkingMap}
            setLinkingMap={setLinkingMap}
            sensitiveMap={sensitiveMap}
            setSensitiveMap={setSensitiveMap}
          />
        </Box>
      </Collapse>
    </Box>
  );
}
