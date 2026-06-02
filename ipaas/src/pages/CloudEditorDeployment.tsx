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

import { useEffect, useRef, useState, type JSX } from 'react';
import { useLocation } from 'react-router';
import { Alert, Box, Button, CircularProgress, Typography } from '@wso2/oxygen-ui';
import { useGetOrCreateSampleRegistry, useCreateCodeServer } from '../hooks/useCloudEditor';
import { CLOUD_EDITOR_STEPS } from '../constants/cloudEditor';
import type { DeploymentParams, ChoreoSampleImage, ProgressStep } from '../types/cloudEditor';

export default function CloudEditorDeployment(): JSX.Element {
  const location = useLocation();
  const [step, setStep] = useState<ProgressStep>(CLOUD_EDITOR_STEPS.initializing);
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);
  const getOrCreateRegistryMutation = useGetOrCreateSampleRegistry();
  const createCodeServerMutation = useCreateCodeServer();

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const deploy = async () => {
      try {
        // 1. Parse URL params written by CreateIntegrationOptions.handleOpenCloudEditor
        const params = new URLSearchParams(location.search);
        const deploymentParams: DeploymentParams = {
          userId: params.get('userId') ?? '',
          orgUuid: params.get('orgUuid') ?? '',
          orgHandle: params.get('orgHandle') ?? '',
          projectId: params.get('projectId') ?? '',
          componentId: params.get('componentId') ?? '',
          codeServerSample: params.get('codeServerSample') ?? '',
          sourceCommitHash: params.get('sourceCommitHash') ?? '',
        };

        if (!deploymentParams.orgUuid || !deploymentParams.projectId || !deploymentParams.codeServerSample || !deploymentParams.userId || !deploymentParams.orgHandle) {
          throw new Error('Missing required deployment parameters (userId/orgHandle). Please close this window and try again.');
        }

        let codeServerSample: ChoreoSampleImage;
        try {
          codeServerSample = JSON.parse(deploymentParams.codeServerSample) as ChoreoSampleImage;
        } catch {
          throw new Error('Invalid Code Server image data. Please close this window and try again.');
        }

        if (!codeServerSample.image_url) {
          throw new Error('Code Server image URL is missing. Please close this window and try again.');
        }

        // 2. Get or create the Choreo samples container registry
        setStep(CLOUD_EDITOR_STEPS.creatingEditor);
        let registry;
        try {
          registry = await getOrCreateRegistryMutation.mutateAsync(deploymentParams.orgUuid);
        } catch {
          throw new Error('Unable to set up the Cloud Editor environment. Please try again or contact support if the problem persists.');
        }

        // 3. Call createCodeServer — backend provisions the container and returns its URL
        setStep(CLOUD_EDITOR_STEPS.configuring);
        let rawUrl: string;
        try {
          rawUrl = await createCodeServerMutation.mutateAsync({
            userId: deploymentParams.userId,
            organizationId: deploymentParams.orgUuid,
            projectId: deploymentParams.projectId,
            componentId: deploymentParams.componentId,
            orgHandle: deploymentParams.orgHandle,
            imageUrl: codeServerSample.image_url,
            registryId: registry.id,
            sourceCommitHash: deploymentParams.sourceCommitHash || undefined,
          });
        } catch {
          throw new Error('Unable to start the Cloud Editor. Please try again or contact support if the problem persists.');
        }

        // 4. Validate URL is HTTPS and redirect — replace() so the loading page is not in back history
        setStep(CLOUD_EDITOR_STEPS.redirecting);
        let editorUrl: URL;
        try {
          const normalized = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
          editorUrl = new URL(normalized);
        } catch {
          throw new Error('Invalid editor URL returned from server. Please close this window and try again.');
        }
        if (editorUrl.protocol !== 'https:') {
          throw new Error('Editor URL must use HTTPS. Please close this window and try again.');
        }
        window.location.replace(editorUrl.toString());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      }
    };

    deploy();
  }, [location.search]);

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 4,
        }}>
        <Alert severity="error" sx={{ maxWidth: 520, width: '100%' }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Cloud Editor Setup Failed
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Button variant="outlined" onClick={() => window.close()}>
          Close Tab
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
      }}>
      <Typography variant="h2">Your Cloud Editor instance is being created</Typography>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" value={step.progress} size={80} thickness={4} />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Typography variant="caption" component="div" color="text.secondary">
            {step.progress}%
          </Typography>
        </Box>
      </Box>
      <Typography color="text.secondary" variant="body2">
        {step.text}
      </Typography>
    </Box>
  );
}
