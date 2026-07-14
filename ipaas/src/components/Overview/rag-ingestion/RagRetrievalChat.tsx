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

import { Alert, Avatar, Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, InputBase, ListingTable, Stack, TablePagination, Typography } from '@wso2/oxygen-ui';
import { Search, Send, User } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRagRetrievalService } from '../../../hooks/useRagRetrievalService';
import { DEFAULT_RETRIEVAL_QUERY } from '../../../constants/ragIngestion';
import { generateUUID } from '../../../utils/string';
import type { RetrievedChunk, RetrieveResponse } from '../../../types/ragIngestion';

/** Inline chat shows only this many chunks; the rest open in a paginated modal. */
const PREVIEW_ROWS = 3;
const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];

/** The Source/Text table used both inline (preview) and inside the "See all" modal. */
function ChunksTable({ chunks }: { chunks: RetrievedChunk[] }): ReactNode {
  return (
    <ListingTable.Container elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <ListingTable size="small">
        <ListingTable.Head>
          <ListingTable.Row>
            <ListingTable.Cell sx={{ width: '30%' }}>Source</ListingTable.Cell>
            <ListingTable.Cell>Text</ListingTable.Cell>
          </ListingTable.Row>
        </ListingTable.Head>
        <ListingTable.Body>
          {chunks.map((c, i) => (
            <ListingTable.Row key={`${c.source}-${i}`}>
              <ListingTable.Cell>
                <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                  {c.source}
                </Typography>
              </ListingTable.Cell>
              <ListingTable.Cell>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {c.text}
                </Typography>
              </ListingTable.Cell>
            </ListingTable.Row>
          ))}
        </ListingTable.Body>
      </ListingTable>
    </ListingTable.Container>
  );
}

