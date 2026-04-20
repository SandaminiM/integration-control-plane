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

import { Box, CircularProgress, Divider, PageContent } from '@wso2/oxygen-ui';
import { Fragment, useEffect, useMemo, useState, type JSX } from 'react';
import { useProject, useProjectByHandler, useComponentByHandler, useEnvironments, useCommitHistory, useComponentEndpoints, useApimApi } from '../api/queries';
import BusinessInfo from '../components/BusinessInfo';
import NotFound from '../components/NotFound';
import { ArtifactDetail } from '../components/ArtifactDetail';
import Environment from '../components/EnvironmentCard';
import PromoteButton from '../components/EnvironmentCard/PromoteButton';
import ComponentHeader from '../components/ComponentHeader';
import DeploymentTrackBar from '../components/DeploymentTrackBar';
import type { SelectedArtifact } from '../components/artifact-config';
import { resourceUrl, broaden, type ComponentScope } from '../nav';
import { useLoadComponentPermissions } from '../hooks/usePermissionLoader';
import BuildCard from '../components/BuildCard';
import { UUID_RE } from '../utils/string';

export default function Component(scope: ComponentScope): JSX.Element {
  // Support both UUID and handler in the URL — only one query will be enabled at a time
  const isUuid = UUID_RE.test(scope.project);
  const { data: projectByHandler, isLoading: loadingByHandler } = useProjectByHandler(scope.project);
  const { data: projectById, isLoading: loadingById } = useProject(isUuid ? scope.project : '');
  const project = projectByHandler ?? projectById;
  const loadingProject = isUuid ? loadingById : loadingByHandler;
  const projectId = project?.id ?? '';
  const { data: component, isLoading: loadingComponent } = useComponentByHandler(projectId, scope.component);
  const { data: environments = [] } = useEnvironments(scope.org, projectId);
  const repository = component?.repository ?? null;
  const { data: commits = [] } = useCommitHistory(component?.id ?? '', repository?.branch ?? '');

  const tracks = useMemo(() => component?.deploymentTracks ?? [], [component?.deploymentTracks]);
  const [selectedTrackId, setSelectedTrackId] = useState('');

  // Initialise / sync selected track when component loads or tracks change
  useEffect(() => {
    if (!tracks.length) return;
    setSelectedTrackId((prev) => {
      if (prev && tracks.some((t) => t.id === prev)) return prev;
      return tracks.find((t) => t.latest)?.id ?? tracks[0].id;
    });
  }, [component?.id, tracks]);

  const versionId = selectedTrackId;

  const { data: endpoints = [] } = useComponentEndpoints(component?.id ?? '', versionId);
  const apimId = endpoints.find((e) => e.apimId)?.apimId ?? null;
  const { data: apimApiInfo } = useApimApi(apimId);
  const [selectedArtifact, setSelectedArtifact] = useState<SelectedArtifact | null>(null);

  // Load component permissions using the UUID - only when component is loaded
  useLoadComponentPermissions(scope.org, projectId, component?.id || '');

  const isLoading = loadingProject || loadingComponent;
  if (isLoading)
    return (
      <PageContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </PageContent>
    );
  if (!component) return <NotFound message="Component not found" backTo={resourceUrl(broaden(scope)!, 'overview')} backLabel="Back to Project" />;

  const displayType = component.displayType ?? '';
  const latestCommit = commits.find((c) => c.isLatest) ?? commits[0] ?? null;

  return (
    <>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <Box sx={{ position: 'relative', overflow: 'hidden', flex: 1 }}>
        {/* Deployment track bar */}
        {tracks.length > 0 && <DeploymentTrackBar tracks={tracks} selectedId={versionId} onChange={setSelectedTrackId} orgHandler={scope.org} projectHandler={project?.handler ?? ''} componentHandler={component.handler} />}

        <PageContent>
          {/* Component header */}
          <ComponentHeader component={component} project={project} repository={repository} latestCommit={latestCommit} orgHandler={scope.org} projectId={projectId} apimId={apimId} />

          {/* Latest build card */}
          <BuildCard componentId={component.id} versionId={versionId} orgHandler={scope.org} projectId={projectId} latestCommit={latestCommit} />

          <Divider sx={{ mb: 3 }} />

          {/* Environment cards with Promote between them */}
          {environments.map((env, index) => (
            <Fragment key={env.id}>
              <Environment
                env={env}
                prevEnv={index > 0 ? environments[index - 1] : undefined}
                componentId={component.id}
                projectId={projectId}
                componentType={component.componentType ?? ''}
                displayType={displayType}
                componentHandler={component.handler}
                projectHandler={project?.handler ?? ''}
                orgHandler={scope.org}
                versionId={versionId}
                deploymentPipelineId={project?.defaultDeploymentPipelineId ?? ''}
                latestCommit={latestCommit}
                apiId={component.apiId}
              />
              {index < environments.length - 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <PromoteButton orgHandler={scope.org} componentId={component.id} versionId={versionId} deploymentPipelineId={project?.defaultDeploymentPipelineId ?? ''} sourceEnvId={env.id} targetEnvId={environments[index + 1].id} />
                </Box>
              )}
            </Fragment>
          ))}

          {/* Subscription Plans, Documents, and Compliance cards — shown for API-enabled components */}
          {apimId && (
            <BusinessInfo
              projectId={projectId}
              componentId={component.id}
              apimId={apimId}
              apimApiInfo={apimApiInfo}
              activePolicies={apimApiInfo?.policies ?? []}
              docsPath={`/organizations/${scope.org}/projects/${projectId}/components/${component.handler}/documents`}
            />
          )}
        </PageContent>
        <ArtifactDetail selected={selectedArtifact} onClose={() => setSelectedArtifact(null)} />
      </Box>
    </>
  );
}
