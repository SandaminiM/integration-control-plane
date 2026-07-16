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

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  PageContent,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@wso2/oxygen-ui';
import { ChevronDown, ChevronUp, Edit, FileText, Plus, Search, Trash2 } from '@wso2/oxygen-ui-icons-react';
import Editor from '@monaco-editor/react';
import { Suspense, useEffect, useMemo, useState, type JSX } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DeploymentTrackBar from '../components/DeploymentTrackBar';
import NotFound from '../components/NotFound';
import { useComponentByHandler, useComponentEndpoints } from '../hooks/useComponents';
import { useProject, useProjectByHandler, useProjects } from '../hooks/useProjects';
import { useApimApi, useApimDocumentContent, useApimDocuments, useChangeLifecycleState, useCreateApimDocument, useDeleteApimDocument, useLifecycleState, useUpdateApimApi, useUpdateApimDocument } from '../hooks/useApim';
import ConfirmDialog from '../components/Lifecycle/ConfirmDialog';
import { PUBLISH_ACTIONS, SUCCESS_TEXT } from '../constants/lifecycle';
import { broaden, resourceUrl, type ComponentScope } from '../nav';
import { UUID_RE } from '../utils/string';
import type { ApiDocument } from '../types/marketplace';
import type { DeploymentTrack } from '../types/component';

type View = 'list' | 'create' | 'edit';

const DOC_TYPES = [
  { value: 'HOWTO', label: 'How To' },
  { value: 'SAMPLES', label: 'Sample and SDK' },
  { value: 'PUBLIC_FORUM', label: 'Public Forum' },
  { value: 'SUPPORT_FORUM', label: 'Support Forum' },
  { value: 'OTHER', label: 'Other' },
];

const DOC_TYPE_LABEL: Record<string, string> = Object.fromEntries(DOC_TYPES.map((t) => [t.value, t.label]));

function typeLabel(doc: ApiDocument): string {
  return doc.type === 'OTHER' ? (doc.otherTypeName ?? 'Other') : (DOC_TYPE_LABEL[doc.type] ?? doc.type);
}

function getMajorVersion(apiVersion: string): string {
  return apiVersion.replace(/^v/i, '').split('.')[0];
}

function aggregateByMajorVersion(tracks: DeploymentTrack[]): DeploymentTrack[] {
  const groups = new Map<string, DeploymentTrack>();
  for (const track of tracks) {
    if (!track.apiVersion) {
      groups.set(track.id, track);
      continue;
    }
    const key = `${getMajorVersion(track.apiVersion)}.x`;
    const existing = groups.get(key);
    if (!existing || track.latest) {
      groups.set(key, { ...track, apiVersion: key });
    }
  }
  return Array.from(groups.values());
}

// ── Create / Edit form (full-page, Monaco editor + live preview) ──────────────

interface DocFormPageProps {
  view: 'create' | 'edit';
  initialName: string;
  initialType: string;
  initialOtherType: string;
  initialContent: string;
  saving: boolean;
  onBack: () => void;
  onSave: (name: string, type: string, otherType: string, content: string) => void;
}

