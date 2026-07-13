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

import { Alert, Button, Chip, CircularProgress, IconButton, ListingTable, PageContent, PageTitle, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Network, RefreshCw } from '@wso2/oxygen-ui-icons-react';
import { useMemo, useState, type JSX } from 'react';
import EmptyListing from '../components/EmptyListing';
import PdpProgressDrawer from '../components/DataPlanes/PdpProgressDrawer';
import ComingSoon from './ComingSoon';
import { displayPdpProgress, pdpStatusChip } from '../constants/dataPlanes';
import { isDataPlanesEnabled, useDataPlanes, usePdps } from '../hooks/useDataPlanes';
import { formatDateTime } from '../utils/time';
import type { Cluster, PdpManagerPdp } from '../types/dataPlanes';
import type { OrgScope } from '../nav';

export default function OrgDataPlanes(_scope: OrgScope): JSX.Element {
  const { data: clusters, isLoading, isFetching, isError, refetch } = useDataPlanes();
  const { data: pdps, refetch: refetchPdps } = usePdps();
  const [progressPdp, setProgressPdp] = useState<string | null>(null);

  // A provisioning/failed PDP is shown as a pending row, not as a cluster; a ready
  // cluster supersedes its PDP row.
  const rowClusters = useMemo<Cluster[]>(() => {
    return (clusters ?? []).filter((dp) => {
      const match = (pdps ?? []).find((p) => p.name === dp.name);
      return !match || (match.creationStatus !== 'IN_PROGRESS' && match.creationStatus !== 'FAILURE');
    });
  }, [clusters, pdps]);

  const rowPdps = useMemo<PdpManagerPdp[]>(() => {
    return (pdps ?? [])
      .filter((pdp) => {
        const hasReadyCluster = (clusters ?? []).some((dp) => dp.name === pdp.name);
        return !hasReadyCluster || pdp.creationStatus !== 'SUCCESS';
      })
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clusters, pdps]);

  const hasPdpInFlight = (pdps ?? []).some((p) => p.creationStatus === 'IN_PROGRESS' || p.creationStatus === 'PENDING');
  const isEmpty = !rowClusters.length && !rowPdps.length;

  const refresh = () => {
    refetch();
    refetchPdps();
  };

  if (!isDataPlanesEnabled()) {
    return <ComingSoon title="Coming Soon" description="Data Planes management is currently under development." />;
  }

  return (
    <PageContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ mb: 3 }}>
        <PageTitle>
          <PageTitle.Header>Data Planes</PageTitle.Header>
        </PageTitle>
        <Tooltip title="Refresh">
          <span>
            <IconButton size="small" aria-label="Refresh" onClick={refresh} disabled={isFetching}>
              <RefreshCw size={18} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {isLoading || (isFetching && !clusters?.length && !pdps?.length) ? (
        <CircularProgress sx={{ display: 'block', mx: 'auto', py: 8 }} />
      ) : isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }>
          Failed to load data planes.
        </Alert>
      ) : isEmpty ? (
        <EmptyListing icon={<Network size={48} />} title="No data planes yet" description="Data planes will appear here once available for your organization." />
      ) : (
        <>
          {hasPdpInFlight && (
            <Alert severity="info" sx={{ mb: 2 }}>
              A new private data plane is being provisioned. This may take up to an hour — you can leave this page and check back anytime.
            </Alert>
          )}
          <ListingTable.Container elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <ListingTable size="small">
              <ListingTable.Head>
                <ListingTable.Row>
                  <ListingTable.Cell>Name</ListingTable.Cell>
                  <ListingTable.Cell>Type</ListingTable.Cell>
                  <ListingTable.Cell>Status</ListingTable.Cell>
                  <ListingTable.Cell align="right">Registered</ListingTable.Cell>
                </ListingTable.Row>
              </ListingTable.Head>
              <ListingTable.Body>
                {rowPdps.map((pdp) => {
                  const chip = pdpStatusChip(pdp.creationStatus);
                  const progress = displayPdpProgress(pdp.creationProgress);
                  return (
                    <ListingTable.Row key={`pdp-${pdp.name}`}>
                      <ListingTable.Cell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {pdp.name}
                        </Typography>
                      </ListingTable.Cell>
                      <ListingTable.Cell>Private Data Plane</ListingTable.Cell>
                      <ListingTable.Cell>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Chip size="small" variant="outlined" color={chip.color} label={pdp.creationStatus === 'IN_PROGRESS' ? `${chip.label} · ${progress}%` : chip.label} />
                          {pdp.creationStatus === 'IN_PROGRESS' && (
                            <Button size="small" variant="text" onClick={() => setProgressPdp(pdp.name)}>
                              View progress
                            </Button>
                          )}
                        </Stack>
                      </ListingTable.Cell>
                      <ListingTable.Cell align="right">{formatDateTime(pdp.createdAt)}</ListingTable.Cell>
                    </ListingTable.Row>
                  );
                })}
                {rowClusters.map((dp) => {
                  const isPrivate = dp.labels?.private === true;
                  return (
                    <ListingTable.Row key={`dp-${dp.id}`}>
                      <ListingTable.Cell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {dp.name}
                        </Typography>
                      </ListingTable.Cell>
                      <ListingTable.Cell>{isPrivate ? 'Private Data Plane' : 'WSO2 Cloud Data Plane'}</ListingTable.Cell>
                      <ListingTable.Cell>
                        <Chip size="small" variant="outlined" color={dp.isActive ? 'success' : 'error'} label={dp.isActive ? 'Active' : 'Disconnected'} />
                      </ListingTable.Cell>
                      <ListingTable.Cell align="right">{isPrivate ? formatDateTime(dp.createdOn) : '—'}</ListingTable.Cell>
                    </ListingTable.Row>
                  );
                })}
              </ListingTable.Body>
            </ListingTable>
          </ListingTable.Container>
        </>
      )}

      <PdpProgressDrawer open={progressPdp !== null} pdpName={progressPdp} onClose={() => setProgressPdp(null)} />
    </PageContent>
  );
}
