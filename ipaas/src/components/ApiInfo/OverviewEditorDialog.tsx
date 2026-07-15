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

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@wso2/oxygen-ui';
import MonacoEditor from '@monaco-editor/react';
import { useEffect, useState, type JSX } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface OverviewEditorDialogProps {
  open: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

export default function OverviewEditorDialog({ open, value, onClose, onConfirm }: OverviewEditorDialogProps): JSX.Element {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pb: 0.5 }}>Overview</DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Provide the content for the marketplace overview section using <strong>Markdown</strong> formatting.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', height: 480 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ px: 1.5, py: 0.75, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600, color: 'text.secondary' }}>
              Edit
            </Typography>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <MonacoEditor
                height="100%"
                language="markdown"
                theme="vs"
                value={draft}
                onChange={(val) => setDraft(val ?? '')}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  quickSuggestions: false,
                  acceptSuggestionOnCommitCharacter: false,
                  fontSize: 13,
                }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" sx={{ px: 1.5, py: 0.75, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600, color: 'text.secondary' }}>
              Preview
            </Typography>
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                '& h1,& h2,& h3,& h4': { mt: 1, mb: 0.5 },
                '& p': { mt: 0, mb: 1 },
                '& ul,& ol': { pl: 2.5 },
                '& code': { fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 },
                '& pre': { bgcolor: 'action.hover', p: 1.5, borderRadius: 1, overflow: 'auto' },
              }}>
              {draft ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                  Nothing to preview
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => onConfirm(draft)}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
