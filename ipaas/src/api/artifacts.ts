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
import { toBackendArtifactType } from './artifactToggleMutations';
import type { GqlArtifactType, GqlArtifact, GqlArtifactParam, ArtifactStatusInput, ListenerStateInput } from '../types/artifact';

export const ARTIFACT_QUERY_MAP: Record<string, { queryName: string; field: string; fields: string; gqlFields: string }> = {
  RestApi: {
    queryName: 'restApisByEnvironmentAndComponent',
    field: 'restApisByEnvironmentAndComponent',
    fields: 'name, context, version, state',
    gqlFields: 'name, context, version, state, tracing, statistics, carbonApp, url, runtimes { runtimeId, status }, resources { path, methods }',
  },
  ProxyService: { queryName: 'proxyServicesByEnvironmentAndComponent', field: 'proxyServicesByEnvironmentAndComponent', fields: 'name, state', gqlFields: 'name, state, tracing, statistics, carbonApp, endpoints, runtimes { runtimeId, status }' },
  Endpoint: { queryName: 'endpointsByEnvironmentAndComponent', field: 'endpointsByEnvironmentAndComponent', fields: 'name, type, state', gqlFields: 'name, type, state, tracing, statistics, attributes { name, value }, runtimes { runtimeId, status }' },
  InboundEndpoint: {
    queryName: 'inboundEndpointsByEnvironmentAndComponent',
    field: 'inboundEndpointsByEnvironmentAndComponent',
    fields: 'name, protocol',
    gqlFields: 'name, protocol, sequence, onError, state, tracing, statistics, carbonApp, runtimes { runtimeId, status }',
  },
  Sequence: { queryName: 'sequencesByEnvironmentAndComponent', field: 'sequencesByEnvironmentAndComponent', fields: 'name, type, container, state', gqlFields: 'name, type, container, state, tracing, statistics, runtimes { runtimeId, status }' },
  Task: { queryName: 'tasksByEnvironmentAndComponent', field: 'tasksByEnvironmentAndComponent', fields: 'name, group, state', gqlFields: 'name, class, group, state, carbonApp, runtimes { runtimeId, status }' },
  LocalEntry: { queryName: 'localEntriesByEnvironmentAndComponent', field: 'localEntriesByEnvironmentAndComponent', fields: 'name, type', gqlFields: 'name, type, value, state, runtimes { runtimeId, status }' },
  CarbonApp: { queryName: 'carbonAppsByEnvironmentAndComponent', field: 'carbonAppsByEnvironmentAndComponent', fields: 'name, version', gqlFields: 'name, version, state, artifacts { name, type }, runtimes { runtimeId, status }' },
  Connector: { queryName: 'connectorsByEnvironmentAndComponent', field: 'connectorsByEnvironmentAndComponent', fields: 'name, package, state', gqlFields: 'name, package, version, state, runtimes { runtimeId, status }' },
  RegistryResource: { queryName: 'registryResourcesByEnvironmentAndComponent', field: 'registryResourcesByEnvironmentAndComponent', fields: 'name, type', gqlFields: 'name, type, runtimes { runtimeId, status }' },
  Listener: { queryName: 'listenersByEnvironmentAndComponent', field: 'listenersByEnvironmentAndComponent', fields: 'name, package, protocol, host, port, state', gqlFields: 'name, package, protocol, host, port, state, runtimes { runtimeId, status }' },
  Service: {
    queryName: 'servicesByEnvironmentAndComponent',
    field: 'servicesByEnvironmentAndComponent',
    fields: 'name, package, basePath, type',
    gqlFields: 'name, package, basePath, type, runtimes { runtimeId, status }, resources { path, method, url, methods }',
  },
  Automation: {
    queryName: 'automationsByEnvironmentAndComponent',
    field: 'automationsByEnvironmentAndComponent',
    fields: 'packageOrg, packageName, packageVersion',
    gqlFields: 'packageOrg, packageName, packageVersion, runtimeIds, runtimes { runtimeId, status }, executionTimestamp',
  },
  MessageStore: {
    queryName: 'messageStoresByEnvironmentAndComponent',
    field: 'messageStoresByEnvironmentAndComponent',
    fields: 'name, type, size',
    gqlFields: 'name, type, size, carbonApp, runtimes { runtimeId, status }',
  },
  MessageProcessor: {
    queryName: 'messageProcessorsByEnvironmentAndComponent',
    field: 'messageProcessorsByEnvironmentAndComponent',
    fields: 'name, type, state',
    gqlFields: 'name, type, state, tracing, carbonApp, runtimes { runtimeId, status }',
  },
  Template: {
    queryName: 'templatesByEnvironmentAndComponent',
    field: 'templatesByEnvironmentAndComponent',
    fields: 'name, type',
    gqlFields: 'name, type, tracing, statistics, carbonApp, runtimes { runtimeId, status }',
  },
  DataService: {
    queryName: 'dataServicesByEnvironmentAndComponent',
    field: 'dataServicesByEnvironmentAndComponent',
    fields: 'name, state',
    gqlFields: 'name, description, state, carbonApp, runtimes { runtimeId, status }',
  },
  DataSource: {
    queryName: 'dataSourcesByEnvironmentAndComponent',
    field: 'dataSourcesByEnvironmentAndComponent',
    fields: 'name, type, state',
    gqlFields: 'name, type, driver, url, username, state, runtimes { runtimeId, status }',
  },
};

