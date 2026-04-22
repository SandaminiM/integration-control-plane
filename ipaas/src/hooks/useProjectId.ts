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

import { useProject, useProjectByHandler, useProjects } from '../api/queries';
import { UUID_RE } from '../utils/string';

export function useProjectId(projectIdentifier: string) {
  const isProjectUuid = UUID_RE.test(projectIdentifier);
  const { data: projectByHandler, isLoading: loadingByHandler } = useProjectByHandler(!isProjectUuid ? projectIdentifier : '');
  const { data: projectById, isLoading: loadingById } = useProject(isProjectUuid ? projectIdentifier : '');
  const { data: allProjects = [], isLoading: loadingProjects } = useProjects();

  const projectFromList = !isProjectUuid ? (allProjects.find((p) => p.handler === projectIdentifier) ?? null) : null;
  const project = isProjectUuid ? projectById : (projectByHandler ?? projectFromList ?? undefined);

  return {
    projectId: project?.id ?? '',
    project,
    isLoading: isProjectUuid ? loadingById : (loadingByHandler && loadingProjects),
  };
}
