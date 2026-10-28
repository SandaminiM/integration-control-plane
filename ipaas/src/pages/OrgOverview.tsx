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

import { useMemo, useState, type JSX, type ReactNode } from 'react';
import { useAuth } from '../auth';
import { Alert, Avatar, Box, Button, ButtonBase, Card, Chip, Divider, PageContent, Skeleton, Stack, Typography } from '@wso2/oxygen-ui';
import { ArrowRight, Clock, Folder, Layers, Plus, Sparkles, Workflow } from '@wso2/oxygen-ui-icons-react';
import Authorized from '../components/Authorized';
import EmptyListing from '../components/EmptyListing';
import ExploreMore from '../components/ExploreMore';
import CatalogDialog from '../components/OrgOverview/CatalogDialog';
import ProjectPickerDialog from '../components/OrgOverview/ProjectPickerDialog';
import { getDisplayLabel } from '../constants/integrations';
import { Permissions } from '../constants/permissions';
import { AI_SERVICES_GROUP, RESOURCES_GROUP, type CatalogGroup } from '../constants/orgCatalog';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { useOrgComponents } from '../hooks/useComponents';
import { useProjects } from '../hooks/useProjects';
import { newComponentUrl, newProjectUrl, type OrgScope } from '../nav';
import { componentOverviewUrl, orgHomeUrl, projectHomeUrl } from '../paths';
import type { Component } from '../types/component';
import type { Project } from '../types/project';
import { readRecent, recentComponentKey, recentProjectKey } from '../utils/recentAccess';
import { formatDistanceToNow } from '../utils/time';
import * as styles from './OrgOverview.styles';

const LIST_SIZE = 5;

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  /** Omitted while the count is loading or has no backend to come from. */
  count?: number;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}

function SummaryCard({ icon, title, count, description, actionLabel, onAction }: SummaryCardProps): JSX.Element {
  return (
    <Card sx={styles.summaryCard}>
      <Box sx={styles.summaryBody}>
        <Box sx={styles.iconTile}>{icon}</Box>
        <Box>
          <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography fontWeight={600} sx={styles.summaryTitle}>
              {title}
            </Typography>
            {count !== undefined && (
              <Typography variant="body2" color="text.secondary" sx={styles.countDivider}>
                {count}
              </Typography>
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <Button fullWidth disabled={!onAction} onClick={onAction} endIcon={<ArrowRight size={16} />} sx={styles.summaryAction}>
        {actionLabel}
      </Button>
    </Card>
  );
}

function ProjectRow({ project, integrations, onOpen }: { project: Project; integrations?: number; onOpen: () => void }): JSX.Element {
  return (
    <ButtonBase onClick={onOpen} disabled={project.deleting} sx={{ ...styles.listRow, opacity: project.deleting ? 0.38 : 1 }}>
      <Avatar variant="rounded" sx={styles.projectAvatar}>
        {project.name[0].toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {project.name}
        </Typography>
        {project.description && (
          <Typography variant="caption" color="text.secondary" noWrap component="p">
            {project.description}
          </Typography>
        )}
      </Box>
      <Box sx={styles.rowMeta}>
        <Typography variant="body2" noWrap sx={styles.integrationsColumn}>
          {integrations === undefined ? '' : integrations === 1 ? '1 Integration' : `${integrations} Integrations`}
        </Typography>
        <Stack direction="row" alignItems="center" gap={0.75} sx={styles.updatedColumn}>
          <Clock size={14} />
          <Typography variant="body2" noWrap>
            {project.deleting ? 'Deleting' : formatDistanceToNow(project.updatedAt)}
          </Typography>
        </Stack>
      </Box>
    </ButtonBase>
  );
}

function RowsSkeleton(): JSX.Element {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={styles.listRow}>
          <Skeleton variant="rounded" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="30%" />
            <Skeleton width="20%" />
          </Box>
          <Skeleton width={120} />
        </Box>
      ))}
    </>
  );
}

interface RecentIntegration {
  component: Component;
  project: Project;
  accessedAt: string;
}

/** The user's most recently opened integrations that still exist, newest visit first. */
function recentIntegrations(org: string, userId: string, projects: Project[], byProject: Map<string, Component[] | undefined>): RecentIntegration[] {
  const byKey = new Map(projects.flatMap((project) => (byProject.get(project.id) ?? []).map((component) => [recentComponentKey(org, project.handler, component.handler), { component, project }] as const)));
  return readRecent(userId, 'components')
    .flatMap(({ key, at }) => {
      const found = byKey.get(key);
      return found ? [{ ...found, accessedAt: new Date(at).toISOString() }] : [];
    })
    .slice(0, LIST_SIZE);
}

