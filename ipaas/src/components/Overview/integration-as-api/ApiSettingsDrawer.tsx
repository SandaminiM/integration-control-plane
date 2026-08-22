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

import { Alert, Box, Button, CircularProgress, Divider, Drawer, IconButton, MenuItem, Select, Stack, TextField, Tooltip, Typography } from '@wso2/oxygen-ui';
import { X } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { useEndpointPolicies, useSetEndpointPolicies } from '../../../hooks/useConsumers';
import type { EndpointOption, EndpointRef } from '../../../types/consumers';
import type { CorsConfig, RateLimitConfig } from '../../../types/policy';
import { configToPolicy, policyToConfig, toRateLimitOperations } from '../../../utils/endpointPolicy';
import { isRateLimitValid } from '../../../utils/policy';
import { friendlyApiError } from '../../../utils/apiSecurity';
import { httpStatusOf } from '../../../utils/apiErrors';
import CorsSection from '../../Policies/CorsSection';
import RateLimitingSection from '../../Policies/RateLimitingSection';
import * as styles from './apiConsumption.styles';

/**
 * The gateway does support a request timeout, but platform-api does not expose it, so the BFF has
 * no way to set one. The field is shown disabled rather than hidden: it is a setting people expect
 * to find here, and silently omitting it reads as "this platform has no timeout" instead of
 * "not settable from here yet".
 */
const DEFAULT_TIMEOUT_MS = '60000';
const TIMEOUT_UNAVAILABLE = 'Endpoint timeout is not configurable from here yet';

interface ApiSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Component name — the BFF's `componentName` path segment. */
  componentName: string;
  /** Environment name (the RFC 1123 slug) — the BFF's `environmentName` path segment. */
  envName: string;
  /** Endpoints of this environment; the drawer configures one at a time. */
  endpoints: EndpointOption[];
  /** Endpoint selected when the drawer opens. */
  activeEndpointName?: string;
}

/**
 * Cloud-only "API Settings" drawer for one exposed endpoint API: CORS and rate limiting, enforced
 * as gateway policies. Authentication is configured separately in ApiSecurityDrawer — the BFF
 * writes the two independently so neither can clear the other.
 */
export default function ApiSettingsDrawer({ open, onClose, componentName, envName, endpoints, activeEndpointName }: ApiSettingsDrawerProps): JSX.Element {
  const [userSelectedIdx, setUserSelectedIdx] = useState<number | null>(null);
  const [cors, setCors] = useState<CorsConfig | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Drop the endpoint override when the drawer closes, so reopening derives it from
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

  const endpointRef: EndpointRef | null = useMemo(
    () => (selectedEndpoint ? { componentName, environmentName: envName, endpointName: selectedEndpoint.name } : null),
    [componentName, envName, selectedEndpoint],
  );

  const { data: policies, isLoading, error: loadError } = useEndpointPolicies(endpointRef, open);
  const setPolicies = useSetEndpointPolicies(endpointRef);
  const saving = setPolicies.isPending;

  // The routes a per-operation limit can attach to come from the exposed API itself, not from the
  // endpoint's OpenAPI schema — an endpoint exposed without one has only the catch-all methods.
  const operations = useMemo(() => toRateLimitOperations(policies?.operations), [policies?.operations]);

  // Seed the form from the fetched state once per (endpoint, open) — later edits stick even if
  // the query re-settles.
  const syncKey = JSON.stringify({ componentName, envName, endpointName: selectedEndpoint?.name ?? '', open });
  const syncedRef = useRef('');
  useEffect(() => {
    if (!open) {
      syncedRef.current = '';
      return;
    }
    if (policies && syncedRef.current !== syncKey) {
      syncedRef.current = syncKey;
      const seeded = policyToConfig(policies);
      setCors(seeded.cors);
      setRateLimit(seeded.rateLimit);
      setError(null);
    }
  }, [open, policies, syncKey]);

  // 409 and 503 are states, not failures: the endpoint is not exposed yet, or the platform is not
  // configured here. Both need copy that says what to do rather than a generic warning.
  const loadStatus = loadError ? httpStatusOf(loadError) : undefined;
  const notice =
    loadStatus === 409
      ? 'This endpoint isn’t exposed as an API yet. Set its visibility to Public and deploy, then come back to configure API settings.'
      : loadStatus === 503
        ? 'API settings aren’t available in this environment.'
        : loadError
          ? friendlyApiError(loadError, 'Could not read the current API settings.')
          : null;

  const valid = !rateLimit || isRateLimitValid(rateLimit);
  const canApply = !!endpointRef && !!cors && !!rateLimit && !loadError && !isLoading && !saving && valid;

  const handleApply = async () => {
    if (!endpointRef || !cors || !rateLimit || !canApply) return;
    setError(null);
    try {
      await setPolicies.mutateAsync(configToPolicy(cors, rateLimit));
      onClose();
    } catch (err) {
      setError(friendlyApiError(err, 'Could not save the API settings.'));
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
            API Settings
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
              {notice && !error && <Alert severity={loadStatus === 409 ? 'info' : 'warning'}>{notice}</Alert>}

              <Stack direction="row" alignItems="center" gap={2}>
                <Typography variant="body2" fontWeight={500}>
                  Endpoints:
                </Typography>
                <Select size="small" value={selectedEndpointIdx} onChange={(e) => setUserSelectedIdx(Number(e.target.value))} disabled={endpoints.length <= 1} sx={styles.endpointSelect}>
                  {endpoints.map((ep, i) => (
                    <MenuItem key={ep.name} value={i}>
                      {ep.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              {isLoading ? (
                <Box sx={styles.centredRow}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                cors &&
                rateLimit && (
                  <>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                        CORS
                      </Typography>
                      <CorsSection value={cors} onChange={setCors} disabled={saving} />
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                        Rate Limiting
                      </Typography>
                      <RateLimitingSection
                        value={rateLimit}
                        onChange={setRateLimit}
                        disabled={saving}
                        description="Limit how many requests the gateway accepts for this endpoint."
                        apiLevelLabel="Whole endpoint"
                        operations={operations}
                      />
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                        Resiliency
                      </Typography>
                      <Tooltip title={TIMEOUT_UNAVAILABLE}>
                        <Box component="span" sx={styles.disabledTooltipTarget}>
                          <TextField size="small" type="number" label="Endpoint timeout (ms)" value={DEFAULT_TIMEOUT_MS} disabled sx={{ width: 220 }} helperText={TIMEOUT_UNAVAILABLE} />
                        </Box>
                      </Tooltip>
                    </Box>
                  </>
                )
              )}
            </Stack>
          )}
        </Box>

        <Box sx={styles.drawerFooter}>
          <Button variant="outlined" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleApply()} disabled={!canApply}>
            {saving ? <CircularProgress size={16} color="inherit" /> : 'Apply'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
