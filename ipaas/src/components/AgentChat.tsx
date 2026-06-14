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

import { Alert, Avatar, Box, Button, CircularProgress, IconButton, InputBase, Stack, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Check, Copy, Send, Sparkles, User } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useEnvEndpoints } from '../hooks/useDeployments';
import { useApimApi, useGenerateTestKey } from '../hooks/useApim';
import { generateUUID } from '../utils/string';
import type { AgentConnectionStatus, ChatMessage } from '../types/agentChat';

interface AgentChatProps {
  componentId: string;
  versionId: string;
  /** The deployment's release id for the selected environment. */
  releaseId: string;
  /** Critical (production) envs cannot be chatted with — see devant parity. */
  envCritical: boolean;
  /** Disable input while the env is still waiting on configuration. */
  waitForConfig?: boolean;
  /** `'page'` fills available height (Test page); `'card'` is compact (env card). */
  variant?: 'card' | 'page';
  /** Reports endpoint-discovery + auth readiness so the host can show a chip. */
  onConnectionChange?: (status: AgentConnectionStatus) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AgentChat({ componentId, versionId, releaseId, envCritical, waitForConfig = false, variant = 'card', onConnectionChange }: AgentChatProps): ReactNode {
  const { data: endpoints = [] } = useEnvEndpoints(componentId, versionId, releaseId);

  // Candidate chat endpoint: the first reachable one that ALSO has an APIM id —
  // the test key is minted per APIM API, so a key-less endpoint can never
  // authenticate. devant likewise skips endpoints without an apimId. (The
  // `/chat` operation is confirmed below only for a hint; we still use the
  // endpoint if APIM doesn't surface its operations.)
  const candidate = useMemo(() => endpoints.find((e) => e.publicUrl && e.apimId) ?? null, [endpoints]);
  const { data: apimApi } = useApimApi(candidate?.apimId);
  const hasChatOperation = apimApi?.operations?.some((op) => op.target === '/chat') ?? false;
  const chatUrl = candidate?.publicUrl ?? '';
  const apimId = candidate?.apimId ?? null;

  const generateKey = useGenerateTestKey();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const fetchTestKey = useMemo(
    () => async (): Promise<string | null> => {
      if (!apimId) return null;
      setAuthError(false);
      try {
        const result = await generateKey.mutateAsync({ apimId, keyType: envCritical ? 'Production' : 'Development' });
        const key = result?.apikey ?? null;
        setApiKey(key);
        if (!key) setAuthError(true);
        return key;
      } catch {
        setAuthError(true);
        return null;
      }
    },
    // generateKey is a stable mutation object; apimId/envCritical drive identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apimId, envCritical],
  );

  useEffect(() => {
    if (apimId) fetchTestKey();
  }, [apimId, fetchTestKey]);

  // Connection status, reported up to the host (Test page shows it as a chip).
  const connectionStatus: AgentConnectionStatus = authError ? 'error' : apiKey && chatUrl ? 'connected' : 'connecting';
  useEffect(() => {
    onConnectionChange?.(connectionStatus);
  }, [connectionStatus, onConnectionChange]);

  const sessionId = useMemo(() => generateUUID(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Keep the thread scrolled to the latest message.
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, isSending]);

  const canSend = !!apiKey && !!chatUrl && !isSending && !waitForConfig;

  const pushMessage = (role: ChatMessage['role'], content: string) => setMessages((prev) => [...prev, { role, content, time: Date.now() }]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx((cur) => (cur === idx ? null : cur)), 1500);
  };

