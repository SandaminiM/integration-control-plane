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
import type { BuildRun } from '../types/deployment';

interface BuildAutoEffectsConfig {
  builds: BuildRun[];
  onAutoOpen: (build: BuildRun) => void;
}

export function useBuildAutoEffects({ builds, onAutoOpen }: BuildAutoEffectsConfig) {
  const [justTriggered, setJustTriggered] = useState(false);
  const autoOpenedRef = useRef<Set<number>>(new Set());

  const onAutoOpenRef = useRef(onAutoOpen);
  onAutoOpenRef.current = onAutoOpen;

  const hasInProgress = builds.some((b) => b.status === 'in_progress' || b.status === 'queued');

  // Clear justTriggered once the builds list reflects the new queued/in_progress build
  useEffect(() => {
    if (hasInProgress && justTriggered) setJustTriggered(false);
  }, [hasInProgress, justTriggered]);

  // Auto-open the details drawer when a build transitions to in_progress
  useEffect(() => {
    const build = builds.find((b) => b.status === 'in_progress' && !autoOpenedRef.current.has(b.id));
    if (build) {
      autoOpenedRef.current.add(build.id);
      onAutoOpenRef.current(build);
    }
  }, [builds]);

  const markAsOpened = useCallback((buildId: number) => {
    autoOpenedRef.current.add(buildId);
  }, []);

  return { justTriggered, setJustTriggered, hasInProgress, markAsOpened };
}