/** Modal listing every retrieved chunk for one query, paginated. */
function ChunksModal({ chunks, onClose }: { chunks: RetrievedChunk[] | null; onClose: () => void }): ReactNode {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const open = chunks !== null;
  const safePage = chunks ? Math.min(page, Math.max(0, Math.ceil(chunks.length / rowsPerPage) - 1)) : 0;
  const paged = chunks ? chunks.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage) : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth TransitionProps={{ onExited: () => setPage(0) }}>
      <DialogTitle>Retrieved Chunks ({chunks?.length ?? 0})</DialogTitle>
      <DialogContent>
        <ChunksTable chunks={paged} />
        <TablePagination
          component="div"
          count={chunks?.length ?? 0}
          page={safePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onPageChange={(_e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

interface RagRetrievalChatProps {
  /** The ingestion component — its id is sent as `rag_component_id`. */
  ingestionComponentId: string;
  orgHandler: string;
  projectId: string;
  envId: string;
  envCritical: boolean;
}

interface ChatEntry {
  id: string;
  query: string;
  chunks: RetrievedChunk[];
  isPending: boolean;
  error?: string;
}

/**
 * The Retrieval tab: a chat window that queries the project's RAG Retrieval
 * Service for the chunks most relevant to a question. It POSTs only the
 * ingestion component id + query params — the service resolves the vector-store
 * and embedding configuration server-side. Mirrors devant's RAGChatWindow.
 */
export default function RagRetrievalChat({ ingestionComponentId, orgHandler, projectId, envId, envCritical }: RagRetrievalChatProps): ReactNode {
  const target = useRagRetrievalService(orgHandler, projectId, envId, envCritical);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [modalChunks, setModalChunks] = useState<RetrievedChunk[] | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, isRetrieving]);

  const canSend = target.canQuery && !isRetrieving;

  const send = async () => {
    const query = input.trim();
    if (!query || !canSend) return;
    setInput('');
    const id = generateUUID();
    setMessages((prev) => [...prev, { id, query, chunks: [], isPending: true }]);
    setIsRetrieving(true);

    const body = new URLSearchParams();
    body.append('rag_component_id', ingestionComponentId);
    body.append('user_query', query);
    body.append('max_retrieve_chunks', String(DEFAULT_RETRIEVAL_QUERY.maxChunks));
    body.append('min_similarity_threshold', String(DEFAULT_RETRIEVAL_QUERY.minSimilarity));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(`${target.invokeUrl.replace(/\/$/, '')}/retrieve`, {
        method: 'POST',
        headers: { 'test-key': target.apiKey ?? '', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as RetrieveResponse;
      const chunks = data.retrieved_chunks ?? [];
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isPending: false, chunks } : m)));
    } catch (err) {
      let message = 'Failed to retrieve chunks. Please try again.';
      if (err instanceof DOMException && err.name === 'AbortError') message = 'The retrieval request timed out. Please try again.';
      else if (err instanceof Error && err.message.includes('Failed to fetch')) message = 'The retrieval service is unreachable. Please try again.';
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isPending: false, error: message } : m)));
    } finally {
      clearTimeout(timeout);
      setIsRetrieving(false);
    }
  };

  return (
    <Stack gap={1.5} sx={{ width: '100%' }}>
      {!target.canQuery && target.disabledReason && (
        <Alert severity={target.serviceExists ? 'info' : 'warning'} icon={target.isResolving ? <CircularProgress size={16} /> : undefined}>
          {target.disabledReason}
        </Alert>
      )}

      <Box
        ref={threadRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          minHeight: 260,
          maxHeight: 480,
          overflowY: 'auto',
          p: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}>
        {messages.length === 0 && (
          <Stack alignItems="center" justifyContent="center" gap={1} sx={{ flex: 1, py: 4 }}>
            <Search size={24} style={{ opacity: 0.4 }} />
            <Typography variant="body2" color="text.secondary">
              Type a query to retrieve the most relevant chunks from your vector store.
            </Typography>
          </Stack>
        )}

        {messages.map((m) => (
          <Stack key={m.id} gap={1.5}>
            {/* User query bubble — right aligned */}
            <Stack direction="row" justifyContent="flex-end" gap={1.25} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ px: 2, py: 1.25, bgcolor: 'action.hover', borderRadius: 2, borderTopRightRadius: 4, maxWidth: '80%' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {m.query}
                </Typography>
              </Box>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'action.hover', color: 'text.secondary' }}>
                <User size={16} />
              </Avatar>
            </Stack>

            {/* Response — pending spinner, error, or the chunks table */}
            {m.isPending ? (
              <Stack direction="row" gap={1} alignItems="center" sx={{ py: 0.5 }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">
                  Retrieving…
                </Typography>
              </Stack>
            ) : m.error ? (
              <Alert severity="error">{m.error}</Alert>
            ) : (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                  {m.chunks.length} chunk{m.chunks.length === 1 ? '' : 's'} retrieved
                </Typography>
                {m.chunks.length > 0 && (
                  <>
                    <ChunksTable chunks={m.chunks.slice(0, PREVIEW_ROWS)} />
                    {m.chunks.length > PREVIEW_ROWS && (
                      <Typography variant="caption" color="primary" onClick={() => setModalChunks(m.chunks)} sx={{ display: 'inline-block', mt: 0.75, cursor: 'pointer', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
                        See all {m.chunks.length} results
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            )}
          </Stack>
        ))}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pl: 2,
          pr: 0.75,
          py: 0.75,
          border: '1px solid',
          borderColor: inputFocused ? 'primary.main' : 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          transition: 'border-color 0.15s ease',
        }}>
        <InputBase
          fullWidth
          multiline
          maxRows={4}
          placeholder={target.canQuery ? 'Type your query and press Enter…' : 'Retrieval unavailable'}
          inputProps={{ 'aria-label': 'Query' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={!canSend && !input}
          sx={{ flex: 1, fontSize: 14 }}
        />
        <Button variant="contained" startIcon={isRetrieving ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />} onClick={send} disabled={!canSend || !input.trim()} sx={{ borderRadius: 2, px: 2, flexShrink: 0 }}>
          Send
        </Button>
      </Box>

      <ChunksModal chunks={modalChunks} onClose={() => setModalChunks(null)} />
    </Stack>
  );
}