  const send = async (message: string, allowKeyRefresh = true, keyOverride?: string | null): Promise<void> => {
    const key = keyOverride ?? apiKey;
    if (!chatUrl || !key) return;
    setChatError(null);
    setIsSending(true);
    try {
      const response = await fetch(`${chatUrl}/chat`, {
        method: 'POST',
        headers: { 'test-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message }),
      });

      if (response.status === 401 && allowKeyRefresh && apimId) {
        // Key likely expired — regenerate once and retry with the fresh key
        // passed directly; a setApiKey state update wouldn't reach this
        // closure in time. If we can't refresh, fall through to surface the 401.
        const fresh = await fetchTestKey();
        if (fresh) {
          await send(message, false, fresh);
          return;
        }
      }
      if (!response.ok) {
        setChatError(`HTTP ${response.status} ${response.statusText}`);
        return;
      }

      const body = await response.text();
      let assistant = body;
      try {
        assistant = JSON.parse(body).message ?? body;
      } catch {
        /* plain-text response */
      }
      pushMessage('assistant', assistant);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setChatError(msg.includes('Failed to fetch') ? 'Agent is inactive. Please try again.' : `Failed to connect: ${msg}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => {
    const message = input.trim();
    if (!message || !canSend) return;
    setInput('');
    pushMessage('user', message);
    send(message);
  };

  // Critical (production) environments: chat is intentionally unavailable.
  if (envCritical) {
    return <Alert severity="info">AI agent chat isn&apos;t available in production environments. Test your agent in a non-critical environment such as Development.</Alert>;
  }

  const noEndpoint = endpoints.length > 0 && !chatUrl;
  const isPage = variant === 'page';

  return (
    <Stack gap={1.5} sx={{ minHeight: 0, width: '100%' }}>
      {chatError && (
        <Alert severity="error" onClose={() => setChatError(null)}>
          {chatError}
        </Alert>
      )}
      {authError && <Alert severity="warning">Could not authenticate with the agent. Check your permissions and try again.</Alert>}
      {noEndpoint && <Alert severity="info">No chat endpoint found for this agent.</Alert>}
      {!noEndpoint && !hasChatOperation && chatUrl && messages.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          No <code>/chat</code> operation was detected on this agent — messages are sent to <code>{chatUrl}/chat</code>.
        </Typography>
      )}

      <Box
        ref={threadRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          minHeight: isPage ? 280 : 180,
          maxHeight: isPage ? 560 : 360,
          overflowY: 'auto',
          p: 4,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}>
        {messages.length === 0 && !isSending && (
          <Stack alignItems="center" justifyContent="center" gap={1} sx={{ flex: 1, py: 4 }}>
            <Sparkles size={24} style={{ opacity: 0.4 }} />
            <Typography variant="body2" color="text.secondary">
              Send a message to start chatting with your agent.
            </Typography>
          </Stack>
        )}

        {messages.map((m, idx) =>
          m.role === 'user' ? (
            // User: right-aligned grey bubble, avatar on the far right.
            <Stack key={`${sessionId}-${idx}`} direction="row" justifyContent="flex-end" gap={1.25} sx={{ alignItems: 'flex-start' }}>
              <Stack alignItems="flex-end" gap={0.5} sx={{ maxWidth: '80%' }}>
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(m.time)}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    You
                  </Typography>
                </Stack>
                <Box sx={{ px: 2, py: 1.25, bgcolor: 'action.hover', borderRadius: 2, borderTopRightRadius: 4 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {m.content}
                  </Typography>
                </Box>
              </Stack>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'action.hover', color: 'text.secondary' }}>
                <User size={16} />
              </Avatar>
            </Stack>
          ) : (
            // Agent: left-aligned bordered bubble + copy action, avatar on the left.
            <Stack key={`${sessionId}-${idx}`} direction="row" gap={1.25} sx={{ alignItems: 'flex-start' }}>
              <Avatar sx={{ width: 32, height: 32, color: 'primary.main', bgcolor: (theme) => `${theme.palette.primary.main}1f` }}>
                <Sparkles size={16} />
              </Avatar>
              <Stack gap={0.5} sx={{ maxWidth: '80%' }}>
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Agent
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(m.time)}
                  </Typography>
                </Stack>
                <Box sx={{ px: 2, py: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 2, borderTopLeftRadius: 4 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {m.content}
                  </Typography>
                </Box>
                <Tooltip title={copiedIdx === idx ? 'Copied' : 'Copy'}>
                  <IconButton size="small" onClick={() => handleCopy(m.content, idx)} sx={{ alignSelf: 'flex-start', color: 'text.secondary' }} aria-label="Copy message">
                    {copiedIdx === idx ? <Check size={14} /> : <Copy size={14} />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          ),
        )}

        {isSending && (
          <Stack direction="row" gap={1.25} sx={{ alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 32, height: 32, color: 'primary.main', bgcolor: (theme) => `${theme.palette.primary.main}1f` }}>
              <Sparkles size={16} />
            </Avatar>
            <Stack direction="row" gap={1} alignItems="center" sx={{ py: 1 }}>
              <CircularProgress size={14} />
              <Typography variant="caption" color="text.secondary">
                Agent is typing…
              </Typography>
            </Stack>
          </Stack>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2, pr: 0.75, py: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
        <InputBase
          fullWidth
          multiline
          maxRows={4}
          placeholder={generateKey.isPending && !apiKey ? 'Authenticating…' : 'Message your agent…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={!canSend && !input}
          sx={{ flex: 1, fontSize: 14 }}
        />
        <Button variant="contained" startIcon={<Send size={16} />} onClick={handleSend} disabled={!canSend || !input.trim()} sx={{ borderRadius: 2, px: 2, flexShrink: 0 }}>
          Send
        </Button>
      </Box>
    </Stack>
  );
}
