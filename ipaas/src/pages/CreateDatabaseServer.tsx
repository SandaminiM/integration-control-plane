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

import { Alert, Box, Button, Card, CardActionArea, CircularProgress, Divider, Grid, PageContent, Stack, TextField, Tooltip, Typography } from '@wso2/oxygen-ui';
import { ArrowLeft } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useMemo, useState, type JSX } from 'react';
import { useNavigate } from 'react-router';
import { isPlatformServicesEnabled, useCreateServer, useDatabaseServers, useServicePlans } from '../hooks/usePlatformServices';
import { useSubscriptions } from '../hooks/useSubscription';
import { useOrgUuid } from '../hooks/useOrgUuid';
import { PAID_SUBSCRIPTION_TYPE } from '../constants/subscription';
import { CLOUD_PROVIDERS, FREE_TIER_DISABLED_PROVIDERS, regionLabel, SERVICE_NAME_ERROR, SERVICE_NAME_REGEX, SERVICE_TYPES } from '../constants/platformServices';
import { planRegionSpec, plansForProviderRegion } from '../utils/platformServices';
import ComingSoon from './ComingSoon';
import VerticalStepper from '../components/VerticalStepper';
import type { OrgScope } from '../nav';
import type { CloudProvider, CloudRegion, ServicePlan, ServiceType } from '../types/platformServices';

const requiredSx = { '& .MuiFormLabel-asterisk': { color: 'error.main' } };
const assetUrl = (path: string): string => `${import.meta.env.BASE_URL}${path}`;
/** Section sub-headings, deliberately smaller than the "Create Database Server" title. */
const sectionHeadingSx = { fontWeight: 600, mb: 1.5 } as const;

interface CreateError {
  title: string;
  message: string;
  /** Entitlement failure — surface an Upgrade action when a billing console is configured. */
  upgrade?: boolean;
}

/** Turns a thrown create error into a titled, user-facing error, recognising entitlement codes. */
function toCreateError(err: unknown): CreateError {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('FREE_TRIAL_EXPIRED') || raw.includes('FREE_SUB_MAX_COUNT_EXCEEDED')) {
    return { title: 'Upgrade required', message: 'Please upgrade your WSO2 Integration Platform subscription to create more database services.', upgrade: true };
  }
  if (raw.includes('RATE_LIMIT')) {
    return { title: 'Too many requests', message: 'Please retry after some time. If the issue persists, contact support.' };
  }
  if (raw.includes('HTTP 409')) {
    return { title: 'Name already in use', message: 'A database server with this name already exists. Choose a different service name.' };
  }
  return { title: "Couldn't create database server", message: 'Something went wrong while provisioning the server. Please try again.' };
}

interface SelectableCardProps {
  title: string;
  description?: string;
  /** Optional provider logo (full URL). */
  logo?: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

function SelectableCard({ title, description, logo, selected, disabled, onSelect }: SelectableCardProps): JSX.Element {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderColor: selected ? 'primary.main' : 'divider', borderWidth: selected ? 2 : 1, opacity: disabled ? 0.5 : 1 }}>
      <CardActionArea disabled={disabled} onClick={onSelect} sx={{ height: '100%', p: 2, alignItems: 'flex-start', justifyContent: 'flex-start' }}>
        {logo && <Box component="img" src={logo} alt="" sx={{ height: 28, mb: 1, display: 'block' }} />}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: description ? 0.5 : 0 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </CardActionArea>
    </Card>
  );
}

function PlanCard({ plan, provider, region, selected, disabled, onSelect }: { plan: ServicePlan; provider: CloudProvider; region: CloudRegion; selected: boolean; disabled: boolean; onSelect: () => void }): JSX.Element | null {
  const spec = planRegionSpec(plan, provider, region);
  if (!spec) return null;
  return (
    <Card variant="outlined" sx={{ width: 240, borderColor: selected ? 'primary.main' : 'divider', borderWidth: selected ? 2 : 1, opacity: disabled ? 0.5 : 1 }}>
      <CardActionArea disabled={disabled} onClick={onSelect} sx={{ p: 2, alignItems: 'flex-start' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          {plan.name}
        </Typography>
        <Typography variant="body2">Nodes: {plan.node_count}</Typography>
        <Typography variant="body2">RAM: {spec.node_ram_gb} GB</Typography>
        <Typography variant="body2">CPU: {spec.node_cpu_count} vCPU</Typography>
        {plan.type !== 'redis' && <Typography variant="body2">Storage: {spec.storage_gb} GB</Typography>}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          {plan.backup_retention_days > 0 ? `Backups every ${plan.backup_interval_hours} hours. Retained for ${plan.backup_retention_days} days.` : 'No automated backups. For development use only.'}
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600 }}>
          ${spec.hourly_price_usd}
          <Typography component="span" variant="caption" color="text.secondary">
            {' '}
            / hour
          </Typography>
        </Typography>
      </CardActionArea>
    </Card>
  );
}

