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

import { gql } from './graphql';
import type { ArtifactToggleStatusInput, ArtifactToggleKind } from '../../types/artifact';

const UPDATE_ARTIFACT_TRACING_STATUS = `
  mutation UpdateArtifactTracingStatus($input: ArtifactTracingChangeInput!) {
    updateArtifactTracingStatus(input: $input) {
      status, message, successCount, failedCount, details
    }
  }`;

const UPDATE_ARTIFACT_STATISTICS_STATUS = `
  mutation UpdateArtifactStatisticsStatus($input: ArtifactStatisticsChangeInput!) {
    updateArtifactStatisticsStatus(input: $input) {
      status, message, successCount, failedCount, details
    }
  }`;

/** PascalCase → kebab-case: "ProxyService" → "proxy-service" */
function toKebab(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function toBackendArtifactType(artifactType: string): string {
  if (artifactType === 'RestApi') return 'api';
  return toKebab(artifactType);
}

export const TOGGLE_CONFIG: Record<ArtifactToggleKind, { mutation: string; requestField: 'trace' | 'statistics'; cacheField: 'tracing' | 'statistics' }> = {
  tracing: {
    mutation: UPDATE_ARTIFACT_TRACING_STATUS,
    requestField: 'trace',
    cacheField: 'tracing',
  },
  statistics: {
    mutation: UPDATE_ARTIFACT_STATISTICS_STATUS,
    requestField: 'statistics',
    cacheField: 'statistics',
  },
};

export async function updateArtifactToggleStatus(kind: ArtifactToggleKind, input: ArtifactToggleStatusInput): Promise<{ status: string; message: string }> {
  const config = TOGGLE_CONFIG[kind];
  const mutationInput: Record<string, string> = {
    componentId: input.componentId,
    artifactType: toBackendArtifactType(input.artifactType),
    artifactName: input.artifactName,
    [config.requestField]: input.value,
  };

  if (kind === 'tracing') {
    return gql<{ updateArtifactTracingStatus: { status: string; message: string } }>(config.mutation, { input: mutationInput }).then((d) => d.updateArtifactTracingStatus);
  }
  return gql<{ updateArtifactStatisticsStatus: { status: string; message: string } }>(config.mutation, { input: mutationInput }).then((d) => d.updateArtifactStatisticsStatus);
}
