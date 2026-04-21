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

import { Box, Button, Drawer, IconButton, Stack, Typography } from '@wso2/oxygen-ui';
import { X } from '@wso2/oxygen-ui-icons-react';
import { useMemo, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import './swagger-ui-overrides.scss';

interface OperationColors {
  cardBg: string;
  border: string;
  badgeBg: string;
}

const METHOD_COLORS: Record<string, OperationColors> = {
  GET: { cardBg: '#F4FAFF', border: '#C1E4FC', badgeBg: '#0095FF' },
  POST: { cardBg: '#F5FFF7', border: '#CDF1DF', badgeBg: '#36B475' },
  PUT: { cardBg: '#FFFBF6', border: '#FEE6C8', badgeBg: '#FF9D52' },
  DELETE: { cardBg: 'rgba(252,237,237,0.5)', border: 'rgba(248,194,194,0.69)', badgeBg: '#FE523C' },
  OPTIONS: { cardBg: 'rgba(5,102,200,0.07)', border: 'rgba(5,102,200,0.2)', badgeBg: '#0566C8' },
  PATCH: { cardBg: 'rgba(1,206,181,0.08)', border: 'rgba(1,206,181,0.28)', badgeBg: '#01CEB5' },
  HEAD: { cardBg: 'rgba(123,85,213,0.08)', border: 'rgba(123,85,213,0.18)', badgeBg: '#7B55D5' },
  TRACE: { cardBg: '#f5f5f5', border: '#d0d0d0', badgeBg: '#785446' },
};
const DEFAULT_COLORS: OperationColors = { cardBg: '#f5f5f5', border: '#e0e0e0', badgeBg: '#9e9e9e' };

const VALID_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];

// Hide most SwaggerUI chrome — keep only parameters, request body, responses
const HidePlugin = () => ({
  components: {
    TryItOutButton: () => null,
    AuthorizeBtn: () => null,
    AuthorizeBtnContainer: () => null,
    AuthorizeOperationBtn: () => null,
    Models: () => null,
    ModelWrapper: () => null,
    InfoContainer: () => null,
    Info: () => null,
    Servers: () => null,
    ServersContainer: () => null,
    SchemesContainer: () => null,
    Execute: () => null,
    OperationSummary: () => null,
    OperationSummaryMethod: () => null,
    OperationSummaryPath: () => null,
  },
});

interface SwaggerDocument {
  paths?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
}

interface Operation {
  method: string;
  path: string;
}

interface OperationDetailsProps {
  method: string;
  path: string;
  swagger: SwaggerDocument;
  onClose: () => void;
}

function OperationDetails({ method, path, swagger, onClose }: OperationDetailsProps) {
  const colors = METHOD_COLORS[method] ?? DEFAULT_COLORS;

  const filteredSpec = useMemo(() => {
    const pathItem = swagger.paths?.[path];
    if (!pathItem) return null;
    const op = pathItem[method.toLowerCase()];
    if (!op) return null;
    const pathEntry: Record<string, unknown> = { [method.toLowerCase()]: op };
    if (pathItem.parameters) pathEntry.parameters = pathItem.parameters;
    return { ...swagger, paths: { [path]: pathEntry } };
  }, [swagger, method, path]);

  return (
    <Box sx={{ width: 720, maxWidth: '100vw', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Drawer header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="h5">Details</Typography>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <X size={18} />
        </IconButton>
      </Stack>

      {/* Scrollable body */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
        {/* Operation card */}
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ border: `0.5px solid ${colors.badgeBg}`, borderRadius: 0.5, px: 1.5, py: 1, mb: 1 }}>
          <Box
            sx={{
              bgcolor: colors.badgeBg,
              color: '#fff',
              fontWeight: 700,
              fontSize: '11px',
              minWidth: 64,
              px: 1,
              py: 0.5,
              borderRadius: 0.5,
              textAlign: 'center',
            }}>
            {method}
          </Box>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500, wordBreak: 'break-word', color: 'text.primary' }}>
            {path}
          </Typography>
        </Stack>

        {filteredSpec ? (
          <SwaggerUI spec={filteredSpec} plugins={[HidePlugin]} docExpansion="full" />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No operation details available.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

interface SwaggerOperationsListProps {
  swagger: SwaggerDocument;
}

export default function SwaggerOperationsList({ swagger }: SwaggerOperationsListProps) {
  const [selected, setSelected] = useState<Operation | null>(null);

  const operations = useMemo<Operation[]>(() => {
    if (!swagger?.paths) return [];
    const ops: Operation[] = [];
    Object.entries(swagger.paths).forEach(([path, methods]) => {
      if (methods && typeof methods === 'object') {
        Object.keys(methods).forEach((method) => {
          if (VALID_METHODS.includes(method.toLowerCase())) {
            ops.push({ method: method.toUpperCase(), path });
          }
        });
      }
    });
    return ops.sort((a, b) => (a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path)));
  }, [swagger]);

  if (operations.length === 0) return null;

  return (
    <>
      <Box sx={{ mt: 1.5 }}>
        {operations.map((op) => {
          const colors = METHOD_COLORS[op.method] ?? DEFAULT_COLORS;
          return (
            <Box
              key={`${op.method}-${op.path}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1,
                py: 0.75,
                mb: 0.75,
                border: `0.5px solid ${colors.badgeBg}`,
                borderRadius: 0.5,
                '&:last-child': { mb: 0 },
              }}>
              {/* Method badge */}
              <Box
                sx={{
                  bgcolor: colors.badgeBg,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '11px',
                  minWidth: 72,
                  px: 1,
                  py: 0.5,
                  borderRadius: 0.5,
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                {op.method}
              </Box>

              {/* Path */}
              <Typography sx={{ flex: 1, fontSize: '13px', fontWeight: 500, wordBreak: 'break-word', color: 'text.primary' }}>{op.path}</Typography>

              {/* View Details */}
              <Button variant="text" size="small" onClick={() => setSelected(op)} sx={{ fontSize: '12px', flexShrink: 0, textTransform: 'none' }}>
                View Details
              </Button>
            </Box>
          );
        })}
      </Box>

      <Drawer
        anchor="right"
        open={!!selected}
        onClose={() => setSelected(null)}
        variant="temporary"
        sx={{ '& .MuiDrawer-paper': { width: 720, position: 'fixed', top: 64, height: 'calc(100% - 64px)', borderLeft: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' } }}>
        {selected && <OperationDetails method={selected.method} path={selected.path} swagger={swagger} onClose={() => setSelected(null)} />}
      </Drawer>
    </>
  );
}
