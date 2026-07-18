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
import { CellDiagram, DiagramLayer } from '@wso2/cell-diagram';
import type { Project as DiagramProject } from '@wso2/cell-diagram';
import { memo, useMemo, useState } from 'react';
import type { Component } from '../types/component';
import { buildProjectModel } from './Observability/diagramUtils';
import type { JSX } from 'react';

const EMPTY_MENU: never[] = [];

const CellDiagramPreview = memo(function CellDiagramPreview({ project, refreshKey: _ }: { project: DiagramProject; refreshKey: number }) {
  return <CellDiagram project={project} componentMenu={EMPTY_MENU} defaultDiagramLayer={DiagramLayer.ARCHITECTURE} previewMode />;
});

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
