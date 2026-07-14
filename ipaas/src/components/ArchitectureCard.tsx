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

import { Card, CardContent, CircularProgress, IconButton, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { GitBranch, RefreshCw } from '@wso2/oxygen-ui-icons-react';
import { CellDiagram, ComponentType, DiagramLayer } from '@wso2/cell-diagram';
import type { Project as DiagramProject, Component as DiagramComponent, Services } from '@wso2/cell-diagram';
import { memo, useMemo, useState } from 'react';
import type { Component } from '../types/component';
import type { JSX } from 'react';

const EMPTY_MENU: never[] = [];

const CellDiagramPreview = memo(function CellDiagramPreview({ project, refreshKey: _ }: { project: DiagramProject; refreshKey: number }) {
  return <CellDiagram project={project} componentMenu={EMPTY_MENU} defaultDiagramLayer={DiagramLayer.ARCHITECTURE} previewMode />;
});

function getComponentType(displayType: string, componentSubType: string | null): ComponentType | null {
  if (componentSubType === 'ballerinaFileIntegration' || componentSubType === 'miFileIntegration') {
    return ComponentType.EVENT_HANDLER;
  }
  if (componentSubType === 'aiAgent' || componentSubType === 'mcpServer') {
    return null;
  }
  switch (displayType) {
    case 'ballerinaService':
    case 'buildpackService':
    case 'byoiService':
    case 'byocService':
    case 'miApiService':
    case 'graphql':
    case 'thirdPartyApi':
    case 'prismMockService':
    case 'service':
    case 'restApi':
    case 'byocRestApi':
    case 'miRestApi':
    case 'buildRestApi':
      return ComponentType.SERVICE;
    case 'scheduledTask':
    case 'byocCronjob':
    case 'byoiCronjob':
    case 'miCronjob':
    case 'buildpackCronJob':
      return ComponentType.SCHEDULED_TASK;
    case 'manualTrigger':
    case 'byocJob':
    case 'byoiJob':
    case 'miJob':
    case 'buildpackJob':
      return ComponentType.MANUAL_TASK;
    case 'proxy':
    case 'gitProxy':
      return ComponentType.API_PROXY;
    case 'webhook':
    case 'byocWebhook':
    case 'miWebhook':
    case 'buildpackWebhook':
    case 'ballerinaWebhook':
      return ComponentType.WEB_HOOK;
    case 'byocEventHandler':
    case 'miEventHandler':
    case 'buildpackEventHandler':
    case 'ballerinaEventHandler':
      return ComponentType.EVENT_HANDLER;
    case 'byocWebApp':
    case 'byocWebAppsDockerfileLess':
    case 'byoiWebApp':
    case 'buildpackWebApp':
      return ComponentType.WEB_APP;
    case 'byocTestRunner':
    case 'buildpackTestRunner':
    case 'byocTestRunnerDockerfileLess':
      return ComponentType.TEST;
    case 'externalConsumer':
      return ComponentType.EXTERNAL_CONSUMER;
    default:
      return null;
  }
}

function getDefaultServices(componentId: string, componentType: ComponentType): Services {
  if (componentType === ComponentType.SCHEDULED_TASK || componentType === ComponentType.MANUAL_TASK || componentType === ComponentType.TEST || componentType === ComponentType.EXTERNAL_CONSUMER) {
    return {};
  }

  if (componentType === ComponentType.WEB_APP) {
    const serviceId = `${componentId}:web-app`;
    return {
      [serviceId]: {
        id: serviceId,
        label: 'Web App',
        type: 'http',
        dependencyIds: [],
        deploymentMetadata: {
          gateways: {
            internet: { isExposed: true },
            intranet: { isExposed: false },
          },
        },
      },
    };
  }

  if (componentType === ComponentType.WEB_HOOK || componentType === ComponentType.EVENT_HANDLER || componentType === ComponentType.API_PROXY) {
    const serviceId = `${componentId}:endpoint`;
    return {
      [serviceId]: {
        id: serviceId,
        label: 'Endpoint',
        type: 'http',
        dependencyIds: [],
        deploymentMetadata: {
          gateways: {
            internet: { isExposed: false },
            intranet: { isExposed: true },
          },
        },
      },
    };
  }

  const serviceId = `${componentId}:service`;
  return {
    [serviceId]: {
      id: serviceId,
      label: 'Service',
      type: 'http',
      dependencyIds: [],
      deploymentMetadata: {
        gateways: {
          internet: { isExposed: true },
          intranet: { isExposed: false },
        },
      },
    },
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildProjectModel(projectId: string, components: Component[]): DiagramProject {
  const diagramComponents: DiagramComponent[] = components
    .map((c): DiagramComponent | null => {
      const type = getComponentType(c.displayType ?? '', c.componentSubType ?? null);
      if (type === null) return null;
      return {
        id: c.id,
        label: c.displayName,
        version: c.version ?? '1.0.0',
        type,
        services: getDefaultServices(c.id, type),
        connections: [],
      };
    })
    .filter((c): c is DiagramComponent => c !== null);

  return {
    id: projectId,
    name: '',
    components: diagramComponents,
    modelVersion: '2.0',
  };
}

export default function ArchitectureCard({ projectId, components, isLoading, isRefreshing, onRefresh }: { projectId: string; components: Component[]; isLoading: boolean; isRefreshing: boolean; onRefresh: () => void }): JSX.Element {
  const project = useMemo(() => buildProjectModel(projectId, components), [projectId, components]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    onRefresh();
    setRefreshKey((k) => k + 1);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <GitBranch size={20} aria-hidden="true" />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, ml: 1, flex: 1 }}>
            Architecture
          </Typography>
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              aria-label="Refresh architecture"
              onClick={handleRefresh}
              disabled={isRefreshing}
              sx={
                isRefreshing
                  ? {
                      '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                      '& svg': { animation: 'spin 1s linear infinite' },
                    }
                  : undefined
              }>
              <RefreshCw size={14} />
            </IconButton>
          </Tooltip>
        </Stack>

        <div style={{ width: '100%', height: 250, overflow: 'hidden', cursor: 'default' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <CircularProgress size={32} color="primary" />
            </div>
          ) : components.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                No integrations found
              </Typography>
            </div>
          ) : (
            <CellDiagramPreview project={project} refreshKey={refreshKey} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
