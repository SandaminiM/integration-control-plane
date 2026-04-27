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
import { type BaseType, type JSONSchema, type LinkingInfo, generateArrayJsonPath, generateMapJsonPath, isBaseType } from '../schemaUtils';
import { AnyOfElement } from './AnyOfElement';
import { ArrayElement } from './ArrayElement';
import { BaseElement } from './BaseElement';
import MapElement from './MapElement';
import { ObjectElement } from './ObjectElement';

interface ConfigGroup {
  groupUuid: string;
  groupName: string;
  groupDisplayName?: string;
  configurations: { keyUuid: string; key: string; isSensitive?: boolean }[];
}

export interface ConfigElementProps {
  schema: JSONSchema;
  type: string;
  title: string;
  jsonPath: string;
  propertyKey: string;
  valueMap: Map<string, BaseType>;
  allowLinking?: boolean;
  configGroups?: ConfigGroup[];
  linkingMap?: Map<string, LinkingInfo>;
  setLinkingMap?: Dispatch<SetStateAction<Map<string, LinkingInfo>>>;
  sensitiveMap?: Map<string, boolean>;
  setSensitiveMap?: Dispatch<SetStateAction<Map<string, boolean>>>;
  handleValueChange: (key: string, value: BaseType, valueMap?: Map<string, BaseType>) => void;
  isRequired?: boolean;
  isRequiredAtRequiredLevel: boolean;
  validationMap: Map<string, boolean>;
  handleValidationChange: (jsonPath: string, isValid: boolean, validationMap?: Map<string, boolean>) => void;
}

export function ConfigElement({
  schema,
  type,
  title,
  jsonPath,
  propertyKey,
  valueMap,
  allowLinking,
  configGroups,
  linkingMap,
  setLinkingMap,
  sensitiveMap,
  setSensitiveMap,
  handleValueChange,
  isRequired,
  validationMap,
  handleValidationChange,
  isRequiredAtRequiredLevel,
}: ConfigElementProps) {
  if (type === 'object' && schema.properties?.[propertyKey]?.additionalProperties) {
    return (
      <MapElement
        title={title}
        jsonPath={generateMapJsonPath(jsonPath)}
        valueMap={valueMap}
        handleValueChange={handleValueChange}
        handleValidationChange={handleValidationChange}
        validationMap={validationMap}
        isRequired={isRequired}
        schema={schema.properties[propertyKey]}
        isRequiredAtRequiredLevel={isRequiredAtRequiredLevel}
        allowLinking={allowLinking}
        configGroups={configGroups}
        linkingMap={linkingMap}
        setLinkingMap={setLinkingMap}
        sensitiveMap={sensitiveMap}
        setSensitiveMap={setSensitiveMap}
      />
    );
  }

  if (type === 'object') {
    return (
      <ObjectElement
        title={title}
        type={type}
        schema={(schema.properties && schema.properties[propertyKey]) || { type: 'object', properties: {} }}
        valueMap={valueMap}
        handleValueChange={handleValueChange}
        jsonPath={jsonPath}
        isRequired={isRequired}
        handleValidationChange={handleValidationChange}
        validationMap={validationMap}
        isRequiredAtRequiredLevel={isRequiredAtRequiredLevel}
        allowLinking={allowLinking}
        configGroups={configGroups}
        linkingMap={linkingMap}
        setLinkingMap={setLinkingMap}
        sensitiveMap={sensitiveMap}
        setSensitiveMap={setSensitiveMap}
      />
    );
  }

  if (isBaseType(type) || schema.properties?.[propertyKey]?.enum) {
    return (
      <BaseElement
        key={jsonPath}
        title={title}
        type={type}
        jsonPath={jsonPath}
        valueMap={valueMap}
        handleValueChange={handleValueChange}
        isRequired={isRequired}
        handleValidationChange={handleValidationChange}
        validationMap={validationMap}
        isRequiredAtRequiredLevel={isRequiredAtRequiredLevel}
        schema={schema.properties && schema.properties[propertyKey]}
        allowLinking={allowLinking}
        configGroups={configGroups}
        linkingMap={linkingMap}
        setLinkingMap={setLinkingMap}
        sensitiveMap={sensitiveMap}
        setSensitiveMap={setSensitiveMap}
      />
    );
  }

  if (type === 'array') {
    return (
      <ArrayElement
        title={title}
        type={type}
        schema={schema.properties && schema.properties[propertyKey]?.items}
        jsonPath={generateArrayJsonPath(jsonPath)}
        valueMap={valueMap}
        handleValueChange={handleValueChange}
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
    );
  }

  if (type === 'anyOf' && schema.properties?.[propertyKey]?.anyOf) {
    return (
      <AnyOfElement
        title={title}
        schema={schema.properties[propertyKey]}
        jsonPath={jsonPath}
        valueMap={valueMap}
        handleValueChange={handleValueChange}
        validationMap={validationMap}
        handleValidationChange={handleValidationChange}
        isRequired={isRequired}
        isRequiredAtRequiredLevel={isRequiredAtRequiredLevel}
        allowLinking={allowLinking}
        configGroups={configGroups}
        linkingMap={linkingMap}
        setLinkingMap={setLinkingMap}
        sensitiveMap={sensitiveMap}
        setSensitiveMap={setSensitiveMap}
      />
    );
  }

  return null;
}
