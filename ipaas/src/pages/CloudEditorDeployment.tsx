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

import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { useLocation } from 'react-router';
import { Alert, Box, Button, CircularProgress, Typography } from '@wso2/oxygen-ui';
import { Check } from '@wso2/oxygen-ui-icons-react';
import { useGetOrCreateSampleRegistry, useCreateCodeServer } from '../hooks/useCloudEditor';
import { useComponentPods } from '../hooks/useRuntime';
import { CLOUD_EDITOR_STEPS, POD_PHASE_TO_STEP } from '../constants/cloudEditor';
import { highestPodPhase } from '../utils/cloudEditor';
import type { DeploymentParams, ChoreoSampleImage, CodeServerInstance, CloudEditorStepKey } from '../types/cloudEditor';

const ROW_HEIGHT = 40;
const POD_POLL_MS = 3_000;
const REDIRECT_TIMEOUT_MS = 3 * 60 * 1000;

export default function CloudEditorDeployment(): JSX.Element {
  const location = useLocation();
  const [stepKey, setStepKey] = useState<CloudEditorStepKey>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<CodeServerInstance | null>(null);
  const hasRun = useRef(false);
  const hasRedirected = useRef(false);
  const getOrCreateRegistryMutation = useGetOrCreateSampleRegistry();
  const createCodeServerMutation = useCreateCodeServer();

  const params = useMemo<DeploymentParams>(() => {
    const q = new URLSearchParams(location.search);
    return {
      userId: q.get('userId') ?? '',
      orgUuid: q.get('orgUuid') ?? '',
      orgHandle: q.get('orgHandle') ?? '',
      projectId: q.get('projectId') ?? '',
      componentId: q.get('componentId') ?? '',
      codeServerSample: q.get('codeServerSample') ?? '',
      sourceCommitHash: q.get('sourceCommitHash') ?? '',
    };
  }, [location.search]);

  const redirect = (url: string) => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    window.location.replace(url);
  };

  // Create flow: provision the editor, then hand off to pod polling (or redirect
  // immediately when the platform can't report pod status — e.g. cloud).
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const deploy = async () => {
      try {
        if (!params.orgUuid || !params.projectId || !params.codeServerSample || !params.userId || !params.orgHandle) {
          throw new Error('Missing required deployment parameters (userId/orgHandle). Please close this window and try again.');
        }

        let codeServerSample: ChoreoSampleImage;
        try {
          codeServerSample = JSON.parse(params.codeServerSample) as ChoreoSampleImage;
        } catch {
          throw new Error('Invalid Code Server image data. Please close this window and try again.');
        }
        if (!codeServerSample.image_url) {
          throw new Error('Code Server image URL is missing. Please close this window and try again.');
        }

        setStepKey('creating');
        let registry;
        try {
          registry = await getOrCreateRegistryMutation.mutateAsync(params.orgUuid);
        } catch (err) {
          throw new Error('Unable to set up the Cloud Editor environment. Please try again or contact support if the problem persists.', { cause: err });
        }

        let created: CodeServerInstance;
        try {
          created = await createCodeServerMutation.mutateAsync({
            userId: params.userId,
            organizationId: params.orgUuid,
            projectId: params.projectId,
            componentId: params.componentId,
            orgHandle: params.orgHandle,
            imageUrl: codeServerSample.image_url,
            registryId: registry.id,
            sourceCommitHash: params.sourceCommitHash || undefined,
          });
        } catch (err) {
          throw new Error('Unable to start the Cloud Editor. Please try again or contact support if the problem persists.', { cause: err });
        }

        const normalized = created.url.startsWith('http') ? created.url : `https://${created.url}`;
        let editorUrl: URL;
        try {
          editorUrl = new URL(normalized);
        } catch {
          throw new Error('Invalid editor URL returned from server. Please close this window and try again.');
        }
        if (editorUrl.protocol !== 'https:') {
          throw new Error('Editor URL must use HTTPS. Please close this window and try again.');
        }

        const ready: CodeServerInstance = { ...created, url: editorUrl.toString() };
        setInstance(ready);
        setStepKey('scheduling');

        // No cluster coordinates (e.g. cloud) → pod status can't be polled; go straight to the editor.
        if (!ready.clusterId || !ready.releaseId || !ready.namespace) {
          setStepKey('opening');
          redirect(ready.url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      }
    };

    deploy();
  }, [params, createCodeServerMutation, getOrCreateRegistryMutation]);

  // Poll the editor's pod (3s) and advance the wheel as its conditions progress.
  const podsQuery = useComponentPods(params.projectId, instance?.clusterId ?? '', instance?.releaseId ?? '', instance?.namespace ?? '', POD_POLL_MS);
  const pods = podsQuery.data ?? [];
  const isAnyPodRunning = pods.some((p) => p.status?.phase === 'Running');

  useEffect(() => {
    if (!instance?.clusterId) return;
    if (isAnyPodRunning) {
      setStepKey('opening');
      return;
    }
    setStepKey(pods.length === 0 ? 'scheduling' : POD_PHASE_TO_STEP[highestPodPhase(pods)]);
  }, [instance, isAnyPodRunning, pods]);

  // Redirect once the pod is running.
  useEffect(() => {
    if (instance && isAnyPodRunning) redirect(instance.url);
  }, [instance, isAnyPodRunning]);

  // Keep-alive ping so the scale-to-zero timer doesn't evict the pod before we redirect.
  useEffect(() => {
    if (!instance?.clusterId || isAnyPodRunning || hasRedirected.current) return undefined;
    let pingUrl = instance.url;
    try {
      const u = new URL(instance.url);
      u.searchParams.delete('tkn');
      pingUrl = u.toString();
    } catch {
      // fall back to the raw URL
    }
    const ping = () => void fetch(pingUrl, { method: 'GET', mode: 'no-cors', credentials: 'omit', cache: 'no-store' }).catch(() => {});
    ping();
    const id = window.setInterval(ping, POD_POLL_MS);
    return () => clearInterval(id);
  }, [instance, isAnyPodRunning]);

  // Give up if the pod never becomes ready.
  useEffect(() => {
    if (!instance?.clusterId || isAnyPodRunning) return undefined;
    const id = window.setTimeout(() => {
      if (!hasRedirected.current) setError('Your Cloud Editor setup is taking longer than usual. Please close this window and try again later.');
    }, REDIRECT_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [instance, isAnyPodRunning]);

  const activeIndex = CLOUD_EDITOR_STEPS.findIndex((s) => s.key === stepKey);

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2, p: 4 }}>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 4, p: 3 }}>
      <Typography variant="h3" fontWeight={700} textAlign="center">
        Your Cloud Editor instance is currently being created.
      </Typography>

      {/* iOS-timer-style wheel: the active step is centred; done steps scroll up, upcoming steps sit below, both fading toward the edges. */}
      <Box
        sx={{
          position: 'relative',
          width: 260,
          height: 6 * ROW_HEIGHT,
          overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, transparent 0, #000 20%, #000 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 20%, #000 80%, transparent 100%)',
        }}>
        <Box
          sx={{ position: 'absolute', left: 0, right: 0, top: 0, transition: 'transform 450ms cubic-bezier(0.25, 0.1, 0.25, 1)', willChange: 'transform' }}
          style={{ transform: `translateY(calc(50% - ${(activeIndex + 0.5) * ROW_HEIGHT}px))` }}>
          {CLOUD_EDITOR_STEPS.map((step, idx) => {
            const absOffset = Math.abs(idx - activeIndex);
            const opacity = absOffset === 0 ? 1 : Math.max(0.22, 1 - 0.18 * absOffset);
            const blurPx = absOffset === 0 ? 0 : Math.min(5, 0.9 * absOffset);
            const state = idx < activeIndex ? 'complete' : idx === activeIndex ? 'active' : 'pending';
            return (
              <Box
                key={step.key}
                sx={{
                  height: ROW_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  pl: 0.5,
                  transition: 'opacity 450ms cubic-bezier(0.25, 0.1, 0.25, 1), filter 450ms cubic-bezier(0.25, 0.1, 0.25, 1)',
                }}
                style={{ opacity, filter: blurPx ? `blur(${blurPx}px)` : 'none' }}>
                <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'text.secondary' }}>
                  {state === 'complete' && <Check size={16} />}
                  {state === 'active' && <CircularProgress size={14} thickness={5} />}
                </Box>
                <Typography
                  variant="body1"
                  noWrap
                  sx={{
                    color: state === 'active' ? 'text.primary' : state === 'complete' ? 'text.secondary' : 'text.disabled',
                    fontWeight: state === 'active' ? 600 : 400,
                  }}>
                  {step.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
