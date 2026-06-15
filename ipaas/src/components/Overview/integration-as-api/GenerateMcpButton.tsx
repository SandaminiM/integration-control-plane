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

import { IconButton, Tooltip } from '@wso2/oxygen-ui';
import { MCP } from '@wso2/oxygen-ui-icons-react';
import type { ReactNode } from 'react';
import { useApimApi } from '../../../hooks/useApim';

interface GenerateMcpButtonProps {
  apimId?: string | null;
  orgHandler: string;
  projectHandler: string;
}

/**
 * "Generate MCP Server" header action — **specific to Integration as API**.
 * It is NOT part of the generic `OverviewHeaderActions` (which other API-backed
 * types like AI Agent share); integration-as-api plugs it into that block's
 * `extra` slot, so it never shows for other types. Self-contained: derives its
 * own publish state.
 */
export default function GenerateMcpButton({ apimId, orgHandler, projectHandler }: GenerateMcpButtonProps): ReactNode {
  const { data: apimApi } = useApimApi(apimId);
  const lifecycleStatus = apimApi?.lifeCycleStatus ?? null;
  const isPublished = lifecycleStatus === 'PUBLISHED' || lifecycleStatus === 'PROTOTYPED';

  // The MCP-creation flow lives in the devant console; derive its origin from
  // the configured choreo API host (e.g. apis.st.choreo.dev → st.devant.dev).
  const envMatch = (window.API_CONFIG?.choreoOrgApiUrl ?? '').match(/\/\/apis\.([^.]+)\.choreo\.dev/);
  const devantOrigin = envMatch ? `https://${envMatch[1]}.devant.dev` : null;
  const generateMcpUrl = devantOrigin ? `${devantOrigin}/organizations/${orgHandler}/projects/${projectHandler}/components/new?type=mcp&sourceApiId=${apimId ?? ''}` : null;

  return (
    <Tooltip title={isPublished && apimId ? 'Generate MCP Server' : 'Publish API to generate MCP Server'}>
      <IconButton
        size="small"
        component="a"
        href={isPublished && apimId && generateMcpUrl ? generateMcpUrl : '#'}
        target="_blank"
        rel="noopener noreferrer"
        disabled={!isPublished || !apimId}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, color: isPublished && apimId ? 'text.secondary' : 'text.disabled', pointerEvents: 'auto' }}>
        <MCP size={16} />
      </IconButton>
    </Tooltip>
  );
}
