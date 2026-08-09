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

import { Alert, Box, Button, Checkbox, CircularProgress, Drawer, FormControlLabel, IconButton, MenuItem, Radio, RadioGroup, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@wso2/oxygen-ui';
import { X } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { API_KEY_SCHEME_DESCRIPTION, COMING_SOON_OAUTH, COMING_SOON_UPSTREAM_ATTRS, DEFAULT_API_KEY_HEADER, OAUTH_HEADER, OAUTH_SCHEME_DESCRIPTION } from '../../../constants/apiConsumption';
import { useEndpointSecurity, useSetEndpointSecurity } from '../../../hooks/useConsumers';
import type { EndpointOption, EndpointRef, SecurityConfig, SecurityMode } from '../../../types/consumers';
import { friendlyApiError } from '../../../utils/apiSecurity';
import * as styles from './apiConsumption.styles';

interface ApiSecurityDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Component name — the BFF's `componentName` path segment. */
  componentName: string;
  /** Environment name — the BFF's `environmentName` path segment. */
  envName: string;
  /** Endpoints of this environment; the drawer configures one at a time. */
  endpoints: EndpointOption[];
  /** Endpoint selected when the drawer opens (the env card's active endpoint). */
  activeEndpointName?: string;
}

/**
 * Cloud-only "Configure Security" drawer for one exposed endpoint API. Mirrors
 * the APIM SecurityDrawer's layout (endpoint selector + security-scheme table)
 * minus the Resources section, which has no cloud equivalent.
 */
