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

import { Avatar, Box, Button, ButtonGroup, Chip, CircularProgress, ClickAwayListener, Grow, IconButton, InputBase, MenuList, MenuItem, Paper, Popper, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Tag, Cloud, Github, GitBranch, GitCommitHorizontal, Copy, Check, ChevronDown, Code2, Pencil, Globe, Lock, ShieldCheck, CodeXml, MCP, Recycle } from '@wso2/oxygen-ui-icons-react';
import type { GqlComponentDetail } from '../types/component';
import type { GqlProject } from '../types/project';
import type { GqlRepository, GqlCommit } from '../types/repository';
import { useApimApi } from '../hooks/useApim';
import { useUpdateComponent } from '../hooks/useComponents';
import { useChoreoSampleImages } from '../hooks/useRepository';
import LabelDialog from './LabelDialog';
import SecurityDrawer from './SecurityDrawer';
import { formatDistanceToNow } from '../utils/time';
import { useAuth } from '../auth/AuthContext';
import { useOrgUuid } from '../hooks/useOrgUuid';
import { getDisplayLabel } from '../constants/integrations';
import { getDevPortalBaseUrl } from '../config/runtimeConfig';

function buildRepoUrl(repo: GqlRepository): string {
  const { gitProvider, organizationApp, nameApp, branch, appSubPath, bitbucketServerUrl, serverUrl, projectApp } = repo;
  const subPath = appSubPath || '';
  const encodedBranch = encodeURIComponent(branch);
  switch (gitProvider) {
    case 'github':
      return `https://github.com/${organizationApp}/${nameApp}/tree/${encodedBranch}/${subPath}`;
    case 'bitbucket':
      return `https://bitbucket.org/${organizationApp}/${nameApp}/src/HEAD/${subPath}?at=${encodedBranch}`;
    case 'bitbucket_server': {
      const base = (bitbucketServerUrl || serverUrl || '').replace(/\/$/, '');
      return `${base}/projects/${organizationApp}/repos/${nameApp}/browse/${subPath}?at=${encodedBranch}`;
    }
    case 'gitlab_self_managed':
      return `${serverUrl || ''}/${organizationApp}/${nameApp}`;
    case 'azure_devops':
      return `https://dev.azure.com/${organizationApp}/${projectApp}/_git/${nameApp}?path=${subPath}&version=GB${branch}`;
    default:
      return `https://github.com/${organizationApp}/${nameApp}`;
  }
}

const REST_API_TYPES = new Set(['restApi', 'byocRestApi', 'miRestApi', 'buildRestApi', 'miApiService', 'ballerinaService', 'byocService', 'byoiService', 'graphql', 'buildpackService']);

interface ComponentHeaderProps {
  component: GqlComponentDetail;
  project?: GqlProject | null;
  repository?: GqlRepository | null;
  latestCommit?: GqlCommit | null;
  orgHandler: string;
  projectId: string;
  projectHandler: string;
  apimId?: string | null;
}