export default function OrgOverview(scope: OrgScope): JSX.Element {
  const navigate = useAppNavigate();
  const [catalog, setCatalog] = useState<CatalogGroup | null>(null);
  const [pickingProject, setPickingProject] = useState(false);
  const { userId, displayName, username } = useAuth();
  const { data: projects = [], isLoading, isError, refetch } = useProjects();
  const { byProject, isLoading: loadingIntegrations } = useOrgComponents(
    scope.org,
    projects.map((p) => p.id),
  );

  const firstName = (displayName || username).split(/[\s@]/)[0];
  const openProjects = projects.filter((p) => !p.deleting);
  const integrationCount = loadingIntegrations ? undefined : [...byProject.values()].reduce((sum, list) => sum + (list?.length ?? 0), 0);
  const recent = useMemo(() => recentIntegrations(scope.org, userId, projects, byProject), [scope.org, userId, projects, byProject]);

  // The most recently opened project first, so the picker can preselect it.
  const pickerProjects = useMemo(() => {
    const rank = new Map(readRecent(userId, 'projects').map(({ key }, i) => [key, i]));
    const rankOf = (p: Project) => rank.get(recentProjectKey(scope.org, p.handler)) ?? Number.MAX_SAFE_INTEGER;
    return [...openProjects].sort((a, b) => rankOf(a) - rankOf(b));
  }, [openProjects, userId, scope.org]);

  // Integrations live in a project, so the user picks one only when there is a choice to make.
  const createIntegration = () => {
    if (openProjects.length === 0) navigate(newProjectUrl(scope));
    else if (openProjects.length === 1) navigate(newComponentUrl({ org: scope.org, project: openProjects[0].handler }));
    else setPickingProject(true);
  };

  const listed = projects.slice(0, LIST_SIZE);

  const renderProjects = (): ReactNode => {
    if (isLoading) return <RowsSkeleton />;
    if (isError)
      return (
        <Alert severity="error" sx={{ m: 2.5 }} action={<Button onClick={() => refetch()}>Retry</Button>}>
          Could not load the projects.
        </Alert>
      );
    if (projects.length === 0) return <EmptyListing icon={<Folder size={48} />} title="No projects yet" description="Create a project to start building integrations." />;
    return (
      <>
        {listed.map((p) => (
          <ProjectRow key={p.id} project={p} integrations={byProject.get(p.id)?.length} onOpen={() => navigate(projectHomeUrl(scope.org, p.handler))} />
        ))}
        <Box sx={styles.allProjectsRow}>
          <Button endIcon={<ArrowRight size={16} />} onClick={() => navigate(orgHomeUrl(scope.org))} sx={styles.allProjectsLink}>
            All Projects
          </Button>
        </Box>
      </>
    );
  };

  return (
    <PageContent>
      <Typography variant="h3" sx={styles.greeting}>
        <Box component="span" sx={{ color: 'primary.main' }}>
          Hello,
        </Box>{' '}
        {firstName}
      </Typography>
      <Typography color="text.secondary" sx={styles.intro}>
        Connect your systems, automate workflows, and build AI-powered integrations, then deploy and run them on one platform.
      </Typography>

      <Box sx={styles.summaryGrid}>
        <SummaryCard
          icon={<Workflow size={24} />}
          title="Integrations"
          count={integrationCount}
          description="Connect applications, data, and services through APIs, automations, and event-driven flows."
          actionLabel="Create an Integration"
          onAction={isLoading ? undefined : createIntegration}
        />
        <SummaryCard
          icon={<Sparkles size={24} />}
          title={AI_SERVICES_GROUP.title}
          description="Give your agents knowledge to draw on and a voice to talk with your users."
          actionLabel={AI_SERVICES_GROUP.actionLabel}
          onAction={() => setCatalog(AI_SERVICES_GROUP)}
        />
        <SummaryCard
          icon={<Layers size={24} />}
          title={RESOURCES_GROUP.title}
          description="Provision the databases, message brokers, and external services your integrations connect to."
          actionLabel={RESOURCES_GROUP.actionLabel}
          onAction={() => setCatalog(RESOURCES_GROUP)}
        />
      </Box>

      <Box sx={recent.length > 0 ? styles.sectionsRow : undefined}>
        {recent.length > 0 && (
          <Card>
            <Box sx={styles.sectionHeader}>
              <Typography variant="subtitle1" fontWeight={600}>
                Recently accessed integrations
              </Typography>
            </Box>
            <Divider />
            {recent.map(({ component, project, accessedAt }) => (
              <ButtonBase key={component.id} onClick={() => navigate(componentOverviewUrl(scope.org, project.handler, component.handler))} sx={styles.listRow}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {component.displayName}
                    </Typography>
                    <Chip label={getDisplayLabel(component.displayType, component.componentSubType)} size="small" variant="outlined" sx={styles.typeChip} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" noWrap component="p">
                    {project.name}
                  </Typography>
                </Box>
                <Box sx={styles.lastAccessed}>
                  <Clock size={14} />
                  <Typography variant="body2" noWrap>
                    Last accessed {formatDistanceToNow(accessedAt)}
                  </Typography>
                </Box>
              </ButtonBase>
            ))}
          </Card>
        )}

        <Card>
          <Box sx={styles.sectionHeader}>
            <Stack direction="row" alignItems="center">
              <Typography variant="subtitle1" fontWeight={600}>
                Projects
              </Typography>
              {!isLoading && !isError && (
                <Typography variant="body2" color="text.secondary" sx={styles.countDivider}>
                  {projects.length}
                </Typography>
              )}
            </Stack>
            <Box sx={{ flex: 1 }} />
            <Authorized permissions={Permissions.PROJECT_MANAGE}>
              <Button variant="outlined" startIcon={<Plus size={16} />} onClick={() => navigate(newProjectUrl(scope))} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                Create Project
              </Button>
            </Authorized>
          </Box>
          <Divider />
          {renderProjects()}
        </Card>
      </Box>

      <ExploreMore />

      <CatalogDialog group={catalog} onClose={() => setCatalog(null)} />
      <ProjectPickerDialog open={pickingProject} projects={pickerProjects} onClose={() => setPickingProject(false)} onSelect={(project) => navigate(newComponentUrl({ org: scope.org, project: project.handler }))} />
    </PageContent>
  );
}
