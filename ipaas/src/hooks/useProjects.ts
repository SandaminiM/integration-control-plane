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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UUID_RE } from '../utils/string';
import { fetchProjects, fetchProject, fetchProjectByHandler, fetchProjectContributors, fetchProjectComponentLabels, fetchProjectHandlerAvailability, createProject, createMonoRepoProject } from '../api/projects';
import type { CreateProjectInput, CreateMonoRepoProjectInput } from '../types/project';
import { useOrgs } from './useOrg';
import { IS_CLOUD } from '../features';

function orgId(): number {
  return window.API_CONFIG?.asgardeoOrgNumericId ?? 0;
}

// In cloud, Thunder does not issue an asgardeoOrgNumericId, so the legacy
// numeric-ID gate (id > 0) blocks every project query indefinitely. The org
// scope is carried by the JWT, so the cloud variant's fetchProjects family
// ignores the numericId argument — we just need to let the queries fire.
const isOrgScopeReady = (id: number): boolean => IS_CLOUD || id > 0;

export function useProjects() {
  const id = orgId();
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => fetchProjects(id),
    enabled: isOrgScopeReady(id),
  });
}

export function useProjectsByOrg(orgHandle: string) {
  const { data: orgs } = useOrgs();
  const numericId = orgs?.find((o) => o.handle === orgHandle)?.numericId ?? 0;
  return useQuery({
    queryKey: ['projects', numericId],
    queryFn: () => fetchProjects(numericId),
    enabled: isOrgScopeReady(numericId),
  });
}

export function useProject(projectId: string) {
  const id = orgId();
  return useQuery({
    queryKey: ['project', projectId, id],
    queryFn: () => fetchProject(id, projectId),
    enabled: !!projectId && isOrgScopeReady(id),
  });
}

export function useProjectByHandler(handler: string) {
  const id = orgId();
  return useQuery({
    queryKey: ['project', 'handler', handler, id],
    queryFn: () => fetchProjectByHandler(id, handler),
    // Guard: never call if handler is empty or looks like a UUID (should use useProject instead)
    enabled: !!handler && isOrgScopeReady(id) && !UUID_RE.test(handler),
  });
}

export function useProjectContributors(projectId: string) {
  const id = orgId();
  return useQuery({
    queryKey: ['projectContributors', projectId, id],
    queryFn: () => fetchProjectContributors(id, projectId),
    enabled: !!projectId && isOrgScopeReady(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectComponentLabels(projectId: string) {
  const id = orgId();
  return useQuery({
    queryKey: ['projectComponentLabels', projectId, id],
    queryFn: () => fetchProjectComponentLabels(id, projectId),
    enabled: !!projectId && isOrgScopeReady(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectHandlerAvailability(candidate: string, enabled: boolean) {
  const id = orgId();
  return useQuery({
    queryKey: ['projectHandlerAvailability', id, candidate],
    queryFn: () => fetchProjectHandlerAvailability(id, candidate),
    enabled: enabled && isOrgScopeReady(id) && !!candidate && candidate.length >= 2,
    staleTime: 0,
    retry: false,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useCreateMonoRepoProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMonoRepoProjectInput) => createMonoRepoProject(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
