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

import { Alert, Box, Button, CircularProgress, PageContent, Tab, Tabs, Typography } from '@wso2/oxygen-ui';
import { ArrowLeft } from '@wso2/oxygen-ui-icons-react';
import { useMemo, useState, type JSX } from 'react';
import { useNavigate, useParams } from 'react-router';
import { isConfigGroupsEnabled, useConfigGroup, useUpdateConfigGroup } from '../hooks/useConfigGroups';
import { useOrgUuid } from '../hooks/useOrgUuid';
import { buildEditPayload, configGroupToFormValues } from '../utils/configGroups';
import ComingSoon from './ComingSoon';
import ConfigGroupForm from '../components/ConfigGroups/ConfigGroupForm';
import ConfigGroupUsageView from '../components/ConfigGroups/ConfigGroupUsageView';
import type { ConfigGroupSubmitValues } from '../types/configGroups';
import type { OrgScope } from '../nav';

export default function EditConfigGroup(scope: OrgScope): JSX.Element {
  const navigate = useNavigate();
  const orgUuid = useOrgUuid();
  const { configGroupUuid = '' } = useParams();
  const base = `/organizations/${scope.org}/admin/config-groups`;
  const { data: group, isLoading, isError, refetch } = useConfigGroup(configGroupUuid);
  const update = useUpdateConfigGroup();
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'config' | 'usage'>('config');

  const initial = useMemo(() => (group ? configGroupToFormValues(group) : undefined), [group]);

  if (!isConfigGroupsEnabled()) {
    return <ComingSoon title="Coming Soon" description="Config Groups management is currently under development." />;
  }

  const onSubmit = (values: ConfigGroupSubmitValues) => {
    setError(null);
    update.mutate(buildEditPayload(orgUuid ?? '', configGroupUuid, values.handle, values.displayName, values.description, values.configurations), {
      onSuccess: () => navigate(base),
      onError: () => setError("Couldn't save changes to the configuration group. Please try again."),
    });
  };

  return (
    <PageContent>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(base)} sx={{ mb: 2 }}>
        Back to configuration groups
      </Button>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        {group?.groupDisplayName || group?.groupName || 'Configuration Group'}
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v as 'config' | 'usage')} sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Tab label="Configuration" value="config" />
        <Tab label="Usage" value="usage" />
      </Tabs>

      {tab === 'config' ? (
        isLoading ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', py: 8 }} />
        ) : isError || !group || !initial ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }>
            Failed to load this configuration group.
          </Alert>
        ) : (
          <ConfigGroupForm mode="edit" orgHandle={scope.org} initial={initial} submitting={update.isPending} submitError={error} submitLabel="Save changes" onSubmit={onSubmit} onCancel={() => navigate(base)} />
        )
      ) : (
        <Box>
          <ConfigGroupUsageView configGroupUuid={configGroupUuid} active={tab === 'usage'} />
        </Box>
      )}
    </PageContent>
  );
}
