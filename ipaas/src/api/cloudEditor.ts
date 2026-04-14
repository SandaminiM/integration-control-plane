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
import { authenticatedFetch } from '../auth/tokenManager';
import { choreoDevopsApiUrl } from '../config/api';
import type { ContainerRegistry } from '../types/cloudEditor';

const CHOREO_SAMPLES_REGISTRY_HOST = 'choreoanonymouspullable.azurecr.io';

async function getContainerRegistries(orgUuid: string): Promise<ContainerRegistry[]> {
  const url = `${choreoDevopsApiUrl()}/api/v1/container-registries?organization_id=${encodeURIComponent(orgUuid)}`;
  const res = await authenticatedFetch(url);
  if (!res.ok) throw new Error(`Failed to fetch container registries (${res.status})`);
  const json = await res.json();
  return (json?.data ?? []) as ContainerRegistry[];
}

async function createContainerRegistry(orgUuid: string): Promise<ContainerRegistry> {
  const url = `${choreoDevopsApiUrl()}/api/v1/container-registries?organization_id=${encodeURIComponent(orgUuid)}`;
  const res = await authenticatedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Choreo Samples Registry',
      type: 'vendor-specific',
      provider: 'Azure',
      credential: { host: CHOREO_SAMPLES_REGISTRY_HOST },
    }),
  });
  if (!res.ok) throw new Error(`Failed to create container registry (${res.status})`);
  const json = await res.json();
  return json?.data as ContainerRegistry;
}

export async function getOrCreateSampleRegistry(orgUuid: string): Promise<ContainerRegistry> {
  const registries = await getContainerRegistries(orgUuid);
  const existing = registries.find((r) => r.host === CHOREO_SAMPLES_REGISTRY_HOST);
  if (existing) return existing;
  return createContainerRegistry(orgUuid);
}

export async function callCreateCodeServer(params: { userId: string; organizationId: string; projectId: string; componentId: string; orgHandle: string; imageUrl: string; registryId: string; sourceCommitHash?: string }): Promise<string> {
  const { userId, organizationId, projectId, componentId, orgHandle, imageUrl, registryId, sourceCommitHash } = params;
  const result = await gql<{ createCodeServer: string }>(
    `mutation { createCodeServer(codeServer: {
      userId: "${userId}",
      organizationId: "${organizationId}",
      projectId: "${projectId}",
      componentId: "${componentId}",
      orgHandle: "${orgHandle}",
      imageUrl: "${imageUrl}",
      registryId: "${registryId}",
      ${sourceCommitHash ? `sourceCommitHash: "${sourceCommitHash}",` : ''}
    }) }`,
  );
  if (!result.createCodeServer) throw new Error('No editor URL returned from server');
  return result.createCodeServer;
}
