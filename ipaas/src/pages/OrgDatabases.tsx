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

import { Alert, Button, CircularProgress, IconButton, PageContent, PageTitle, Stack, Tooltip } from '@wso2/oxygen-ui';
import { Plus, RefreshCw } from '@wso2/oxygen-ui-icons-react';
import { useMemo, useState, type JSX } from 'react';
import { useNavigate } from 'react-router';
import { isPlatformServicesEnabled, useDatabaseServers, useServiceAvailability } from '../hooks/usePlatformServices';
import { useSubscriptions } from '../hooks/useSubscription';
import { useOrgUuid } from '../hooks/useOrgUuid';
import { PAID_SUBSCRIPTION_TYPE } from '../constants/subscription';
import type { OrgScope } from '../nav';
import ComingSoon from './ComingSoon';
import DatabaseServersTable from '../components/Databases/DatabaseServersTable';
import NoDatabaseServersBanner from '../components/Databases/NoDatabaseServersBanner';
import type { DatabaseServer } from '../types/platformServices';

export default function OrgDatabases(scope: OrgScope): JSX.Element {
  const navigate = useNavigate();
  const orgUuid = useOrgUuid();
  const availability = useServiceAvailability();
  const servers = useDatabaseServers();
  const { data: subscriptions } = useSubscriptions(orgUuid ?? '');
  const isSubscribed = (subscriptions?.list ?? []).some((s) => s.subscriptionType === PAID_SUBSCRIPTION_TYPE);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const base = `/organizations/${scope.org}/admin/databases`;

  // Only the regular (non-vector) servers belong on this page; vector DBs have their own.
  const regularServers = useMemo(() => (servers.data ?? []).filter((s) => !s.is_vector_enabled), [servers.data]);

  if (!isPlatformServicesEnabled()) {
    return <ComingSoon title="Coming Soon" description="Databases management is currently under development." />;
  }

  const notAllowlisted = availability.data?.reason === 'ORGANIZATION_NOT_IN_ALLOW_LIST';
  const createAllowed = !!availability.data?.is_available && regularServers.length < (availability.data?.service_count_limit ?? 0);
  const upgradeRequired = availability.data?.reason === 'FREE_SUB_MAX_COUNT_EXCEEDED' || availability.data?.reason === 'FREE_TRIAL_EXPIRED';

  const openServer = (server: DatabaseServer) => navigate(`${base}/${server.id}/overview`);

  const createButton = (
    <Button variant="contained" startIcon={<Plus size={20} />} disabled={!createAllowed} onClick={() => navigate(`${base}/new`)} sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
      {upgradeRequired ? 'Upgrade required' : 'Create'}
    </Button>
  );

  return (
    <PageContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <PageTitle>
          <PageTitle.Header>Databases</PageTitle.Header>
        </PageTitle>
        {!!regularServers.length && (
          <Stack direction="row" alignItems="center" gap={1}>
            <Tooltip title="Refresh">
              <IconButton size="small" aria-label="Refresh database servers" onClick={() => servers.refetch()} disabled={servers.isFetching}>
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
            {createButton}
          </Stack>
        )}
      </Stack>

      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      {servers.isLoading || availability.isLoading ? (
        <CircularProgress sx={{ display: 'block', mx: 'auto', py: 8 }} />
      ) : notAllowlisted ? (
        <Alert severity="info">This feature is only available for selected organizations in this environment.</Alert>
      ) : servers.isError || availability.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => (servers.refetch(), availability.refetch())}>
              Retry
            </Button>
          }>
          Failed to list available database services.
        </Alert>
      ) : regularServers.length === 0 ? (
        <NoDatabaseServersBanner createAllowed={createAllowed} upgradeRequired={upgradeRequired} onCreate={() => navigate(`${base}/new`)} />
      ) : (
        <DatabaseServersTable
          servers={regularServers}
          isSubscribed={isSubscribed}
          onOpenServer={openServer}
          onDeleted={(name) => setAlert({ type: 'success', message: `Database server '${name}' deleted.` })}
          onError={(message) => setAlert({ type: 'error', message })}
        />
      )}
    </PageContent>
  );
}