export default function ComponentHeader({ component, project, repository, latestCommit, orgHandler, projectId, projectHandler, apimId }: ComponentHeaderProps) {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [copied, setCopied] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const splitButtonRef = useRef<HTMLDivElement>(null);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [securityDrawerOpen, setSecurityDrawerOpen] = useState(false);
  const [descHovered, setDescHovered] = useState(false);

  const [nameEditing, setNameEditing] = useState(false);
  const [nameValue, setNameValue] = useState(component.displayName ?? component.handler);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const updateName = useUpdateComponent();

  const [descEditing, setDescEditing] = useState(false);
  const [descValue, setDescValue] = useState(component.description?.trim() ?? '');
  const descInputRef = useRef<HTMLInputElement>(null);
  const updateDesc = useUpdateComponent();

  useEffect(() => {
    setNameValue(component.displayName ?? component.handler);
  }, [component.displayName, component.handler]);

  useEffect(() => {
    setDescValue(component.description?.trim() ?? '');
  }, [component.description]);

  useEffect(() => {
    if (nameEditing) nameInputRef.current?.select();
  }, [nameEditing]);

  useEffect(() => {
    if (descEditing) descInputRef.current?.focus();
  }, [descEditing]);

  const commitNameEdit = () => {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameValue(component.displayName ?? component.handler);
      setNameEditing(false);
      return;
    }
    if (trimmed === (component.displayName ?? component.handler)) {
      setNameEditing(false);
      return;
    }
    updateName.mutate(
      {
        id: component.id,
        displayName: trimmed,
        description: component.description ?? ' ',
        version: component.version ?? 'v1.0',
        projectId,
        handler: component.handler,
      },
      {
        onSuccess: () => setNameEditing(false),
        onError: () => {
          setNameValue(component.displayName ?? component.handler);
          setNameEditing(false);
        },
      },
    );
  };

  const cancelNameEdit = () => {
    setNameValue(component.displayName ?? component.handler);
    setNameEditing(false);
  };

  const commitDescEdit = () => {
    const trimmed = descValue.trim();
    const original = component.description?.trim() ?? '';
    if (trimmed === original) {
      setDescEditing(false);
      return;
    }
    updateDesc.mutate(
      {
        id: component.id,
        displayName: component.displayName ?? component.handler,
        description: trimmed || ' ',
        version: component.version ?? 'v1.0',
        projectId,
        handler: component.handler,
      },
      {
        onSuccess: () => setDescEditing(false),
        onError: () => {
          setDescValue(original);
          setDescEditing(false);
        },
      },
    );
  };

  const cancelDescEdit = () => {
    setDescValue(component.description?.trim() ?? '');
    setDescEditing(false);
  };

  const handleCopyRepoUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const displayType = component.displayType ?? '';
  const typeLabel = getDisplayLabel(displayType, component.componentSubType ?? null) || null;
  const showAccessMode = REST_API_TYPES.has(displayType) && !!component.serviceAccessMode;
  const isExternal = component.serviceAccessMode?.toLowerCase() === 'external';
  const envMatch = (window.API_CONFIG?.choreoOrgApiUrl ?? '').match(/\/\/apis\.([^.]+)\.choreo\.dev/);
  const devantOrigin = envMatch ? `https://${envMatch[1]}.devant.dev` : null;

  const showApiActions = REST_API_TYPES.has(displayType) || component.componentSubType === 'mcpServer';
  const { data: apimApi } = useApimApi(showApiActions ? apimId : null);
  const lifecycleStatus = apimApi?.lifeCycleStatus ?? null;
  const isPublished = lifecycleStatus === 'PUBLISHED' || lifecycleStatus === 'PROTOTYPED';
  const devPortalBase = getDevPortalBaseUrl();
  const devPortalUrl = devPortalBase && apimApi ? `${devPortalBase}/${orgHandler}/views/default/api/${encodeURIComponent(apimApi.name)}-${encodeURIComponent(apimApi.version)}` : null;
  const lifecycleColor: 'success' | 'error' | 'warning' | 'default' = lifecycleStatus === 'PUBLISHED' ? 'success' : lifecycleStatus === 'DEPRECATED' || lifecycleStatus === 'BLOCKED' ? 'error' : lifecycleStatus === 'PROTOTYPED' ? 'warning' : 'default';
  const lifecycleLabel: Record<string, string> = {
    CREATED: 'Created',
    PUBLISHED: 'Published',
    PROTOTYPED: 'Prototyped',
    DEPRECATED: 'Deprecated',
    BLOCKED: 'Blocked',
  };
  const generateMcpUrl = devantOrigin && project ? `${devantOrigin}/organizations/${orgHandler}/projects/${project.handler}/components/new?type=mcp&sourceApiId=${apimId ?? ''}` : null;

  const repoUrl = repository ? buildRepoUrl(repository) : null;

  const orgUuidFromToken = useOrgUuid() ?? '';
  const { data: sampleImages } = useChoreoSampleImages(orgUuidFromToken, projectId);
  const codeServerSample = (sampleImages ?? []).find((img) => img.name === 'Code Server');

  const handleOpenInCloud = () => {
    if (!codeServerSample) return;
    const params = new URLSearchParams({
      userId,
      orgUuid: orgUuidFromToken,
      orgHandle: orgHandler,
      projectId,
      componentId: component.id,
      codeServerSample: JSON.stringify(codeServerSample),
      sourceCommitHash: latestCommit?.sha ?? '',
    });
    window.open(`${window.location.origin}/editor?${params}`, '_blank', 'noopener,noreferrer');
    setSplitOpen(false);
  };

  const handleOpenInVSCode = () => {
    const isMI = (component.componentType ?? '').toUpperCase() === 'MI';
    const extensionId = isMI ? 'WSO2.micro-integrator' : 'WSO2.ballerina';
    const params = new URLSearchParams({ project: project?.handler ?? '', org: orgHandler, component: component.handler });
    if (displayType) {
      params.set('integrationType', displayType);
      params.set('integrationDisplayType', typeLabel ?? displayType);
    }
    window.open(`vscode://${extensionId}/open?${params}`, '_blank');
    setSplitOpen(false);
  };

  return (
    <>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" sx={{ mb: 3 }} gap={2}>
        {/* LEFT COLUMN */}
        <Stack gap={1} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={2}>
            <Avatar sx={{ width: 48, height: 48, fontSize: 22, bgcolor: 'text.primary', color: 'background.paper' }}>{nameValue?.[0]?.toUpperCase() ?? 'C'}</Avatar>
            <Box>
              <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 0.25, cursor: 'text', columnGap: nameEditing ? 1.5 : 0.5, '&:hover .pencil-btn': { opacity: 1 } }} onClick={() => !nameEditing && setNameEditing(true)}>
                {/* The Typography always stays in the DOM and determines the layout size.
                  The InputBase is absolutely overlaid on top when editing — zero layout shift. */}
                <Box sx={{ position: 'relative', display: 'inline-flex', minWidth: 200 }}>
                  <Typography variant="h1" sx={{ visibility: nameEditing ? 'hidden' : 'visible', whiteSpace: 'pre' }}>
                    {nameValue || '\u200b'}
                  </Typography>
                  {nameEditing && (
                    <InputBase
                      inputRef={nameInputRef}
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onBlur={commitNameEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitNameEdit();
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelNameEdit();
                        }
                      }}
                      sx={(theme) => ({
                        position: 'absolute',
                        inset: '-4px',
                        border: `2px solid ${theme.palette.primary.main}`,
                        borderRadius: `${theme.shape.borderRadius}px`,
                        '& input': {
                          ...theme.typography.h1,
                          width: '100%',
                          height: '100%',
                          padding: 0,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                        },
                      })}
                      disabled={updateName.isPending}
                      autoComplete="off"
                    />
                  )}
                </Box>
                {updateName.isPending ? (
                  <CircularProgress size={14} />
                ) : (
                  !nameEditing && (
                    <Tooltip title="Edit name">
                      <IconButton
                        className="pencil-btn"
                        size="small"
                        sx={{ p: 0.25, opacity: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setNameEditing(true);
                        }}>
                        <Pencil size={14} />
                      </IconButton>
                    </Tooltip>
                  )
                )}
              </Stack>
              {typeLabel && (
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <Typography variant="body2" color="text.secondary">
                    {typeLabel}
                  </Typography>
                  {showAccessMode && (
                    <Tooltip title={isExternal ? 'External' : 'Internal'}>
                      <Stack direction="row" alignItems="center" gap={0.25} sx={{ color: 'text.secondary' }}>
                        {isExternal ? <Globe size={12} /> : <Lock size={12} />}
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                          {component.serviceAccessMode}
                        </Typography>
                      </Stack>
                    </Tooltip>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
          <Stack direction="row" alignItems="flex-start" gap={1} onMouseEnter={() => setDescHovered(true)} onMouseLeave={() => setDescHovered(false)}>
            <Box sx={{ position: 'relative', flex: 1, cursor: descEditing ? 'text' : descValue ? 'text' : 'pointer' }} onClick={() => !descEditing && setDescEditing(true)}>
              {/* Ghost text determines height; pencil sits inline after last word */}
              <Typography
                variant="body2"
                component="div"
                sx={{
                  visibility: descEditing ? 'hidden' : 'visible',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: descValue ? 'text.secondary' : 'primary.main',
                  minHeight: '1.4em',
                }}>
                {descEditing ? (
                  descValue || '\u200b'
                ) : (
                  <>
                    {descValue || '+ Add Description'}
                    {descValue && (
                      <Box component="span" sx={{ display: 'inline-flex', verticalAlign: 'middle', ml: 0.5 }}>
                        <Tooltip title="Edit description">
                          <IconButton
                            size="small"
                            sx={{ p: 0.25, opacity: descHovered ? 1 : 0, transition: 'opacity 0.15s' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDescEditing(true);
                            }}>
                            <Pencil size={12} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </>
                )}
              </Typography>
              {descEditing && (
                <InputBase
                  inputRef={descInputRef}
                  multiline
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  onBlur={commitDescEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelDescEdit();
                    }
                  }}
                  sx={(theme) => ({
                    position: 'absolute',
                    inset: '-4px',
                    padding: '4px',
                    border: `2px solid ${theme.palette.primary.main}`,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    alignItems: 'flex-start',
                    '& textarea': {
                      ...theme.typography.body2,
                      padding: 0,
                      resize: 'none',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                    },
                  })}
                  disabled={updateDesc.isPending}
                  autoComplete="off"
                />
              )}
            </Box>
            {updateDesc.isPending && <CircularProgress size={12} sx={{ mt: 0.25 }} />}
          </Stack>
          {(() => {
            const raw = component.labels;
            const labelList: string[] = Array.isArray(raw) ? raw : raw ? raw.split(',').filter(Boolean) : [];
            return (
              <>
                <LabelDialog open={labelDialogOpen} onClose={() => setLabelDialogOpen(false)} component={component} projectId={projectId} currentLabels={labelList} />
                <Stack direction="row" alignItems="center" gap={0.5} flexWrap="wrap" sx={{ '&:hover .pencil-btn': { opacity: 1 } }}>
                  <Tag size={12} />
                  {labelList.length === 0 ? (
                    <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }} onClick={() => setLabelDialogOpen(true)}>
                      + Add Labels
                    </Typography>
                  ) : (
                    <>
                      {labelList.slice(0, 3).map((label) => (
                        <Chip key={label} label={label} size="small" variant="outlined" />
                      ))}
                      {labelList.length > 3 && (
                        <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }} onClick={() => setLabelDialogOpen(true)}>
                          +{labelList.length - 3} more
                        </Typography>
                      )}
                      <Tooltip title="Edit labels">
                        <IconButton
                          className="pencil-btn"
                          size="small"
                          sx={{ p: 0.25, opacity: 0 }}
                          onClick={(e) => {
                            (e.currentTarget as HTMLElement).blur();
                            setLabelDialogOpen(true);
                          }}>
                          <Pencil size={12} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Stack>
              </>
            );
          })()}
          <Stack gap={0.5}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>
                Source:
              </Typography>
              {repository?.gitProvider === 'github' ? <Github size={12} /> : <GitBranch size={12} />}
              {repoUrl ? (
                <>
                  <Typography
                    variant="body2"
                    component="a"
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={repoUrl}>
                    {repoUrl}
                  </Typography>
                  <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
                    <IconButton size="small" onClick={() => handleCopyRepoUrl(repoUrl)} sx={{ p: 0.25 }}>
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  —
                </Typography>
              )}
            </Stack>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>
                Latest Commit:
              </Typography>
              <GitCommitHorizontal size={12} />
              {latestCommit ? (
                <>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {latestCommit.sha.substring(0, 7)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={latestCommit.message}>
                    {latestCommit.message}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDistanceToNow(latestCommit.author.date)}
                  </Typography>
                  <Avatar src={latestCommit.author.avatarUrl} alt={latestCommit.author.name ?? 'Commit author'} sx={{ width: 16, height: 16, fontSize: 10 }}>
                    {latestCommit.author.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    {latestCommit.author.name}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  —
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>

        {/* RIGHT COLUMN */}
        <Stack direction="column" gap={1.5} alignItems="flex-end" sx={{ mt: 1, flexShrink: 0, width: 'auto' }}>
          {/* Open in Cloud / VS Code */}
          <Box sx={{ position: 'relative' }}>
            <ButtonGroup variant="outlined" size="small" ref={splitButtonRef}>
              <Button startIcon={<Cloud size={14} />} onClick={handleOpenInCloud} disabled={!codeServerSample} sx={{ whiteSpace: 'nowrap' }}>
                Open in Cloud&nbsp;
                <Chip label="Beta" size="small" sx={{ height: 16, fontSize: 10, cursor: 'pointer' }} />
              </Button>
              <Button size="small" sx={{ px: 0.5 }} aria-label="More options" aria-expanded={splitOpen} onClick={() => setSplitOpen((prev) => !prev)}>
                <ChevronDown size={14} />
              </Button>
            </ButtonGroup>
            <Popper open={splitOpen} anchorEl={splitButtonRef.current} placement="bottom-end" transition disablePortal style={{ zIndex: 1300 }}>
              {({ TransitionProps }) => (
                <Grow {...TransitionProps}>
                  <Paper elevation={3}>
                    <ClickAwayListener onClickAway={() => setSplitOpen(false)}>
                      <MenuList dense sx={{ minWidth: 200 }}>
                        <MenuItem onClick={handleOpenInCloud} selected disabled={!codeServerSample}>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Cloud size={14} />
                            <Typography variant="body2">Open in Cloud</Typography>
                            <Chip label="Beta" size="small" sx={{ height: 16, fontSize: 10 }} />
                          </Stack>
                        </MenuItem>
                        <MenuItem onClick={handleOpenInVSCode}>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Code2 size={14} />
                            <Typography variant="body2">Open in VS Code</Typography>
                          </Stack>
                        </MenuItem>
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </Box>

          {/* API management action buttons — Configure Security, Lifecycle Status, Dev Portal, Generate MCP */}
          {showApiActions && (
            <Stack gap={1} alignItems={'flex-end'}>
              {/* Configure Security row */}
              <Stack direction="row" alignItems="center" gap={1}>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<ShieldCheck size={14} />}
                  onClick={() => setSecurityDrawerOpen(true)}
                  sx={{ color: 'text.secondary', textTransform: 'none', p: 0, minWidth: 0, '&:hover': { background: 'none', textDecoration: 'underline' } }}>
                  Configure Security
                </Button>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <Check size={10} />
                </Box>
              </Stack>
              {/* Lifecycle Status row */}
              <Stack direction="row" alignItems="center" gap={1}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate(`/organizations/${orgHandler}/projects/${projectHandler}/components/${component.handler}/manage/lifecycle`)}
                  startIcon={<Recycle size={14} />}
                  sx={{ color: 'text.secondary', textTransform: 'none', p: 0, minWidth: 0, '&:hover': { background: 'none', textDecoration: 'underline' } }}>
                  Lifecycle Status
                </Button>
                {lifecycleStatus && <Chip label={lifecycleLabel[lifecycleStatus] ?? lifecycleStatus} size="small" color={lifecycleColor} variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />}
              </Stack>
              {/* Dev Portal + Generate MCP icon buttons */}
              <Stack direction="row" alignItems="center" gap={1}>
                <Tooltip title={isPublished ? 'Go to Developer Portal' : 'Publish API to access Developer Portal'}>
                  <IconButton
                    size="small"
                    component="a"
                    href={devPortalUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!isPublished || !devPortalUrl}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, color: isPublished && devPortalUrl ? 'text.secondary' : 'text.disabled', pointerEvents: 'auto' }}>
                    <CodeXml size={16} />
                  </IconButton>
                </Tooltip>
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
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>
      <SecurityDrawer open={securityDrawerOpen} onClose={() => setSecurityDrawerOpen(false)} apimId={apimId} componentId={component.id} versionId={component.deploymentTracks?.[0]?.id} />
    </>
  );
}
