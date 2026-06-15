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

import { Box, IconButton, MenuItem, Select, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Building2, Check, Copy, Download, Folder, Globe } from '@wso2/oxygen-ui-icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFetchComponentEndpointSpec } from '../../../hooks/useComponents';
import type { EnvEndpoint } from '../../../types/component';

function trimEndpointName(name: string) {
  return (
    name
      .replace(/^\s*Endpoint\b\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim() || name
  );
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [url]);
  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
      <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25, flexShrink: 0 }}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </IconButton>
    </Tooltip>
  );
}

const VISIBILITY_ROWS = [
  {
    key: 'public',
    label: 'Public',
    Icon: Globe,
    getUrl: (ep: EnvEndpoint) => ep.publicUrl || ep.defaultPublicUrl || ep.invokeUrl || '',
  },
  {
    key: 'organization',
    label: 'Organization',
    Icon: Building2,
    getUrl: (ep: EnvEndpoint) => ep.organizationUrl || ep.defaultOrganizationUrl || '',
  },
  {
    key: 'project',
    label: 'Project',
    Icon: Folder,
    getUrl: (ep: EnvEndpoint) => ep.projectUrl || '',
  },
] as const;

function VisibilityUrlRow({ Icon, label, url }: { Icon: React.ElementType; label: string; url: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
      <Tooltip title={label}>
        <Box component="span" role="img" aria-label={label} sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', flexShrink: 0 }}>
          <Icon size={15} aria-hidden="true" />
        </Box>
      </Tooltip>
      <Typography
        variant="body2"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
        title={url}>
        {url}
      </Typography>
      <CopyButton url={url} />
    </Stack>
  );
}

interface EndpointUrlsPanelProps {
  endpoints: EnvEndpoint[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  componentId: string;
  deploymentTrackId: string;
}

/**
 * Per-environment endpoint URLs panel: endpoint selector, the visibility-scoped
 * invoke URLs (with copy), and the API-spec download. Shared by the env-card
 * bodies of integration-as-api and ai-agent
 */
export default function EndpointUrlsPanel({ endpoints, selectedIdx, onSelect, componentId, deploymentTrackId }: EndpointUrlsPanelProps) {
  const fetchSpecMutation = useFetchComponentEndpointSpec();
  const ep = endpoints[selectedIdx];
  if (!ep) return null;

  const urlRows = VISIBILITY_ROWS.map((row) => ({ ...row, url: row.getUrl(ep) })).filter((r) => !!r.url && (!ep.networkVisibilities?.length || ep.networkVisibilities.includes(r.label)));
  // Fallback to invokeUrl if no visibility-specific URL
  const fallbackUrl = urlRows.length === 0 ? ep.invokeUrl || '' : '';

  const handleDownload = async () => {
    if (!ep.id) return;
    try {
      const content = await fetchSpecMutation.mutateAsync({ componentId, versionId: deploymentTrackId, endpointId: ep.id });
      if (!content) return;
      const blob = new Blob([content], { type: 'text/yaml' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${trimEndpointName(ep.displayName) || 'api'}-spec.yaml`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch {
      // silently ignore
    }
  };

  const cols = '220px minmax(0,1fr) auto';

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: cols, columnGap: 2, rowGap: 0.75, mb: 2 }}>
      {/* Row 1 – Labels */}
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        Endpoint
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        URLs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        Download Spec
      </Typography>

      {/* Row 2 – Values (all centre-aligned with each other) */}
      <Box sx={{ alignSelf: 'start' }}>
        {endpoints.length > 1 ? (
          <Select size="small" value={selectedIdx} onChange={(e) => onSelect(Number(e.target.value))} sx={{ fontSize: '13px', width: '100%' }}>
            {endpoints.map((e, i) => (
              <MenuItem key={e.id} value={i} sx={{ fontSize: '13px' }}>
                {trimEndpointName(e.displayName)}
              </MenuItem>
            ))}
          </Select>
        ) : (
          <Box
            sx={{
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0.5,
              px: 1.5,
              py: 0.75,
              fontSize: '13px',
              fontWeight: 500,
            }}>
            {trimEndpointName(ep.displayName)}
          </Box>
        )}
      </Box>

      <Box sx={{ minWidth: 0, alignSelf: 'center' }}>
        {urlRows.length > 0 ? (
          <Stack gap={0.5}>
            {urlRows.map((row) => (
              <VisibilityUrlRow key={row.key} Icon={row.Icon} label={row.label} url={row.url} />
            ))}
          </Stack>
        ) : fallbackUrl ? (
          <VisibilityUrlRow Icon={Globe} label="Invoke" url={fallbackUrl} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        )}
      </Box>

      <Box sx={{ alignSelf: 'center' }}>
        <Tooltip title="Download API specification">
          <IconButton size="small" onClick={() => void handleDownload()}>
            <Download size={16} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