const ARTIFACT_SOURCE_QUERY = `
  query GetArtifactSource($environmentId: String!, $componentId: String!, $artifactType: String!, $artifactName: String!) {
    artifactSourceByComponent(environmentId: $environmentId, componentId: $componentId, artifactType: $artifactType, artifactName: $artifactName)
  }`;

const LOCAL_ENTRY_VALUE_QUERY = `
  query LocalEntryValue($componentId: String!, $entryName: String!, $environmentId: String) {
    localEntryValueByComponent(componentId: $componentId, entryName: $entryName, environmentId: $environmentId)
  }`;

const ARTIFACT_PARAMS_QUERY = `
  query ArtifactParams($componentId: String!, $artifactType: String!, $artifactName: String!, $environmentId: String, $runtimeId: String) {
    artifactParametersByComponent(
      componentId: $componentId,
      artifactType: $artifactType,
      artifactName: $artifactName,
      environmentId: $environmentId,
      runtimeId: $runtimeId
    ) {
      name
      value
    }
  }`;

const ARTIFACT_WSDL_QUERY = `
  query ArtifactWsdl($componentId: String!, $artifactType: String!, $artifactName: String!, $environmentId: String, $runtimeId: String) {
    artifactWsdlByComponent(
      componentId: $componentId,
      artifactType: $artifactType,
      artifactName: $artifactName,
      environmentId: $environmentId,
      runtimeId: $runtimeId
    )
  }`;

const UPDATE_ARTIFACT_STATUS = `
  mutation UpdateArtifactStatus($input: ArtifactStatusChangeInput!) {
    updateArtifactStatus(input: $input) {
      status, message, successCount, failedCount, details
    }
  }`;

const UPDATE_LISTENER_STATE = `
  mutation UpdateListenerState($input: ListenerControlInput!) {
    updateListenerState(input: $input) {
      success, message, commandIds
    }
  }`;

export async function fetchArtifactTypes(componentId: string, envId: string): Promise<GqlArtifactType[]> {
  return gql<{ componentArtifactTypes: GqlArtifactType[] }>(
    `query ComponentArtifactTypes($componentId: String!, $environmentId: String!) {
      componentArtifactTypes(componentId: $componentId, environmentId: $environmentId) {
        artifactType, artifactCount
      }
    }`,
    { componentId, environmentId: envId },
  ).then((d) => d.componentArtifactTypes);
}

export async function fetchArtifacts(artifactType: string, envId: string, componentId: string): Promise<GqlArtifact[]> {
  const mapping = ARTIFACT_QUERY_MAP[artifactType];
  if (!mapping) return [];
  const data = await gql<Record<string, GqlArtifact[]>>(`query ArtifactQuery($environmentId: String!, $componentId: String!) { ${mapping.field}(environmentId: $environmentId, componentId: $componentId) { ${mapping.gqlFields} } }`, {
    environmentId: envId,
    componentId,
  }).catch(() => ({}) as Record<string, GqlArtifact[]>);
  return data[mapping.field] ?? [];
}

export async function fetchArtifactSource(envId: string, componentId: string, artifactType: string, artifactName: string): Promise<string> {
  return gql<{ artifactSourceByComponent: string }>(ARTIFACT_SOURCE_QUERY, { environmentId: envId, componentId, artifactType, artifactName }).then((d) => d.artifactSourceByComponent);
}

export async function fetchLocalEntryValue(componentId: string, entryName: string, envId: string): Promise<string> {
  return gql<{ localEntryValueByComponent: string }>(LOCAL_ENTRY_VALUE_QUERY, { componentId, entryName, environmentId: envId }).then((d) => d.localEntryValueByComponent);
}

export async function fetchArtifactParams(componentId: string, artifactType: string, artifactName: string, envId: string, runtimeId?: string): Promise<GqlArtifactParam[]> {
  return gql<{ artifactParametersByComponent: GqlArtifactParam[] }>(ARTIFACT_PARAMS_QUERY, { componentId, artifactType, artifactName, environmentId: envId, runtimeId }).then((d) => d.artifactParametersByComponent);
}

export async function fetchArtifactWsdl(componentId: string, artifactType: string, artifactName: string, envId: string, runtimeId?: string): Promise<string> {
  return gql<{ artifactWsdlByComponent: string }>(ARTIFACT_WSDL_QUERY, { componentId, artifactType, artifactName, environmentId: envId, runtimeId }).then((d) => d.artifactWsdlByComponent);
}

export async function updateArtifactStatus(input: ArtifactStatusInput): Promise<{ status: string; message: string }> {
  return gql<{ updateArtifactStatus: { status: string; message: string } }>(UPDATE_ARTIFACT_STATUS, {
    input: { componentId: input.componentId, artifactType: toBackendArtifactType(input.artifactType), artifactName: input.artifactName, status: input.status },
  }).then((d) => d.updateArtifactStatus);
}

export async function updateListenerState(input: ListenerStateInput): Promise<{ success: boolean; message: string; commandIds: string[] }> {
  return gql<{ updateListenerState: { success: boolean; message: string; commandIds: string[] } }>(UPDATE_LISTENER_STATE, {
    input: { runtimeIds: input.runtimeIds, listenerName: input.listenerName, action: input.action },
  }).then((d) => d.updateListenerState);
}