function DocFormPage({ view, initialName, initialType, initialOtherType, initialContent, saving, onBack, onSave }: DocFormPageProps) {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState(initialType);
  const [otherType, setOtherType] = useState(initialOtherType);
  const [content, setContent] = useState(initialContent);
  const isCreate = view === 'create';
  const isValid = name.trim() !== '' && (type !== 'OTHER' || otherType.trim() !== '');

  return (
    <PageContent>
      <Typography variant="h1" sx={{ mb: 3 }}>
        {isCreate ? 'Create Developer Document' : 'Edit Developer Document'}
      </Typography>

      <Stack direction="row" gap={2} sx={{ mb: 2 }}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter document name here" required size="small" sx={{ width: 280, '& .MuiFormLabel-asterisk': { color: 'error.main' } }} />
        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Document Type</InputLabel>
          <Select label="Document Type" value={type} onChange={(e) => setType(e.target.value as string)}>
            {DOC_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {type === 'OTHER' && <TextField label="Custom Document Type" value={otherType} onChange={(e) => setOtherType(e.target.value)} placeholder="Enter custom document type here" required size="small" sx={{ width: 260 }} />}
      </Stack>

      {/* Editor + preview side by side */}
      <Paper variant="outlined" sx={{ display: 'flex', overflow: 'hidden', mt: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Suspense
            fallback={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500, bgcolor: '#1e1e1e' }}>
                <CircularProgress color="inherit" sx={{ color: '#fff' }} />
              </Box>
            }>
            <Editor
              key={isCreate ? 'new' : initialName}
              height="500px"
              language="markdown"
              theme="vs-dark"
              defaultValue={content || '# Enter document content'}
              onChange={(v) => setContent(v ?? '')}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                quickSuggestions: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                fontSize: 14,
              }}
            />
          </Suspense>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            overflowY: 'auto',
            height: 500,
            '& h1,& h2,& h3,& h4': { mt: 2, mb: 1 },
            '& p': { mb: 1 },
            '& code': { fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5, fontSize: '0.875em' },
            '& pre': { bgcolor: 'action.hover', p: 1.5, borderRadius: 1, overflow: 'auto' },
            '& ul,& ol': { pl: 2.5 },
            '& a': { color: 'primary.main' },
          }}>
          {content && content !== '# Enter document content' ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          ) : (
            <Typography variant="h2" color="text.disabled" sx={{ fontWeight: 400 }}>
              Enter document content
            </Typography>
          )}
        </Box>
      </Paper>

      <Stack direction="row" gap={1} sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => onSave(name.trim(), type, otherType.trim(), content === '# Enter document content' ? '' : content)}
          disabled={!isValid || saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}>
          {saving ? 'Saving...' : isCreate ? 'Create' : 'Save'}
        </Button>
      </Stack>
    </PageContent>
  );
}

// ── Document content pane (right side of list view) ──────────────────────────

function stripLeadingTitle(content: string, docName: string): string {
  const firstLine = content.match(/^#+ .+/m)?.[0] ?? '';
  const heading = firstLine.replace(/^#+ /, '').trim();
  if (heading.toLowerCase() === docName.toLowerCase()) {
    return content.replace(firstLine, '').trimStart();
  }
  return content;
}

function DocContentPane({ apimId, doc }: { apimId: string; doc: ApiDocument }) {
  const isInline = doc.sourceType === 'MARKDOWN' || doc.sourceType === 'INLINE';
  const { data: rawContent = '', isLoading } = useApimDocumentContent(apimId, doc.documentId, isInline);
  const content = isInline ? stripLeadingTitle(rawContent, doc.name) : rawContent;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} color="primary" />
      </Box>
    );
  }

  if (doc.sourceType === 'URL') {
    return (
      <Typography variant="body2">
        <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer">
          {doc.sourceUrl}
        </a>
      </Typography>
    );
  }

  if (!content) {
    return (
      <Typography variant="body2" color="text.disabled">
        No content available.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        '& h1,& h2,& h3,& h4': { mt: 2, mb: 1 },
        '& p': { mb: 1 },
        '& code': { fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 },
        '& pre': { bgcolor: 'action.hover', p: 1.5, borderRadius: 1, overflow: 'auto' },
        '& ul,& ol': { pl: 2.5 },
        '& a': { color: 'primary.main' },
      }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Box>
  );
}

