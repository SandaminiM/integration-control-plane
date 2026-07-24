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

import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CircularProgress, InputAdornment, Link, Skeleton, Stack, TextField, Typography } from '@wso2/oxygen-ui';
import { ArrowUpRight, ChevronDown, Lock } from '@wso2/oxygen-ui-icons-react';
import { useState, type JSX } from 'react';
import { BALLERINA_CENTRAL_TOKEN_INSTRUCTIONS, BALLERINA_CENTRAL_TOKEN_PANEL_COPY as PANEL_COPY } from '../../constants/packageRegistries';
import { useBallerinaCentralToken, useSaveBallerinaCentralToken } from '../../hooks/useBallerinaCentralToken';

interface BallerinaCentralTokenPanelProps {
  tokenInput: string;
  onTokenInputChange: (value: string) => void;
}

export default function BallerinaCentralTokenPanel({ tokenInput, onTokenInputChange }: BallerinaCentralTokenPanelProps): JSX.Element {
  const { data: tokenStatus, isLoading } = useBallerinaCentralToken();
  const saveToken = useSaveBallerinaCentralToken();
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = () => {
    if (!tokenInput.trim()) return;
    saveToken.mutate(tokenInput.trim(), {
      onSuccess: () => {
        onTokenInputChange('');
        setAlert({ type: 'success', message: PANEL_COPY.saveSuccessMessage });
      },
      onError: (err) => setAlert({ type: 'error', message: err.message }),
    });
  };

  if (isLoading) return <Skeleton variant="rounded" height={160} />;

  return (
    <>
      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}
      {!tokenStatus?.configured && (
        <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1.5 }}>
            <Typography variant="h5">{PANEL_COPY.heading}</Typography>
            <Typography variant="body2" color="text.secondary">
              {PANEL_COPY.optionalTag}
            </Typography>
          </Stack>
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            <Typography component="span" variant="body2">
              {PANEL_COPY.warningPrefix}
            </Typography>
          </Alert>

          <Accordion expanded={instructionsOpen} onChange={(_e, expanded) => setInstructionsOpen(expanded)} disableGutters sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ChevronDown size={16} />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {BALLERINA_CENTRAL_TOKEN_INSTRUCTIONS.heading}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack gap={3}>
                <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                  {BALLERINA_CENTRAL_TOKEN_INSTRUCTIONS.steps.map((step) => (
                    <Typography key={step} component="li" variant="body2" sx={{ mb: 1 }}>
                      {step}
                    </Typography>
                  ))}
                </Box>
                <Link href={BALLERINA_CENTRAL_TOKEN_INSTRUCTIONS.linkUrl} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600, width: 'fit-content' }}>
                  {BALLERINA_CENTRAL_TOKEN_INSTRUCTIONS.linkLabel} <ArrowUpRight size={16} />
                </Link>
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Stack gap={1} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {PANEL_COPY.accessTokenLabel}
            </Typography>
            <TextField
              fullWidth
              type="password"
              value={tokenInput}
              onChange={(e) => onTokenInputChange(e.target.value)}
              placeholder={PANEL_COPY.tokenPlaceholder}
              disabled={saveToken.isPending}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={16} />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          <Button variant="contained" disabled={!tokenInput.trim() || saveToken.isPending} onClick={handleSave} startIcon={saveToken.isPending ? <CircularProgress size={14} /> : undefined} sx={{ alignSelf: 'flex-start' }}>
            {PANEL_COPY.saveLabel}
          </Button>
        </Card>
      )}
    </>
  );
}
