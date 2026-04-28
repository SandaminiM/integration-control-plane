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

import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, Card, CardContent, CircularProgress, FormControl, MenuItem, Select, Stack, Typography } from '@wso2/oxygen-ui';
import { ArrowRight, Settings, Users } from '@wso2/oxygen-ui-icons-react';
import { authenticatedFetch, getOrgUuidFromToken } from '../auth/tokenManager';
import { choreoDevopsApiUrl } from '../config/api';
import { projectHomeUrl } from '../paths';
import Projects from './Projects';

const PERSONA_KEY = 'icp_persona';
const REGION_KEY = 'icp_region';

const PERSONAS = [
  {
    id: 'developer',
    title: 'Developer/Architect/Product Manager',
    description: 'Focus on building, testing, and deploying applications.',
    Icon: Users,
  },
  {
    id: 'platform-engineer',
    title: 'Platform Engineer/SRE',
    description: 'Focus on infrastructure, governance, service mesh, and monitoring.',
    Icon: Settings,
  },
] as const;

const REGIONS = [
  { value: 'US', label: '🇺🇸 US' },
  { value: 'EU', label: '🇪🇺 EU' },
];

const DEFAULT_PROJECT_HANDLER = 'default';

function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        bgcolor: 'grey.100',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Card sx={{ maxWidth: 480, width: '100%', borderRadius: 2, boxShadow: 3 }}>
        <CardContent sx={{ p: 4, '&:last-child': { pb: 4 } }}>{children}</CardContent>
      </Card>
    </Box>
  );
}

export default function OrgHome(): JSX.Element {
  const { orgHandler } = useParams<{ orgHandler: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<'persona' | 'region' | 'done'>(() => (localStorage.getItem(PERSONA_KEY) ? 'done' : 'persona'));
  const [persona, setPersona] = useState<string>('developer');
  const [region, setRegion] = useState<string>('US');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (step === 'done') {
    return <Projects />;
  }

  if (step === 'region') {
    const handleGetStarted = async () => {
      setIsSubmitting(true);
      try {
        const orgUuid = getOrgUuidFromToken();
        const orgNumericId = window.API_CONFIG.asgardeoOrgNumericId ?? parseInt(localStorage.getItem('icp_org_numeric_id') ?? '0', 10);
        const handle = orgHandler!;

        // Step 1: Init default environments for the org
        if (orgUuid) {
          await authenticatedFetch(`${choreoDevopsApiUrl()}/api/v1/organizations/${orgUuid}/projects/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region }),
          });
        }

        // Step 2: Create the default project via GraphQL
        if (orgNumericId) {
          await authenticatedFetch(window.API_CONFIG.graphqlUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `mutation {
                createProject(project: {
                  name: "Default",
                  description: "This is a default project created by WSO2 Integration Platform",
                  projectHandler: "${DEFAULT_PROJECT_HANDLER}",
                  orgId: ${orgNumericId},
                  orgHandler: "${handle}",
                  version: "1.0.0"
                }) { id handler }
              }`,
            }),
          });
        }
      } catch {
        // Best-effort — navigate regardless
      } finally {
        localStorage.setItem(PERSONA_KEY, persona);
        localStorage.setItem(REGION_KEY, region);
        navigate(projectHomeUrl(orgHandler!, DEFAULT_PROJECT_HANDLER), { replace: true });
      }
    };

    return (
      <OnboardingShell>
        <Typography variant="h3" component="h1" sx={{ mb: 4 }}>
          Select Your Region
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select the cloud region to deploy your applications.
        </Typography>

        <Alert severity="info" variant="outlined" icon={false} sx={{ mb: 3 }}>
          You can start with the default Cloud Data Plane and later set up your own Private Data Plane by connecting your Kubernetes cluster
        </Alert>

        <FormControl size="small" sx={{ mb: 3, width: 200, display: 'flex', mx: 'auto' }}>
          <Select value={region} onChange={(e) => setRegion(e.target.value as string)} MenuProps={{ sx: { zIndex: 10000 } }}>
            {REGIONS.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" color="secondary" onClick={() => setStep('persona')} disabled={isSubmitting}>
            Back
          </Button>
          <Button variant="contained" color="primary" onClick={handleGetStarted} disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {isSubmitting ? 'Setting up...' : 'Get Started'}
          </Button>
        </Box>
      </OnboardingShell>
    );
  }

  // step === 'persona'
  return (
    <OnboardingShell>
      <Typography variant="h3" component="h1" sx={{ mb: 4 }}>
        Welcome to WSO2 Integration Platform
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        WSO2 Integration Platform provides customized views for developers, architects, platform engineers, and SREs to streamline workflows.
      </Typography>

      <Typography variant="body2" sx={{ mb: 1.5 }}>
        Select your persona to get started
      </Typography>

      <Stack spacing={1.5}>
        {PERSONAS.map(({ id, title, description, Icon }) => (
          <Card
            key={id}
            variant="outlined"
            onClick={() => setPersona(id)}
            sx={{
              cursor: 'pointer',
              borderColor: persona === id ? 'primary.main' : 'divider',
              borderWidth: persona === id ? 2 : 1,
              borderStyle: 'solid',
              '&:hover': { borderColor: 'primary.main' },
            }}>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', py: 1.5, px: 2 }}>
              <Box sx={{ color: 'primary.main', mt: 0.5, flexShrink: 0 }}>
                <Icon size={28} />
              </Box>
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" color="primary" onClick={() => setStep('region')} endIcon={<ArrowRight size={16} />}>
          Next
        </Button>
      </Box>
    </OnboardingShell>
  );
}
