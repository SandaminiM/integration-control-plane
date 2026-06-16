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
import { Tag, Cloud, Github, GitBranch, GitCommitHorizontal, Copy, Check, ChevronDown, Code2, Pencil, Globe, Lock } from '@wso2/oxygen-ui-icons-react';
import type { ComponentDetail } from '../../../types/component';
import type { Project } from '../../../types/project';
import type { Repository, Commit } from '../../../types/repository';
import { useUpdateComponent } from '../../../hooks/useComponents';
import { useChoreoSampleImages } from '../../../hooks/useRepository';
import LabelDialog from '../../LabelDialog';
import { formatDistanceToNow } from '../../../utils/time';
import { useAuth } from '../../../auth/AuthContext';
import { useOrgUuid } from '../../../hooks/useOrgUuid';
import { getDisplayLabel } from '../../../constants/integrations';
import type { IntegrationModule } from '../../../types/integration';

function buildRepoUrl(repo: Repository): string {
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
  component: ComponentDetail;
  project?: Project | null;
  repository?: Repository | null;
  latestCommit?: Commit | null;
  orgHandler: string;
  projectId: string;
  projectHandler: string;
  apimId?: string | null;
  module?: IntegrationModule | null;
  /**
   * Whether the component has a source repo. False for proxy/converted
   * integrations (e.g. MCP proxy) — hides Source/Commit + the editor entry.
   */
  hasSource?: boolean;
}

export default function ComponentHeader({ component, project, repository, latestCommit, orgHandler, projectId, projectHandler, apimId, module, hasSource = true }: ComponentHeaderProps) {
  const { userId } = useAuth();
  const [copied, setCopied] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const splitButtonRef = useRef<HTMLDivElement>(null);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
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

  // Overview header actions are strictly opt-in: a type renders them only by
  // providing its own `OverviewHeaderActions` slot (integration-as-api → the
  // shared API block + Generate MCP; ai-agent → the shared block). Types that
  // don't (file/event/automation/…) show no header actions — just the
  // Open-in-Cloud split button below. The shell makes no per-type decision.
  const HeaderActions = module?.OverviewHeaderActions;
  // Open-in-Cloud/VS Code editor entry: only for components with a source repo
  // and types that don't opt out of it (e.g. MCP sets `hideOpenInEditor`).
  const showOpenInEditor = hasSource && !module?.hideOpenInEditor;

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
          {/* Source + Latest Commit — only for components with a source repo
              (hidden for proxy/converted integrations like MCP proxy). */}
          {hasSource && (
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
          )}
        </Stack>

        {/* RIGHT COLUMN */}
        <Stack direction="column" gap={1.5} alignItems="flex-end" sx={{ mt: 1, flexShrink: 0, width: 'auto' }}>
          {/* Open in Cloud / VS Code — hidden for repo-less / MCP components */}
          {showOpenInEditor && (
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
          )}

          {/* Overview-header API actions — rendered only when the type opts in
              via its module's `OverviewHeaderActions` slot. */}
          {HeaderActions && <HeaderActions component={component} apimId={apimId} orgHandler={orgHandler} projectHandler={projectHandler} />}
        </Stack>
      </Stack>
    </>
  );
}
