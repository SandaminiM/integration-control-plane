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

import React, { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@wso2/oxygen-ui';
import { Edit2, Plus } from '@wso2/oxygen-ui-icons-react';
import type { BaseType, JSONSchema } from '../../../types/schema';
import { type LinkingInfo, extractAllKeySet, extractUniqueKeySet, setArrayType, typeDisplayName } from '../schemaUtils';
import PopOverComponent from './PopOverComponent';

interface ConfigGroup {
  groupUuid: string;
  groupName: string;
  groupDisplayName?: string;
  configurations: { keyUuid: string; key: string; isSensitive?: boolean }[];
}

interface ArrayElementProps {
  type: string;
  title: string;
  schema: JSONSchema | undefined;
  valueMap: Map<string, BaseType>;
  validationMap: Map<string, boolean>;
  jsonPath: string;
  allowLinking?: boolean;
  configGroups?: ConfigGroup[];
  linkingMap?: Map<string, LinkingInfo>;
  setLinkingMap?: Dispatch<SetStateAction<Map<string, LinkingInfo>>>;
  sensitiveMap?: Map<string, boolean>;
  setSensitiveMap?: Dispatch<SetStateAction<Map<string, boolean>>>;
  handleValueChange: (key: string, value: BaseType, valueMap?: Map<string, BaseType>) => void;
  handleValidationChange: (jsonPath: string, isValid: boolean, validationMap?: Map<string, boolean>) => void;
  disableAddButton?: boolean;
  isRequiredAtRequiredLevel: boolean;
}

export function ArrayElement({
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
  validationMap,
  handleValidationChange,
  disableAddButton,
  isRequiredAtRequiredLevel,
}: ArrayElementProps) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [chipType, setChipType] = useState<string>();
  const [localValueMap, setLocalValueMap] = useState<Map<string, BaseType>>(new Map());
  const [localValidationMap, setLocalValidationMap] = useState<Map<string, boolean>>(new Map());
  const [uniqueKeySet, setUniqueKeySet] = useState<Set<string>>(new Set());
  const [deletedIndexArray, setDeletedIndexArray] = useState<number[]>([]);
  const [isDisableSaveBtn, setIsDisableSaveBtn] = useState(true);
  const [isAddNewArrayElement, setIsAddNewArrayElement] = useState(false);
  const schemaTypeDep: string | undefined = schema?.type;
  const safeSchema: JSONSchema = schema ?? ({ type: 'object', properties: {} } as JSONSchema);

  const onAddArrayElement = () => {
    let maxIndex = Array.from(uniqueKeySet).reduce((max, key) => {
      const match = /\[(\d+)\]$/.exec(key);
      const index = match ? parseInt(match[1], 10) : -1;
      return index > max ? index : max;
    }, -1);
    const deletedMaxIndex = Math.max(...deletedIndexArray, -1);
    if (deletedMaxIndex > maxIndex) maxIndex = deletedMaxIndex;
    const newJsonPath = `${jsonPath.replace('[*]', '')}[${maxIndex + 1}]`;
    setUniqueKeySet((prev) => {
      const next = new Set(prev);
      next.add(newJsonPath);
      return next;
    });
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(true);
    setAnchorEl(event.currentTarget);
    if (!isAddNewArrayElement && uniqueKeySet.size === 0) {
      onAddArrayElement();
      setIsAddNewArrayElement(true);
    }
  };

  const resetLocalValueMap = useCallback(
    (configValueMap: Map<string, BaseType>, configValidationMap: Map<string, boolean>) => {
      if (!configValueMap || configValueMap.size === 0) {
        setLocalValueMap(new Map());
        setLocalValidationMap(new Map());
        return;
      }
      const allKeys = extractAllKeySet(configValueMap, jsonPath);
      const localConfigValueMap = new Map<string, BaseType>();
      const localConfigValidationMap = new Map<string, boolean>();
      allKeys.forEach((key) => {
        localConfigValueMap.set(key, configValueMap.get(key) ?? '');
        localConfigValidationMap.set(key, configValidationMap.get(key) || false);
      });
      setLocalValueMap(localConfigValueMap);
      setLocalValidationMap(localConfigValidationMap);
      const uniqueKeys = extractUniqueKeySet(configValueMap, jsonPath);
      if (uniqueKeys.size === 0) {
        if (!isAddNewArrayElement) {
          const initialPath = `${jsonPath.replace('[*]', '')}[0]`;
          setUniqueKeySet((prev) => {
            const next = new Set(prev);
            next.add(initialPath);
            return next;
          });
          setIsAddNewArrayElement(true);
        }
      } else {
        setUniqueKeySet(uniqueKeys);
        if (isAddNewArrayElement) setIsAddNewArrayElement(false);
      }
    },
    [jsonPath, isAddNewArrayElement],
  );

  useEffect(() => {
    let isDisable = false;
    uniqueKeySet.forEach((uniqueKey) => {
      localValidationMap.forEach((value, k) => {
        if (k.startsWith(uniqueKey) && !value) isDisable = true;
      });
    });
    setIsDisableSaveBtn(isDisable);
  }, [localValidationMap, uniqueKeySet]);

  const handleLocalValidationChange = (key: string, isValid: boolean, configValidationMap?: Map<string, boolean>) => {
    if (configValidationMap) {
      setLocalValidationMap(configValidationMap);
    } else {
      setLocalValidationMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(key, isValid);
        return newMap;
      });
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpen(false);
    setTimeout(() => resetLocalValueMap(valueMap, validationMap), 500);
  };

  const handleLocalValueChange = (key: string, value: BaseType, configMap?: Map<string, BaseType>) => {
    if (configMap) {
      setLocalValueMap(configMap);
    } else {
      setLocalValueMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(key, value ?? '');
        return newMap;
      });
    }
  };

  const handleOnValueAdd = () => {
    const newGlobalValueMap = new Map(valueMap);
    const newGlobalValidationMap = new Map(validationMap);
    const jsonPathPrefix = jsonPath.substring(0, jsonPath.length - 4);
    let rebaseIndexCounter = 0;

    for (let i = 0; i < uniqueKeySet.size + deletedIndexArray.length; i++) {
      const currentJsonPath = `${jsonPathPrefix}.[${i}]`;
      if (deletedIndexArray.includes(i)) {
        valueMap.forEach((_, k) => {
          if (k.startsWith(currentJsonPath)) {
            newGlobalValueMap.delete(k);
            newGlobalValidationMap.delete(k);
          }
        });
        rebaseIndexCounter++;
      } else {
        const newJsonPath = `${jsonPathPrefix}.[${i - rebaseIndexCounter}]`;
        localValueMap.forEach((_, k) => {
          if (k.startsWith(currentJsonPath)) {
            newGlobalValueMap.delete(k);
            newGlobalValidationMap.delete(k);
            newGlobalValueMap.set(newJsonPath + k.substring(currentJsonPath.length), localValueMap.get(k) ?? '');
            newGlobalValidationMap.set(newJsonPath + k.substring(currentJsonPath.length), localValidationMap.get(k) || false);
          }
        });
      }
    }

    // Merge: preserve all existing non-array values, update with new array values
    const mergedValueMap = new Map(valueMap);
    const mergedValidationMap = new Map(validationMap);

    valueMap.forEach((_, key) => {
      if (key.startsWith(jsonPathPrefix)) mergedValueMap.delete(key);
    });
    validationMap.forEach((_, key) => {
      if (key.startsWith(jsonPathPrefix)) mergedValidationMap.delete(key);
    });

    newGlobalValueMap.forEach((val, key) => mergedValueMap.set(key, val));
    newGlobalValidationMap.forEach((isValid, key) => mergedValidationMap.set(key, isValid));

    handleValueChange('', '', mergedValueMap);
    handleValidationChange('', false, mergedValidationMap);
    setOpen(false);
    setAnchorEl(null);
    setDeletedIndexArray([]);
  };

  const onDeleteArrayElement = (deletedJsonPath: string) => {
    const deletedIndex = parseInt(deletedJsonPath[deletedJsonPath.length - 2], 10);
    setUniqueKeySet((prev) => {
      const newSet = new Set(prev);
      newSet.delete(deletedJsonPath);
      let isDisable = false;
      newSet.forEach((uniqueKey) => {
        localValueMap.forEach((value, k) => {
          if (k.startsWith(uniqueKey) && !value) isDisable = true;
        });
      });
      setIsDisableSaveBtn(isDisable);
      return newSet;
    });
    setDeletedIndexArray((prev) => [...prev, deletedIndex]);
  };

  useEffect(() => {
    resetLocalValueMap(valueMap, validationMap);
  }, [valueMap, validationMap, resetLocalValueMap]);
  useEffect(() => {
    setChipType(setArrayType(typeDisplayName(schemaTypeDep)));
  }, [schemaTypeDep]);

  return (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" alignItems="center" gap={0.75}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Chip label={chipType} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', borderRadius: 0.75 }} />
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="text" size="small" disabled={disableAddButton} startIcon={uniqueKeySet.size === 0 || isAddNewArrayElement ? <Plus size={13} /> : <Edit2 size={13} />} onClick={handleClick} sx={{ textTransform: 'none' }}>
          {uniqueKeySet.size === 0 || isAddNewArrayElement ? 'Add' : 'Edit'}
        </Button>
      </Stack>

      <PopOverComponent
        jsonPath={jsonPath}
        open={open}
        onClose={handleClose}
        onValueAdd={handleOnValueAdd}
        addArrayElement={onAddArrayElement}
        anchorEl={anchorEl}
        schema={safeSchema}
        title={title}
        handleValueChange={handleLocalValueChange}
        valueMap={localValueMap}
        allowLinking={allowLinking}
        configGroups={configGroups}
        linkingMap={linkingMap}
        setLinkingMap={setLinkingMap}
        sensitiveMap={sensitiveMap}
        setSensitiveMap={setSensitiveMap}
        onDeleteArrayElement={onDeleteArrayElement}
        uniqueKeySet={uniqueKeySet}
        validationMap={localValidationMap}
        handleValidationChange={handleLocalValidationChange}
        isDisableSaveBtn={isDisableSaveBtn}
        isRequiredAtRequiredLevel={isRequiredAtRequiredLevel}
      />
    </Box>
  );
}
