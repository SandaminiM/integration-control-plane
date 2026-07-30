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
import type { Consumer, EndpointRef } from '../../../types/consumers';
import { friendlyApiError } from '../../../utils/apiSecurity';
import ApiSecurityDrawer, { type SecurityEndpointOption } from './ApiSecurityDrawer';
import CredentialsDialog from './CredentialsDialog';
import * as styles from './apiConsumption.styles';

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
  endpoints: SecurityEndpointOption[];
  /** Base invoke URL used to build the test call snippet. */
  endpointUrl?: string;
}

const consumerName = (c: Consumer): string => c.application.displayName || c.application.id;

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
};

/**
 * Cloud-only "Consumers" subcard rendered inside the API env card. Lists the
 * applications subscribed to this endpoint's exposed API, lets a user create
 * and manage subscriptions, and opens the API security drawer (exposure,
 * enforcement policies, API keys).
 */
export default function ConsumersPanel({ componentName, projectName, envName, envLabel, endpointName, endpoints, endpointUrl }: ConsumersPanelProps): JSX.Element {
  const endpointRef: EndpointRef = useMemo(() => ({ componentName, environmentName: envName, endpointName }), [componentName, envName, endpointName]);

  const { data: consumers = [], isLoading, error } = useConsumers(projectName, endpointRef);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; consumer: Consumer | null }>({ open: false, consumer: null });

  const count = consumers.length;

  const consumerSub = (c: Consumer): string => {
    const created = formatDate(c.subscription.createdAt);
    return ['Subscription-Key', c.subscription.status, created && `subscribed ${created}`].filter(Boolean).join(' · ');
  };

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
          <Button variant="text" size="small" startIcon={<ShieldCheck size={14} />} onClick={() => setSecurityOpen(true)} sx={{ textTransform: 'none' }}>
            Configure Security
          </Button>
          <Button variant="contained" size="small" startIcon={<Plus size={14} />} onClick={() => setDialog({ open: true, consumer: null })}>
            {count > 0 ? 'New Consumer' : 'Consume API'}
          </Button>
        </Stack>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2.5 }}>
          <CircularProgress size={20} />
        </Box>
      ) : error ? (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          {friendlyApiError(error, 'Could not load consumer applications.')}
        </Alert>
      ) : count > 0 ? (
        <Stack gap={1} sx={{ mt: 1.5 }}>
          {consumers.map((c) => (
            <Box key={c.subscription.id} sx={styles.consumerRow}>
              <Avatar variant="rounded" sx={styles.consumerAvatar}>
                {(consumerName(c)[0] ?? 'A').toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500} noWrap>
                  {consumerName(c)}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                  {consumerSub(c)}
                </Typography>
              </Box>
              <Chip label={c.subscription.status || 'ACTIVE'} size="small" color="success" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
              <Button variant="outlined" size="small" onClick={() => setDialog({ open: true, consumer: c })}>
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
      <CredentialsDialog open={dialog.open} onClose={() => setDialog({ open: false, consumer: null })} projectName={projectName} endpointRef={endpointRef} envLabel={envLabel} consumer={dialog.consumer} endpointUrl={endpointUrl} />
    </Box>
  );
}
