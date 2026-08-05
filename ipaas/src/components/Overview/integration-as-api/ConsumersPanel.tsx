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

import { Alert, Avatar, Box, Button, Chip, CircularProgress, Stack, Typography } from '@wso2/oxygen-ui';
import { Plus, ShieldCheck, Users } from '@wso2/oxygen-ui-icons-react';
import { useMemo, useState, type JSX } from 'react';
import { useConsumers } from '../../../hooks/useConsumers';
import type { Consumer, EndpointOption, EndpointRef } from '../../../types/consumers';
import { consumerDisplayName, consumerSummary } from '../../../utils/apiConsumption';
import { friendlyApiError } from '../../../utils/apiSecurity';
import ApiSecurityDrawer from './ApiSecurityDrawer';
import ConsumerDrawer from './ConsumerDrawer';
import * as styles from './apiConsumption.styles';

/** `'new'` opens the create form; a `Consumer` opens it in manage mode. */
type DialogTarget = Consumer | 'new' | null;

interface ConsumersPanelProps {
  /** Component name — the BFF's `componentName` path segment. */
  componentName: string;
  /** Project handle the consumer applications belong to. */
  projectName: string;
  /** Environment name used by the API (e.g. `development`). */
  envName: string;
  /** Display label. */
  envLabel: string;
  /** Endpoint name — the BFF's `endpointName` path segment. */
  endpointName: string;
  /** All endpoints of this environment, for the security drawer's selector. */
  endpoints: EndpointOption[];
}

/**
 * Cloud-only "Consumers" subcard rendered inside the API env card. Lists the
 * applications subscribed to this endpoint's exposed API, lets a user create and
 * manage subscriptions, and opens the security drawer for the API's gateway
 * security configuration.
 */
export default function ConsumersPanel({ componentName, projectName, envName, envLabel, endpointName, endpoints }: ConsumersPanelProps): JSX.Element {
  const endpointRef: EndpointRef = useMemo(() => ({ componentName, environmentName: envName, endpointName }), [componentName, envName, endpointName]);

  const { data: consumers = [], isLoading, error } = useConsumers(projectName, endpointRef);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [dialogTarget, setDialogTarget] = useState<DialogTarget>(null);

  const count = consumers.length;

  return (
    <Box sx={styles.subCard}>
      <Box sx={styles.subCardHeader}>
        <Typography variant="body2" sx={styles.subCardTitle}>
          <Users size={16} />
          Consumers
          <Typography component="span" variant="caption" color="text.secondary">
            ({count})
          </Typography>
        </Typography>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Button variant="text" size="small" startIcon={<ShieldCheck size={14} />} onClick={() => setSecurityOpen(true)} sx={styles.textAction}>
            Configure Security
          </Button>
          <Button variant="contained" size="small" startIcon={count > 0 ? <Plus size={14} /> : undefined} onClick={() => setDialogTarget('new')}>
            {count > 0 ? 'New Consumer' : 'Consume API'}
          </Button>
        </Stack>
      </Box>

      {isLoading ? (
        <Box sx={styles.loadingRow}>
          <CircularProgress size={20} />
        </Box>
      ) : error ? (
        <Alert severity="warning" sx={styles.panelAlert}>
          {friendlyApiError(error, 'Could not load consumer applications.')}
        </Alert>
      ) : count > 0 ? (
        <Stack gap={1} sx={styles.consumerList}>
          {consumers.map((c) => (
            <Box key={c.subscription.id} sx={styles.consumerRow}>
              <Avatar sx={styles.consumerAvatar}>{(consumerDisplayName(c)[0] ?? 'A').toUpperCase()}</Avatar>
              <Box sx={styles.consumerRowText}>
                <Stack direction="row" alignItems="center" gap={0.75} sx={styles.consumerNameRow}>
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {consumerDisplayName(c)}
                  </Typography>
                  <Chip label={c.subscription.status || 'ACTIVE'} size="small" color="success" variant="outlined" sx={styles.consumerStatusChip} />
                </Stack>
                <Typography variant="caption" color="text.secondary" noWrap sx={styles.consumerRowSubtitle}>
                  {consumerSummary(c)}
                </Typography>
              </Box>
              <Button variant="outlined" size="small" onClick={() => setDialogTarget(c)}>
                Manage
              </Button>
            </Box>
          ))}
        </Stack>
      ) : (
        <Box sx={styles.emptyState}>
          <Typography variant="caption" color="text.secondary">
            No consumer applications yet. Create your first consumer application to start calling this API.
          </Typography>
        </Box>
      )}

      <ApiSecurityDrawer open={securityOpen} onClose={() => setSecurityOpen(false)} componentName={componentName} envName={envName} endpoints={endpoints} activeEndpointName={endpointName} />
      <ConsumerDrawer open={dialogTarget !== null} onClose={() => setDialogTarget(null)} projectName={projectName} endpointRef={endpointRef} envLabel={envLabel} consumer={dialogTarget === 'new' ? null : dialogTarget} />
    </Box>
  );
}