export default function ApiSecurityDrawer({ open, onClose, componentName, envName, endpoints, activeEndpointName }: ApiSecurityDrawerProps): JSX.Element {
  const [userSelectedIdx, setUserSelectedIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<SecurityMode>('none');
  const [apiKeyHeader, setApiKeyHeader] = useState(DEFAULT_API_KEY_HEADER);
  const [error, setError] = useState<string | null>(null);

  // Drop the endpoint override when the drawer closes, so reopening derives the endpoint from
  // activeEndpointName instead of a stale prior selection.
  useEffect(() => {
    if (!open) setUserSelectedIdx(null);
  }, [open]);

  const matchedIdx = useMemo(() => {
    const i = endpoints.findIndex((ep) => ep.name === activeEndpointName);
    return i >= 0 ? i : 0;
  }, [endpoints, activeEndpointName]);
  const selectedEndpointIdx = userSelectedIdx ?? matchedIdx;
  const selectedEndpoint = endpoints[selectedEndpointIdx] ?? null;

  const endpointRef: EndpointRef | null = useMemo(() => (selectedEndpoint ? { componentName, environmentName: envName, endpointName: selectedEndpoint.name } : null), [componentName, envName, selectedEndpoint]);

  const { data: security, isLoading: loadingSecurity, error: securityError } = useEndpointSecurity(endpointRef, open);
  const setSecurityMutation = useSetEndpointSecurity(endpointRef);
  const saving = setSecurityMutation.isPending;

  // Seed the local selection from the fetched state once per (endpoint, open) — later user edits
  // stick even if the query re-settles.
  const syncKey = JSON.stringify({ componentName, environmentName: envName, endpointName: selectedEndpoint?.name ?? '', open });
  const syncedRef = useRef('');
  useEffect(() => {
    if (!open) {
      syncedRef.current = '';
      return;
    }
    if (security && syncedRef.current !== syncKey) {
      syncedRef.current = syncKey;
      setMode(security.mode);
      setApiKeyHeader(security.apiKey?.header || DEFAULT_API_KEY_HEADER);
      setError(null);
    }
  }, [open, security, syncKey]);

  const isApiKey = mode === 'api-key';
  const isOAuth = mode === 'jwt';

  // The schemes are mutually exclusive at the gateway, so they are radios: picking
  // one is what turns the other off. Clicking the selected radio again clears it
  // back to `none`, which is the only way to open the API from here.
  const selectScheme = (scheme: Exclude<SecurityMode, 'none'>) => setMode((m) => (m === scheme ? 'none' : scheme));

  const handleApply = async () => {
    if (!endpointRef) return;
    setError(null);
    const cfg: SecurityConfig = mode === 'api-key' ? { mode, apiKey: { header: apiKeyHeader.trim() || DEFAULT_API_KEY_HEADER } } : mode === 'jwt' ? { mode, jwt: {} } : { mode: 'none' };
    try {
      await setSecurityMutation.mutateAsync(cfg);
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
    <Drawer anchor="right" open={open} onClose={handleCancel} variant="temporary" sx={styles.rightDrawer}>
      <Box sx={styles.drawerFrame}>
        <Box sx={styles.drawerHeader}>
          <Typography variant="subtitle1" fontWeight={600}>
            Configure Security
          </Typography>
          <IconButton size="small" aria-label="close" onClick={handleCancel}>
            <X size={16} />
          </IconButton>
        </Box>

        <Box sx={styles.drawerBody}>
          {!selectedEndpoint ? (
            <Alert severity="info">No endpoint associated with this component.</Alert>
          ) : (
            <Stack gap={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              {securityError && !error && <Alert severity="warning">{friendlyApiError(securityError, 'Could not read the current security configuration.')}</Alert>}

              <Stack direction="row" alignItems="center" gap={2}>
                <Typography variant="body2" fontWeight={500}>
                  Endpoints:
                </Typography>
                {/* A lone endpoint is still shown as a dropdown, disabled — matching
                    the env card's endpoint picker, so the two read as one control. */}
                <Select size="small" value={selectedEndpointIdx} onChange={(e) => setUserSelectedIdx(Number(e.target.value))} disabled={endpoints.length <= 1} sx={styles.endpointSelect}>
                  {endpoints.map((ep, i) => (
                    <MenuItem key={ep.name} value={i}>
                      {ep.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              {loadingSecurity ? (
                <Box sx={styles.loadingRow}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                <RadioGroup value={mode} name="security-scheme">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={styles.tableHeadCell}>Security Scheme</TableCell>
                        <TableCell sx={styles.tableHeadCell}>Security Header</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={styles.schemeCell}>
                          <FormControlLabel value="api-key" control={<Radio checked={isApiKey} onClick={() => selectScheme('api-key')} size="small" />} label="API Key" />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={apiKeyHeader} onChange={(e) => setApiKeyHeader(e.target.value)} disabled={!isApiKey} fullWidth />
                          <Typography variant="caption" color="text.secondary" sx={styles.schemeDescription}>
                            {API_KEY_SCHEME_DESCRIPTION}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      {/* OAuth is off until jwt-auth is wired end to end; the row stays
                          visible so the choice is discoverable, but is not selectable. */}
                      <TableRow>
                        <TableCell sx={styles.schemeCell}>
                          <Tooltip title={COMING_SOON_OAUTH}>
                            <Box component="span" sx={styles.disabledTooltipTarget}>
                              <FormControlLabel value="jwt" control={<Radio checked={isOAuth} size="small" disabled />} label="OAuth" disabled />
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={OAUTH_HEADER} disabled fullWidth />
                          <Typography variant="caption" color="text.secondary" sx={styles.schemeDescription}>
                            {OAUTH_SCHEME_DESCRIPTION}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </RadioGroup>
              )}

              <Tooltip title={COMING_SOON_UPSTREAM_ATTRS}>
                <Box component="span" sx={styles.disabledTooltipTarget}>
                  <FormControlLabel control={<Checkbox checked={false} size="small" disabled />} label="Pass end-user attributes to upstream" disabled />
                </Box>
              </Tooltip>
            </Stack>
          )}
        </Box>

        <Box sx={styles.drawerFooter}>
          <Button variant="outlined" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleApply()} disabled={saving || !selectedEndpoint || loadingSecurity || Boolean(securityError)}>
            {saving ? <CircularProgress size={16} color="inherit" /> : 'Apply'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