export default function CreateDatabaseServer(scope: OrgScope): JSX.Element {
  const navigate = useNavigate();
  const orgUuid = useOrgUuid();
  const base = `/organizations/${scope.org}/admin/databases`;

  const { data: subscriptions } = useSubscriptions(orgUuid ?? '');
  const isSubscribed = (subscriptions?.list ?? []).some((s) => s.subscriptionType === PAID_SUBSCRIPTION_TYPE);
  const billingConsoleUrl = window.API_CONFIG?.billingConsoleUrl;

  const [activeStep, setActiveStep] = useState(0);
  const [storageType, setStorageType] = useState<ServiceType>('postgres');
  const [serviceName, setServiceName] = useState('');
  const [provider, setProvider] = useState<CloudProvider | ''>('');
  const [region, setRegion] = useState<CloudRegion | ''>('');
  const [planId, setPlanId] = useState('');
  const [error, setError] = useState<CreateError | null>(null);

  const plansQuery = useServicePlans(storageType);
  const servers = useDatabaseServers();
  const create = useCreateServer();

  const disabledProviders = useMemo(() => (isSubscribed ? [] : FREE_TIER_DISABLED_PROVIDERS), [isSubscribed]);

  // Default the provider (first non-disabled offered one) and region once plans load / type changes.
  useEffect(() => {
    const data = plansQuery.data;
    if (!data) return;
    const allowed = data.providers.filter((p) => !disabledProviders.includes(p));
    setProvider((allowed[0] ?? data.providers[0] ?? '') as CloudProvider | '');
    setRegion((data.regions[0] ?? '') as CloudRegion | '');
  }, [plansQuery.data, disabledProviders]);

  const availablePlans = useMemo<ServicePlan[]>(() => {
    if (!plansQuery.data || !provider || !region) return [];
    return plansForProviderRegion(plansQuery.data.plans, provider, region);
  }, [plansQuery.data, provider, region]);

  // Auto-select a valid plan for the current provider/region/subscription.
  useEffect(() => {
    const selectable = availablePlans.filter((p) => isSubscribed || p.free_trial_available);
    if (selectable.some((p) => p.id === planId)) return;
    setPlanId(selectable[0]?.id ?? availablePlans[0]?.id ?? '');
  }, [availablePlans, planId, isSubscribed]);

  const nameInUse = (servers.data ?? []).some((s) => s.name === serviceName);
  const nameInvalid = serviceName !== '' && !SERVICE_NAME_REGEX.test(serviceName);
  const nameError = nameInUse ? 'Service name already in use' : nameInvalid ? SERVICE_NAME_ERROR : '';
  const hasPlans = !!plansQuery.data?.plans.length;
  const step1Valid = hasPlans && serviceName !== '' && !nameInUse && !nameInvalid;

  if (!isPlatformServicesEnabled()) {
    return <ComingSoon title="Coming Soon" description="Databases management is currently under development." />;
  }

  const submit = () => {
    if (!provider || !region || !planId) return;
    setError(null);
    create.mutate(
      { name: serviceName, cloud_provider: provider, cloud_region: region, service_plan_id: planId, is_vector_enabled: false },
      {
        onSuccess: (server) => navigate(`${base}/${server.id}/overview`),
        onError: (e) => setError(toCreateError(e)),
      },
    );
  };

  return (
    <PageContent>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(base)} sx={{ mb: 2 }}>
        Back to database server list
      </Button>

      <Stack direction="row" gap={4} alignItems="flex-start">
        {/* Left step rail */}
        <Box sx={{ width: { xs: '100%', md: 220 }, flexShrink: 0, pt: 1 }}>
          <VerticalStepper activeStep={activeStep} steps={['Select Database Type', 'Select service plan']} />
        </Box>

        {/* Step content */}
        <Box sx={{ flex: 1, maxWidth: 900, mt: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Create Database Server
          </Typography>

          {error && (
            <Alert
              severity={error.upgrade ? 'warning' : 'error'}
              variant="outlined"
              onClose={() => setError(null)}
              action={
                error.upgrade && billingConsoleUrl && orgUuid ? (
                  <Button color="inherit" size="small" variant="outlined" onClick={() => window.open(`${billingConsoleUrl}/cloud/devant/upgrade?orgId=${encodeURIComponent(orgUuid)}`, '_blank', 'noopener,noreferrer')}>
                    Upgrade
                  </Button>
                ) : undefined
              }
              sx={{ mb: 3, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {error.title}
              </Typography>
              <Typography variant="body2">{error.message}</Typography>
            </Alert>
          )}

          {plansQuery.isLoading ? (
            <CircularProgress sx={{ display: 'block', mx: 'auto', py: 8 }} />
          ) : activeStep === 0 ? (
            <>
              <Typography variant="subtitle2" sx={sectionHeadingSx}>
                Select Cloud Storage
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {SERVICE_TYPES.map((t) => (
                  <Grid key={t.id} size={{ xs: 12, sm: 4 }}>
                    <SelectableCard title={t.name} description={t.description} logo={assetUrl(t.logo)} selected={storageType === t.id} disabled={t.disabled} onSelect={() => setStorageType(t.id)} />
                  </Grid>
                ))}
              </Grid>
              <TextField label="Service Name" required fullWidth value={serviceName} onChange={(e) => setServiceName(e.target.value)} error={!!nameError} helperText={nameError} placeholder="Enter service name" sx={{ maxWidth: 480, ...requiredSx }} />
            </>
          ) : (
            <>
              {!isSubscribed && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Try out a 7-day free trial!
                  </Typography>
                  <Typography variant="body2">Try out a developer database for 7 days at no cost. Upgrade your subscription to unlock all cloud providers and production-ready service plans.</Typography>
                </Alert>
              )}

              <Typography variant="subtitle2" sx={sectionHeadingSx}>
                Select Cloud Provider
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {(plansQuery.data?.providers ?? []).map((p) => {
                  const info = CLOUD_PROVIDERS.find((c) => c.id === p);
                  const disabled = disabledProviders.includes(p);
                  const card = <SelectableCard title={info?.name ?? p} logo={info ? assetUrl(info.logo) : undefined} selected={provider === p} disabled={disabled} onSelect={() => setProvider(p)} />;
                  return (
                    <Grid key={p} size={{ xs: 6, sm: 3 }}>
                      {disabled ? <Tooltip title="Upgrade your subscription to select this cloud provider.">{<span>{card}</span>}</Tooltip> : card}
                    </Grid>
                  );
                })}
              </Grid>

              <Typography variant="subtitle2" sx={sectionHeadingSx}>
                Select Region
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {(plansQuery.data?.regions ?? []).map((r) => (
                  <Grid key={r} size={{ xs: 6, sm: 3 }}>
                    <SelectableCard title={regionLabel(r)} selected={region === r} onSelect={() => setRegion(r)} />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="subtitle2" sx={sectionHeadingSx}>
                Select Service Plan
              </Typography>
              <Stack direction="row" gap={2} flexWrap="wrap">
                {provider &&
                  region &&
                  availablePlans.map((plan) => {
                    const disabled = !isSubscribed && !plan.free_trial_available;
                    return <PlanCard key={plan.id} plan={plan} provider={provider} region={region} selected={planId === plan.id} disabled={disabled} onSelect={() => setPlanId(plan.id)} />;
                  })}
              </Stack>
            </>
          )}

          {/* Actions */}
          <Stack direction="row" gap={1.5} sx={{ mt: 4 }}>
            <Button variant="outlined" disabled={activeStep === 0} onClick={() => setActiveStep((s) => Math.max(0, s - 1))}>
              Back
            </Button>
            {activeStep === 0 ? (
              <Button variant="contained" disabled={!step1Valid} onClick={() => setActiveStep(1)}>
                Next
              </Button>
            ) : (
              <Button variant="contained" disabled={!planId || create.isPending} startIcon={create.isPending ? <CircularProgress size={16} color="inherit" /> : undefined} onClick={submit}>
                {create.isPending ? 'Creating…' : 'Create'}
              </Button>
            )}
          </Stack>
        </Box>
      </Stack>
    </PageContent>
  );
}
