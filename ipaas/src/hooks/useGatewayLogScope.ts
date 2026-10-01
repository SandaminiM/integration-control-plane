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

import { useMemo } from 'react';
import { useComponentDeployment, useEnvEndpoints } from './useDeployments';
import { useEndpointSecurities } from './useConsumers';
import { IS_CLOUD } from '../features';
import { endpointContextPath, gatewayFrontedEndpoints, longestCommonPrefix } from '../utils/gatewayLogs';
import type { ComponentDetail } from '../types/component';
import type { GatewayLogEndpoint } from '../types/logs';

/** What an integration needs before its gateway traffic can be read: the endpoints the gateway fronts, and their paths. */
export interface GatewayLogScope {
  endpoints: GatewayLogEndpoint[];
  /** The endpoints' shared path prefix, matched against the log line — the only narrowing the log backend offers. */
  searchPrefix: string;
  /** False when nothing is exposed through the gateway, or on a product with no observability proxy. */
  available: boolean;
  /** True while the lookups that decide `available` are still in flight. */
  resolving: boolean;
}

// An endpoint's path is the same in every environment, so the environment given here only has to have it deployed.
export function useGatewayLogScope(orgHandler: string, orgUuid: string, component: ComponentDetail | null | undefined, environmentId: string): GatewayLogScope {
  const versionId = useMemo(() => {
    const versions = component?.apiVersions ?? [];
    return (versions.find((v) => v.latest) ?? versions[0])?.id ?? '';
  }, [component]);

  // The endpoint is the signal, not the type: wire type names differ from the console's vocabulary.
  const { data: deployment, isLoading: loadingDeployment } = useComponentDeployment(IS_CLOUD ? orgHandler : '', orgUuid, component?.id ?? '', versionId, environmentId);
  const releaseId = deployment?.releaseId ?? '';
  const { data: envEndpoints = [], isLoading: loadingEndpoints } = useEnvEndpoints(IS_CLOUD ? (component?.id ?? '') : '', versionId, releaseId);

  const fronted = useMemo(() => (IS_CLOUD ? gatewayFrontedEndpoints(envEndpoints) : []), [envEndpoints]);
  const refs = useMemo(() => (component ? fronted.map((e) => ({ componentName: component.id, environmentName: environmentId, endpointName: e.id })) : []), [component, fronted, environmentId]);
  const securities = useEndpointSecurities(refs);
  const publicUrlsKey = securities.map((q) => q.data?.publicUrl ?? '').join('|');

  // An API exposed through the platform gateway has no external URL on the release, only the security publicUrl.
  const endpoints = useMemo<GatewayLogEndpoint[]>(
    () => fronted.map((e, i) => ({ id: e.id, displayName: e.displayName || e.id, contextPath: endpointContextPath(e.apiContext, securities[i]?.data?.publicUrl || e.publicUrl) })).filter((e) => e.contextPath !== ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fronted, publicUrlsKey],
  );
  const searchPrefix = useMemo(() => longestCommonPrefix(endpoints.map((e) => e.contextPath)), [endpoints]);

  const resolving = loadingDeployment || loadingEndpoints || securities.some((q) => q.isLoading);

  return { endpoints, searchPrefix, available: IS_CLOUD && searchPrefix !== '', resolving };
}
