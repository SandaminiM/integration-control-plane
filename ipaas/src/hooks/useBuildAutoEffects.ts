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

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GqlDeploymentStatus } from '../api/queries';

interface DeployInput {
  componentId: string;
  id: string;
  imageId: string;
  environmentId: string;
  deploymentPipelineId: string;
}

interface BuildAutoEffectsConfig {
  builds: GqlDeploymentStatus[];
  deploymentPipelineId: string;
  envId: string;
  componentId: string;
  versionId: string;
  imageId: string;
  deployFn: (input: DeployInput) => void;
  onAutoOpen: (build: GqlDeploymentStatus) => void;
}

export function useBuildAutoEffects(config: BuildAutoEffectsConfig) {
  const { builds, deploymentPipelineId, envId, componentId, versionId, imageId } = config;

  const [justTriggered, setJustTriggered] = useState(false);
  const autoOpenedRef = useRef<Set<number>>(new Set());
  const autoDeployedRef = useRef<Set<number>>(new Set());

  // Stable refs for callbacks so effects don't re-fire on every render
  const deployFnRef = useRef(config.deployFn);
  deployFnRef.current = config.deployFn;
  const onAutoOpenRef = useRef(config.onAutoOpen);
  onAutoOpenRef.current = config.onAutoOpen;

  const hasInProgress = builds.some((b) => b.status === 'in_progress' || b.status === 'queued');

  // Clear justTriggered once the builds list reflects the new queued/in_progress build
  useEffect(() => {
    if (hasInProgress && justTriggered) setJustTriggered(false);
  }, [hasInProgress, justTriggered]);

  // Auto-open drawer when a build transitions to in_progress
  useEffect(() => {
    const build = builds.find((b) => b.status === 'in_progress' && !autoOpenedRef.current.has(b.id));
    if (build) {
      autoOpenedRef.current.add(build.id);
      onAutoOpenRef.current(build);
    }
  }, [builds]);

  // Auto-deploy after a successful build.
  useEffect(() => {
    if (!deploymentPipelineId || !envId || !componentId || !versionId || !imageId) return;
    const successBuild = builds.find(
      (b) =>
        b.status === 'completed' &&
        (b.conclusionV2 === 'success' || b.conclusion === 'success') &&
        !autoDeployedRef.current.has(b.id),
    );
    if (successBuild) {
      autoDeployedRef.current.add(successBuild.id);
      deployFnRef.current({ componentId, id: versionId, imageId, environmentId: envId, deploymentPipelineId });
    }
  }, [builds, imageId, deploymentPipelineId, envId, componentId, versionId]);

  const markAsOpened = useCallback((buildId: number) => {
    autoOpenedRef.current.add(buildId);
  }, []);

  return { justTriggered, setJustTriggered, hasInProgress, markAsOpened };
}
