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

import { Alert, Box, Button, Checkbox, CircularProgress, Drawer, FormControlLabel, IconButton, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@wso2/oxygen-ui';
import { X } from '@wso2/oxygen-ui-icons-react';
import { useMemo, useState, type JSX } from 'react';
import { useSetEndpointAuth } from '../../../hooks/useConsumers';
import type { EndpointRef } from '../../../types/consumers';
import { friendlyApiError } from '../../../utils/apiSecurity';

const DEFAULT_API_KEY_HEADER = 'X-API-Key';
const OAUTH_COMING_SOON = 'Securing with OAuth coming soon';
const UPSTREAM_ATTRS_COMING_SOON = 'Passing end-user attributes to upstream coming soon';

const headerCell = { color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' } as const;
const schemeDescription = { display: 'block', mt: 0.75 } as const;

/** One selectable endpoint of the environment in view. */
export interface SecurityEndpointOption {
  /** Endpoint name — the BFF's `endpointName` path segment. */
  name: string;
  displayName: string;
}

interface ApiSecurityDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Component name — the BFF's `componentName` path segment. */
  componentName: string;
  /** Environment name — the BFF's `environmentName` path segment. */
  envName: string;
  /** Endpoints of this environment; the drawer configures one at a time. */
  endpoints: SecurityEndpointOption[];
  /** Endpoint selected when the drawer opens (the env card's active endpoint). */
  activeEndpointName?: string;
}

/**
 * Cloud-only "Configure Security" drawer for one exposed endpoint API. Mirrors
 * the APIM SecurityDrawer's layout (endpoint selector + security-scheme table)
 * minus the Resources section, which has no cloud equivalent.
 *
 * Applying writes the `api-key-auth` gateway policy. OAuth is listed but not
 * selectable yet — the BFF's jwt-auth policy is not wired into this flow.
 * The gateway exposes no route to read the policies currently in force, so the
 * checkboxes start from the documented post-expose default (API Key on).
 */
export default function ApiSecurityDrawer({ open, onClose, componentName, envName, endpoints, activeEndpointName }: ApiSecurityDrawerProps): JSX.Element {
  const [userSelectedIdx, setUserSelectedIdx] = useState<number | null>(null);
  const [wasOpen, setWasOpen] = useState(false);
  const [isApiKey, setIsApiKey] = useState(true);
  const [apiKeyHeader, setApiKeyHeader] = useState(DEFAULT_API_KEY_HEADER);
  const [error, setError] = useState<string | null>(null);

  // Collapse any repeated endpoint names so the dropdown lists each API once.
  const uniqueEndpoints = useMemo(() => {
    const seen = new Set<string>();
    return endpoints.filter((ep) => {
      if (seen.has(ep.name)) return false;
      seen.add(ep.name);
      return true;
    });
  }, [endpoints]);

  // Each open resets the selection to the env card's active endpoint (reset during render).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setUserSelectedIdx(null);
      setIsApiKey(true);
      setApiKeyHeader(DEFAULT_API_KEY_HEADER);
      setError(null);
    }
  }

  const matchedIdx = useMemo(() => {
    const i = uniqueEndpoints.findIndex((ep) => ep.name === activeEndpointName);
    return i >= 0 ? i : 0;
  }, [uniqueEndpoints, activeEndpointName]);
  const selectedEndpointIdx = userSelectedIdx ?? matchedIdx;
  const selectedEndpoint = uniqueEndpoints[selectedEndpointIdx] ?? null;

  const endpointRef: EndpointRef | null = useMemo(() => (selectedEndpoint ? { componentName, environmentName: envName, endpointName: selectedEndpoint.name } : null), [componentName, envName, selectedEndpoint]);

  const authMutation = useSetEndpointAuth(endpointRef);
  const saving = authMutation.isPending;

  const handleApply = async () => {
    if (!endpointRef) return;
    setError(null);
    try {
      await authMutation.mutateAsync({ kind: 'apiKey', enabled: isApiKey, options: { key: apiKeyHeader.trim() || DEFAULT_API_KEY_HEADER, in: 'header' } });
      onClose();
    } catch (err) {
      setError(friendlyApiError(err, 'Could not save the security configuration.'));
    }
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleCancel}
      variant="temporary"
      // Sized and placed like the Build History drawer: below the top nav, full height beneath it.
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 480 }, top: { xs: '56px', sm: '64px' }, height: 'auto', bottom: 0 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Configure Security
          </Typography>
          <IconButton size="small" aria-label="close" onClick={handleCancel}>
            <X size={16} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2 }}>
          {!selectedEndpoint ? (
            <Alert severity="info">No endpoint associated with this component.</Alert>
          ) : (
            <Stack gap={2.5}>
              {error && <Alert severity="error">{error}</Alert>}

              {/* Endpoints dropdown */}
              <Stack direction="row" alignItems="center" gap={2}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Endpoints:
                </Typography>
                {uniqueEndpoints.length > 1 ? (
                  <Select size="small" value={selectedEndpointIdx} onChange={(e) => setUserSelectedIdx(Number(e.target.value))} sx={{ minWidth: 200 }}>
                    {uniqueEndpoints.map((ep, i) => (
                      <MenuItem key={ep.name} value={i}>
                        {ep.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <Box sx={{ minWidth: 200, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: 0.5, px: 1.5, py: 0.75, fontSize: 13, fontWeight: 500 }}>{selectedEndpoint.displayName}</Box>
                )}
              </Stack>

              {/* Security Scheme Table — the description sits under each header field
                  rather than in its own column, so the narrow drawer stays readable. */}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCell}>Security Scheme</TableCell>
                    <TableCell sx={headerCell}>Security Header</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <FormControlLabel control={<Checkbox checked={isApiKey} onChange={() => setIsApiKey((v) => !v)} size="small" />} label="API Key" />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" value={apiKeyHeader} onChange={(e) => setApiKeyHeader(e.target.value)} disabled={!isApiKey} fullWidth />
                      <Typography variant="caption" color="text.secondary" sx={schemeDescription}>
                        Secure your API with API Key protocol.
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Tooltip title={OAUTH_COMING_SOON}>
                        {/* A disabled control swallows pointer events, so the span carries the tooltip. */}
                        <Box component="span" sx={{ display: 'inline-flex' }}>
                          <FormControlLabel control={<Checkbox checked={false} size="small" disabled />} label="OAuth" disabled />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <TextField size="small" value="Authorization" disabled fullWidth />
                      <Typography variant="caption" color="text.secondary" sx={schemeDescription}>
                        Secure your API with OAuth 2 protocol.
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Tooltip title={UPSTREAM_ATTRS_COMING_SOON}>
                <Box component="span" sx={{ alignSelf: 'flex-start' }}>
                  <FormControlLabel control={<Checkbox checked={false} size="small" disabled />} label="Pass end-user attributes to upstream" disabled />
                </Box>
              </Tooltip>
            </Stack>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleApply()} disabled={saving || !selectedEndpoint}>
            {saving ? <CircularProgress size={16} color="inherit" /> : 'Apply'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
