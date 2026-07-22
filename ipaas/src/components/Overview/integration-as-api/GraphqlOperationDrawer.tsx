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

import { Box, Stack, Typography } from '@wso2/oxygen-ui';
import { useState, type ReactNode } from 'react';
import type { GraphQLInputType, GraphQLSchema } from 'graphql';
import OperationHeader from '../_shared/bodies/OperationHeader';
import type { OperationTileColors } from '../_shared/bodies/OperationTile';
import { extractAttributes, extractInputTypeAttributes, type GraphqlAttrTree, type GraphqlField } from '../../../utils/graphqlSchema';

const NO_DESCRIPTION = 'No description available.';

const keyLabelSx = { fontFamily: 'monospace', fontWeight: 600 } as const;
const typeLabelSx = { fontFamily: 'monospace', color: 'primary.main' } as const;

/** Recursively render an attribute tree (a leaf carries its type name under `value`). */
function AttributeTree({ tree, nested = false }: { tree: GraphqlAttrTree; nested?: boolean }): ReactNode {
  return (
    <Stack gap={0.5} sx={{ pl: nested ? 1.5 : 0, borderLeft: nested ? '1px solid' : 'none', borderColor: 'divider' }}>
      {Array.from(tree.entries()).map(([key, value]) => {
        if (typeof value === 'string') {
          return (
            <Stack key={key} direction="row" gap={0.5} alignItems="baseline">
              <Typography variant="body2" sx={keyLabelSx}>
                {key}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                :
              </Typography>
              <Typography variant="body2" sx={typeLabelSx}>
                {value}
              </Typography>
            </Stack>
          );
        }
        const leaf = value.get('value');
        const hasChildren = Array.from(value.keys()).some((k) => k !== 'value');
        return (
          <Box key={key}>
            <Stack direction="row" gap={0.5} alignItems="baseline">
              <Typography variant="body2" sx={keyLabelSx}>
                {key}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                :
              </Typography>
              <Typography variant="body2" sx={typeLabelSx}>
                {typeof leaf === 'string' ? leaf : 'Object'}
              </Typography>
            </Stack>
            {hasChildren && <AttributeTree tree={value} nested />}
          </Box>
        );
      })}
    </Stack>
  );
}

/** Drawer body for one GraphQL field: header, description, parameters (with input-type drill-down), and response attributes. */
export default function GraphqlOperationDrawer({ operationName, field, colors, schema }: { operationName: string; field: GraphqlField; colors: OperationTileColors; schema: GraphQLSchema }): ReactNode {
  const [expandedParam, setExpandedParam] = useState<string | null>(null);
  const [paramTrees, setParamTrees] = useState<Map<string, GraphqlAttrTree>>(() => new Map());

  const handleParamClick = (name: string, type: string) => {
    const key = `${name}-${type}`;
    if (expandedParam === key) {
      setExpandedParam(null);
      return;
    }
    const namedType = schema.getType(type.replace(/[![\]]/g, ''));
    if (namedType) {
      setParamTrees((prev) => new Map(prev).set(key, extractInputTypeAttributes(namedType as unknown as GraphQLInputType)));
      setExpandedParam(key);
    }
  };

  const description = field.description && field.description !== NO_DESCRIPTION ? field.description : undefined;

  return (
    <Stack gap={2.5}>
      <OperationHeader badgeLabel={operationName} label={field.name} colors={colors} description={description} />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Parameters
        </Typography>
        {field.params.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No parameters available.
          </Typography>
        ) : (
          <Stack gap={1}>
            {field.params.map((param) => {
              const key = `${param.name}-${param.type}`;
              const isExpanded = expandedParam === key;
              const tree = paramTrees.get(key);
              return (
                <Box key={param.name} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                  <Stack
                    direction="row"
                    gap={0.5}
                    alignItems="baseline"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleParamClick(param.name, param.type)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleParamClick(param.name, param.type);
                      }
                    }}
                    sx={{ cursor: 'pointer' }}>
                    <Typography variant="body2" sx={keyLabelSx}>
                      {param.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      :
                    </Typography>
                    <Typography variant="body2" sx={typeLabelSx}>
                      {param.type}
                    </Typography>
                  </Stack>
                  {isExpanded && tree && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Include the following parameters
                      </Typography>
                      <AttributeTree tree={tree} nested />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Response Attributes
        </Typography>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
          <AttributeTree tree={extractAttributes(field.responseType)} />
        </Box>
      </Box>
    </Stack>
  );
}