// Thin wrapper that exposes fetched content so the parent can prime the editor.
function DocEditTrigger({ apimId, doc, onEdit }: { apimId: string; doc: ApiDocument; onEdit: (doc: ApiDocument, content: string) => void }) {
  const isInline = doc.sourceType === 'MARKDOWN' || doc.sourceType === 'INLINE';
  const { data: content = '' } = useApimDocumentContent(apimId, doc.documentId, isInline);
  return (
    <Tooltip title="Edit document">
      <IconButton size="small" sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }} onClick={() => onEdit(doc, content)}>
        <Edit size={16} />
      </IconButton>
    </Tooltip>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ComponentDocuments(scope: ComponentScope): JSX.Element {
  const isUuid = UUID_RE.test(scope.project);
  const { data: projectByHandler, isLoading: loadingByHandler } = useProjectByHandler(!isUuid ? scope.project : '');
  const { data: projectById, isLoading: loadingById } = useProject(isUuid ? scope.project : '');
  const { data: allProjects = [], isLoading: loadingProjects } = useProjects();
  const projectFromList = !isUuid ? (allProjects.find((p) => p.handler === scope.project) ?? null) : null;
  const project = projectByHandler ?? projectById ?? projectFromList;
  const loadingProject = !project && (isUuid ? loadingById : loadingByHandler || loadingProjects);

  const { data: component, isLoading: loadingComponent } = useComponentByHandler(project?.id ?? '', scope.component);
  const isLoading = loadingProject || loadingComponent;

  const tracks = useMemo(() => component?.deploymentTracks ?? [], [component?.deploymentTracks]);
  const aggregatedTracks = useMemo(() => aggregateByMajorVersion(tracks), [tracks]);
  const [selectedTrackId, setSelectedTrackId] = useState('');

  useEffect(() => {
    if (!tracks.length) return;
    setSelectedTrackId((prev) => {
      if (prev && tracks.some((t) => t.id === prev)) return prev;
      return tracks.find((t) => t.latest)?.id ?? tracks[0].id;
    });
  }, [component?.id, tracks]);

  const { data: endpoints = [] } = useComponentEndpoints(component?.id ?? '', selectedTrackId);
  const apimEndpoints = useMemo(() => Array.from(new Map(endpoints.filter((e) => e.apimId).map((e) => [e.apimId, e])).values()), [endpoints]);

  const [selectedApimId, setSelectedApimId] = useState<string | null>(null);

  useEffect(() => {
    if (!apimEndpoints.length) {
      setSelectedApimId(null);
      return;
    }
    setSelectedApimId((prev) => {
      if (prev && apimEndpoints.some((e) => e.apimId === prev)) return prev;
      return apimEndpoints[0].apimId ?? null;
    });
  }, [apimEndpoints]);

  const { data: documents = [], isLoading: loadingDocs } = useApimDocuments(selectedApimId);
  const { mutateAsync: createDoc, isPending: creating } = useCreateApimDocument();
  const { mutateAsync: updateDoc, isPending: updating } = useUpdateApimDocument();
  const { mutateAsync: deleteDoc, isPending: deleting } = useDeleteApimDocument();
  const { data: lifecycleState } = useLifecycleState(selectedApimId);
  const { data: apimApiInfo } = useApimApi(selectedApimId);
  const { mutateAsync: changeState, isPending: publishing } = useChangeLifecycleState(selectedApimId);
  const { mutateAsync: updateApim } = useUpdateApimApi();

  const [tab, setTab] = useState(0);
  const [view, setView] = useState<View>('list');
  const [editingDoc, setEditingDoc] = useState<ApiDocument | null>(null);
  const [editingInitialContent, setEditingInitialContent] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [pendingPublish, setPendingPublish] = useState<string | null>(null);
  const [publishDisplayName, setPublishDisplayName] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const selectedDoc = documents.find((d) => d.documentId === selectedDocId) ?? null;

  useEffect(() => {
    if (!documents.length) {
      setSelectedDocId(null);
      return;
    }
    setSelectedDocId((prev) => (prev && documents.some((d) => d.documentId === prev) ? prev : documents[0].documentId));
  }, [documents]);

  const groupedDocs = useMemo(() => {
    const groups: Record<string, ApiDocument[]> = {};
    for (const doc of [...documents].sort((a, b) => a.name.localeCompare(b.name))) {
      const label = typeLabel(doc);
      if (!groups[label]) groups[label] = [];
      groups[label].push(doc);
    }
    return groups;
  }, [documents]);

  const openCreate = () => {
    setEditingDoc(null);
    setEditingInitialContent('');
    setView('create');
  };

  const openEdit = (doc: ApiDocument, content: string) => {
    setEditingDoc(doc);
    setEditingInitialContent(content);
    setView('edit');
  };

  const handleBack = () => {
    setView('list');
    setEditingDoc(null);
  };

  const handleSave = async (name: string, type: string, otherType: string, content: string) => {
    const isCreate = view === 'create';
    const docMeta = {
      name,
      type,
      otherTypeName: type === 'OTHER' ? otherType : undefined,
      sourceType: 'MARKDOWN' as const,
      visibility: 'API_LEVEL',
      summary: ' ',
    };
    try {
      if (isCreate) {
        await createDoc({ apimId: selectedApimId!, doc: docMeta, content });
        setAlert({ type: 'success', message: 'Document created successfully.' });
      } else {
        await updateDoc({ apimId: selectedApimId!, docId: editingDoc!.documentId, doc: { ...editingDoc!, ...docMeta }, content });
        setAlert({ type: 'success', message: 'Document updated successfully.' });
      }
      setView('list');
      setEditingDoc(null);
    } catch {
      setAlert({ type: 'error', message: isCreate ? 'Failed to create document.' : 'Failed to update document.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDocId || !selectedApimId) return;
    try {
      await deleteDoc({ apimId: selectedApimId, docId: deleteDocId });
      setAlert({ type: 'success', message: 'Document deleted successfully.' });
      if (selectedDocId === deleteDocId) setSelectedDocId(null);
    } catch {
      setAlert({ type: 'error', message: 'Failed to delete document.' });
    }
    setDeleteDocId(null);
    setDeleteConfirmText('');
  };

  const filteredGroupedDocs = useMemo(() => {
    if (!searchQuery.trim()) return groupedDocs;
    const q = searchQuery.toLowerCase();
    const filtered: Record<string, ApiDocument[]> = {};
    for (const [label, docs] of Object.entries(groupedDocs)) {
      const matching = docs.filter((d) => d.name.toLowerCase().includes(q));
      if (matching.length) filtered[label] = matching;
    }
    return filtered;
  }, [groupedDocs, searchQuery]);

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const publishAction = (lifecycleState?.availableTransitions ?? []).find((t) => PUBLISH_ACTIONS.has(t.event))?.event ?? null;

  const handlePublishClick = () => {
    if (!publishAction) return;
    setPublishDisplayName(apimApiInfo?.displayName ?? '');
    setPendingPublish(publishAction);
  };

  const executePublish = async () => {
    if (!pendingPublish || !selectedApimId) return;
    setPendingPublish(null);
    try {
      if (apimApiInfo) {
        const trimmed = publishDisplayName.trim();
        if (trimmed && trimmed !== apimApiInfo.displayName) {
          await updateApim({ apimId: selectedApimId, body: { ...apimApiInfo, displayName: trimmed } });
        }
      }
      await changeState({ action: pendingPublish });
      setAlert({ type: 'success', message: SUCCESS_TEXT[pendingPublish] ?? 'API published successfully.' });
    } catch (err) {
      setAlert({ type: 'error', message: err instanceof Error ? err.message : 'Failed to publish to Developer Portal.' });
    }
  };

  const endpointPicker =
    apimEndpoints.length > 1 ? (
      <Select
        size="small"
        value={selectedApimId ?? ''}
        onChange={(e) => setSelectedApimId(e.target.value as string)}
        inputProps={{ 'aria-label': 'Endpoint' }}
        sx={{
          fontSize: '0.8125rem',
          '& .MuiOutlinedInput-notchedOutline': { borderRadius: 5 },
          '& .MuiSelect-select': { py: 0.5, px: 1.5 },
          minWidth: 160,
        }}>
        {apimEndpoints.map((ep) => (
          <MenuItem key={ep.apimId} value={ep.apimId!}>
            {ep.displayName}
          </MenuItem>
        ))}
      </Select>
    ) : null;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!component) {
    return <NotFound message="Component not found" backTo={resourceUrl(broaden(scope)!, 'overview')} backLabel="Back to Project" />;
  }

  const trackBar = aggregatedTracks.length > 0 && (
    <DeploymentTrackBar tracks={aggregatedTracks} selectedId={selectedTrackId} onChange={setSelectedTrackId} orgHandler={scope.org} projectHandler={project?.handler ?? ''} componentHandler={component.handler} versionView extra={endpointPicker} />
  );

  // ── Create / Edit view ────────────────────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {trackBar}
        <DocFormPage
          view={view}
          initialName={editingDoc?.name ?? ''}
          initialType={editingDoc?.type ?? 'HOWTO'}
          initialOtherType={editingDoc?.otherTypeName ?? ''}
          initialContent={editingInitialContent}
          saving={creating || updating}
          onBack={handleBack}
          onSave={handleSave}
        />
      </Box>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {trackBar}

      <PageContent>
        <Typography variant="h1" sx={{ mb: 3 }}>
          Document
        </Typography>

        {alert && (
          <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 3 }}>
            {alert.message}
          </Alert>
        )}

        <Tabs value={tab} onChange={(_e, v) => setTab(v as number)} sx={{ mb: 0 }}>
          <Tab label="Developer Documents" />
        </Tabs>

        {!selectedApimId ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No published endpoint found for this deployment track. Deploy your component first to manage documents.
            </Typography>
          </Box>
        ) : loadingDocs ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : documents.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1.5 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={40} style={{ opacity: 0.35 }} />
            </Box>
            <Typography variant="body1" color="text.secondary">
              No documents available
            </Typography>
            <Button variant="text" size="small" startIcon={<Plus size={14} />} onClick={openCreate}>
              Create Document
            </Button>
          </Box>
        ) : (
          <>
            {/* Actions bar */}
            <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={1} sx={{ py: 1.5 }}>
              <Button variant="outlined" color="primary" size="small" startIcon={<Plus size={16} />} onClick={openCreate}>
                Create Document
              </Button>
              {selectedDoc && (
                <>
                  <DocEditTrigger apimId={selectedApimId} doc={selectedDoc} onEdit={openEdit} />
                  <Tooltip title="Delete document">
                    <IconButton size="small" sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' }, color: 'error.main' }} onClick={() => setDeleteDocId(selectedDoc.documentId)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <Button variant="contained" color="warning" size="small" disabled={!publishAction || publishing} onClick={handlePublishClick}>
                {publishAction === 'Re-Publish' ? 'Re-Publish To Developer Portal' : 'Publish To Developer Portal'}
              </Button>
            </Stack>

            {/* Two-pane layout */}
            <Paper variant="outlined" sx={{ display: 'flex', overflow: 'hidden', minHeight: 420 }}>
              {/* Left: search + grouped doc list */}
              <Box sx={{ width: 280, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                {/* Search */}
                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.75,
                      bgcolor: 'background.paper',
                    }}>
                    <Search size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
                    <Box
                      component="input"
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      placeholder="Search Documents"
                      sx={{
                        border: 'none',
                        outline: 'none',
                        bgcolor: 'transparent',
                        flex: 1,
                        fontSize: '0.875rem',
                        color: 'text.primary',
                        '&::placeholder': { color: 'text.disabled' },
                      }}
                    />
                  </Box>
                </Box>

                {/* Grouped list */}
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                  {Object.entries(filteredGroupedDocs).map(([label, docs]) => {
                    const collapsed = collapsedGroups.has(label);
                    return (
                      <Box key={label}>
                        {/* Group header with chevron */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between" onClick={() => toggleGroup(label)} sx={{ px: 2, py: 1, mt: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {label}
                          </Typography>
                          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </Stack>

                        {/* Doc items */}
                        {!collapsed &&
                          docs.map((doc) => {
                            const isSelected = selectedDocId === doc.documentId;
                            return (
                              <Box key={doc.documentId} sx={{ px: 1.5, py: 1 }}>
                                <Box
                                  onClick={() => setSelectedDocId(doc.documentId)}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 1.5,
                                    py: 1,
                                    cursor: 'pointer',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                    bgcolor: isSelected ? 'primary.50' : 'background.paper',
                                    '&:hover': { borderColor: 'primary.main', bgcolor: isSelected ? 'primary.50' : 'action.hover' },
                                  }}>
                                  <FileText size={18} style={{ flexShrink: 0, opacity: 0.7 }} />
                                  <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                                    {doc.name}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          })}
                      </Box>
                    );
                  })}
                  {Object.keys(filteredGroupedDocs).length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                      No documents match your search.
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Right: doc content */}
              <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
                {selectedDoc ? (
                  <DocContentPane apimId={selectedApimId} doc={selectedDoc} />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a document to view its content.
                  </Typography>
                )}
              </Box>
            </Paper>
          </>
        )}
      </PageContent>

      {/* Publish confirmation */}
      {pendingPublish && <ConfirmDialog action={pendingPublish} displayName={publishDisplayName} onDisplayNameChange={setPublishDisplayName} onConfirm={() => void executePublish()} onCancel={() => setPendingPublish(null)} isPending={publishing} />}

      {/* Delete confirmation */}
      {(() => {
        const deleteDoc = documents.find((d) => d.documentId === deleteDocId);
        const canDelete = deleteConfirmText === deleteDoc?.name;
        return (
          <Dialog
            open={!!deleteDocId}
            onClose={() => {
              setDeleteDocId(null);
              setDeleteConfirmText('');
            }}
            maxWidth="sm"
            fullWidth>
            <DialogTitle>
              Are you sure you want to remove the document &lsquo;<strong>{deleteDoc?.name}</strong>&rsquo;?
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>This action will be irreversible and all related details will be lost. Please type in the document name below to confirm.</DialogContentText>
              <TextField autoFocus fullWidth placeholder="Enter document name to confirm" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} />
            </DialogContent>
            <DialogActions>
              <Button
                variant="outlined"
                onClick={() => {
                  setDeleteDocId(null);
                  setDeleteConfirmText('');
                }}
                disabled={deleting}>
                Cancel
              </Button>
              <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={!canDelete || deleting} startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : undefined}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        );
      })()}
    </Box>
  );
}
