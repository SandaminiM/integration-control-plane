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

import { ConnectionType } from '@wso2/cell-diagram';
import type { Project as DiagramProject, Observations, Connection } from '@wso2/cell-diagram';
import type { Component } from '../../types/component';
import type { ProjectMetricsLink, ProjectMetricsModel } from '../../types/observability';

// Port of Devant's cellDiagramUtils (hooks/observability/cellDiagramUtils.ts):
// classify each link of the project HTTP-metrics graph by its source node type,
// then attach the per-link observations to the cell-diagram model — gateway
// sources land on the target component's internet/intranet gateway, and
// component-to-component links become observation-only connections on the source.

const EXTERNAL_SOURCE_TYPES = new Set([
  'ChoreoConnectExternal',
  'external-gateway',
  'scale-to-zero-interceptor',
  'IngressControllerWebapps',
  'webapps-gateway',
  // legacy observability data start node type
  'ChoreoConnect',
]);
const INTERNAL_SOURCE_TYPES = new Set(['ChoreoConnectInternal', 'internal-gateway']);

interface ComponentObservation {
  fromInternet: Observations[];
  fromIntranet: Observations[];
  /** target componentId → observations on that edge */
  connections: Map<string, Observations[]>;
}

function toObservation(link: ProjectMetricsLink, componentVersion: string): Observations {
  return {
    componentVersion,
    sourceNodeId: link.sourceNodeId,
    destinationNodeId: link.destinationNodeId,
    requestCount: link.requestCount,
    errorCount: link.errorCount,
    avgLatency: link.avgLatency,
    p50Latency: link.p50Latency,
    p90Latency: link.p90Latency,
    p99Latency: link.p99Latency,
  };
}

export function buildObservabilityMap(model: ProjectMetricsModel | null): Map<string, ComponentObservation> {
  const byComponent = new Map<string, ComponentObservation>();
  if (!model?.nodeList || !model.linkList) return byComponent;

  const nodeInfo = new Map<number, { componentId: string; version: string; type: string }>();
  model.nodeList.forEach((node) => {
    if (node.componentId) nodeInfo.set(node.nodeId, { componentId: node.componentId, version: node.apiVersion ?? '', type: node.nodeType });
  });
  const nodeType = new Map<number, string>();
  model.nodeList.forEach((node) => nodeType.set(node.nodeId, node.nodeType));

  const entry = (componentId: string): ComponentObservation => {
    let existing = byComponent.get(componentId);
    if (!existing) {
      existing = { fromInternet: [], fromIntranet: [], connections: new Map() };
      byComponent.set(componentId, existing);
    }
    return existing;
  };

  model.linkList.forEach((link) => {
    const target = nodeInfo.get(link.destinationNodeId);
    if (!target) return;
    const source = nodeInfo.get(link.sourceNodeId);
    const sourceType = source?.type ?? nodeType.get(link.sourceNodeId) ?? '';

    if (EXTERNAL_SOURCE_TYPES.has(sourceType)) {
      entry(target.componentId).fromInternet.push(toObservation(link, target.version));
    } else if (INTERNAL_SOURCE_TYPES.has(sourceType)) {
      entry(target.componentId).fromIntranet.push(toObservation(link, target.version));
    } else if (source) {
      const sourceEntry = entry(source.componentId);
      const list = sourceEntry.connections.get(target.componentId) ?? [];
      list.push(toObservation(link, target.version));
      sourceEntry.connections.set(target.componentId, list);
    }
  });

  return byComponent;
}

/** Overlay the observability data onto a diagram project model built by
 * `buildProjectModel` (ArchitectureCard). Returns a new model. */
export function applyObservability(project: DiagramProject, model: ProjectMetricsModel | null, components: Component[]): DiagramProject {
  const byComponent = buildObservabilityMap(model);
  return {
    ...project,
    components: project.components.map((diagramComponent) => {
      const obs = byComponent.get(diagramComponent.id);
      if (!obs) return diagramComponent;

      const services = Object.fromEntries(
        Object.entries(diagramComponent.services ?? {}).map(([serviceId, service]) => [
          serviceId,
          {
            ...service,
            deploymentMetadata: {
              gateways: {
                internet: {
                  ...(service.deploymentMetadata?.gateways.internet ?? { isExposed: false }),
                  ...(obs.fromInternet.length > 0 ? { observations: obs.fromInternet } : {}),
                },
                intranet: {
                  ...(service.deploymentMetadata?.gateways.intranet ?? { isExposed: false }),
                  ...(obs.fromIntranet.length > 0 ? { observations: obs.fromIntranet } : {}),
                },
              },
            },
          },
        ]),
      );

      const observedConnections: Connection[] = [...obs.connections.entries()].map(([targetComponentId, observations]) => ({
        id: `observed:${targetComponentId}`,
        label: components.find((c) => c.id === targetComponentId)?.displayName ?? targetComponentId,
        type: ConnectionType.HTTP,
        onPlatform: true,
        observations,
        observationOnly: true,
      }));

      return { ...diagramComponent, services, connections: [...(diagramComponent.connections ?? []), ...observedConnections] };
    }),
  };
}
