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

import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Stack, TextField, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Check, Eye, EyeOff, X } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useState, type JSX } from 'react';
import { useCreateConsumer, useRegenerateConsumerToken, useRevokeConsumer, useSubscription } from '../../../hooks/useConsumers';
import type { Consumer, EndpointRef, Subscription } from '../../../types/consumers';
import { friendlyApiError } from '../../../utils/apiSecurity';
import CopyButton from './CopyButton';
import * as styles from './apiConsumption.styles';

interface ConsumerDialogProps {
  open: boolean;
  onClose: () => void;
  /** Project handle the consumer application belongs to. */
  projectName: string;
  /** The endpoint whose exposed API the consumer subscribes to. */
  endpointRef: EndpointRef;
  /** Display label shown in the header badge. */
  envLabel: string;
  /** Existing consumer to manage; `null` opens the create form. */
  consumer: Consumer | null;
  /** Base invoke URL used to build the test call snippet. */
  endpointUrl?: string;
}

/**
 * Create a consumer application subscribed to this API, or manage an existing
 * one. The credential is the subscription token — sent as `Subscription-Key`.
 */
export default function CredentialsDialog({ open, onClose, projectName, endpointRef, envLabel, consumer, endpointUrl }: ConsumerDialogProps): JSX.Element {
  const createMutation = useCreateConsumer(projectName);
  const regenMutation = useRegenerateConsumerToken(projectName, endpointRef);
  const revokeMutation = useRevokeConsumer(projectName, endpointRef);

  const [appName, setAppName] = useState('');
  const [description, setDescription] = useState('');
  /** The consumer being shown — the one passed in, or the one just created. */
  const [issued, setIssued] = useState<Consumer | null>(consumer);
  /** Token from create/regenerate; preferred over the fetched subscription. */
  const [freshSubscription, setFreshSubscription] = useState<Subscription | null>(null);
  const [revealToken, setRevealToken] = useState(false);
  const [confirm, setConfirm] = useState<'regen' | 'revoke' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The list route omits the token, so the single subscription is re-read here.
  const needsFetch = !!issued && !freshSubscription;
  const { data: fetchedSubscription, isLoading: loadingToken, error: tokenError } = useSubscription(issued?.application.id, issued?.subscription.id, open && needsFetch);

  const subscription = freshSubscription ?? fetchedSubscription ?? issued?.subscription ?? null;
  const token = subscription?.token ?? '';

  // Reset the whole dialog whenever it (re)opens or targets a different consumer.
  useEffect(() => {
    if (!open) return;
    setIssued(consumer);
    setFreshSubscription(null);
    setAppName('');
    setDescription('');
    setRevealToken(false);
    setConfirm(null);
    setError(null);
  }, [open, consumer]);

  const handleCreate = async () => {
    if (!appName.trim()) return;
    setError(null);
    try {
      const created = await createMutation.mutateAsync({ ...endpointRef, projectName, appName: appName.trim(), description: description.trim() || undefined });
      setIssued(created);
      setFreshSubscription(created.subscription);
    } catch (err) {
      setError(friendlyApiError(err, 'Could not create the consumer application.'));
    }
  };

  const handleConfirm = async () => {
    if (!issued) return;
    setError(null);
    try {
      if (confirm === 'regen') {
        const updated = await regenMutation.mutateAsync({ applicationId: issued.application.id, subscriptionId: issued.subscription.id });
        setIssued({ ...issued, subscription: updated });
        setFreshSubscription(updated);
        setRevealToken(false);
        setConfirm(null);
      } else if (confirm === 'revoke') {
        await revokeMutation.mutateAsync({ applicationId: issued.application.id, subscriptionId: issued.subscription.id });
        setConfirm(null);
        onClose();
      }
    } catch (err) {
      setError(friendlyApiError(err, confirm === 'regen' ? 'Could not regenerate the subscription key.' : 'Could not unsubscribe this application.'));
    }
  };

  const busy = createMutation.isPending || regenMutation.isPending || revokeMutation.isPending;
  const isCreate = !issued;
  const name = issued?.application.displayName || issued?.application.id || '';
  const url = endpointUrl || 'https://<gateway-host>/<api-context>';
  const curl = `curl '${url}' \\\n  -H 'Subscription-Key: ${token || '<subscription-token>'}'`;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Typography variant="h6" component="span">
            {isCreate ? 'New Consumer Application' : name}
          </Typography>
          <Chip label={envLabel} size="small" color="success" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
        </Stack>
        <IconButton size="small" onClick={onClose} disabled={busy} aria-label="Close">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isCreate ? (
          <>
            <Typography sx={styles.fieldLabel}>
              {/* The label lives outside the field, so the required marker is rendered
                  here rather than via MuiFormLabel-asterisk. */}
              <span>
                Consumer Application Name
                <Box component="span" sx={{ color: 'error.main', ml: 0.25 }} aria-hidden="true">
                  *
                </Box>
              </span>
            </Typography>
            <TextField value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="e.g. my-greeting-client" size="small" fullWidth autoFocus required disabled={busy} />

            <Typography sx={{ ...styles.fieldLabel, mt: 2.5 }}>Description (optional)</Typography>
            <TextField value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What calls this API?" size="small" fullWidth disabled={busy} />
          </>
        ) : (
          <Stack gap={2}>
            <Box>
              <Typography sx={styles.fieldLabel}>
                <span>Subscription Key</span>
                <span style={{ fontWeight: 400 }}>header: Subscription-Key</span>
              </Typography>
              {loadingToken ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                  <CircularProgress size={18} />
                </Box>
              ) : token ? (
                <Box sx={styles.credField}>
                  <Typography component="span" sx={styles.credValue}>
                    {revealToken ? token : '•'.repeat(28)}
                  </Typography>
                  <Tooltip title={revealToken ? 'Hide' : 'Reveal'}>
                    <IconButton size="small" onClick={() => setRevealToken((v) => !v)}>
                      {revealToken ? <EyeOff size={15} /> : <Eye size={15} />}
                    </IconButton>
                  </Tooltip>
                  <CopyButton value={token} />
                </Box>
              ) : (
                <Alert severity="warning">{friendlyApiError(tokenError, 'The subscription key could not be read. Regenerate it to issue a new one.')}</Alert>
              )}
            </Box>

            <Box sx={styles.codeBox}>
              <Box sx={styles.codeHead}>
                <Typography variant="caption" color="text.secondary">
                  Test call · {envLabel}
                </Typography>
                <CopyButton value={curl} />
              </Box>
              <Box component="pre" sx={styles.codePre}>
                {curl}
              </Box>
            </Box>

            <Stack direction="row" alignItems="center" gap={0.75} sx={{ color: 'success.main' }}>
              <Check size={15} />
              <Typography variant="body2">
                {name} is subscribed to this API in {envLabel}.
              </Typography>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
        {isCreate ? (
          <>
            <Button variant="outlined" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreate} disabled={!appName.trim() || busy} startIcon={createMutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}>
              Create &amp; subscribe
            </Button>
          </>
        ) : (
          <>
            <Stack direction="row" gap={1}>
              <Button variant="outlined" onClick={() => setConfirm('regen')} disabled={busy}>
                Regenerate
              </Button>
              <Button variant="outlined" color="error" onClick={() => setConfirm('revoke')} disabled={busy}>
                Unsubscribe
              </Button>
            </Stack>
            <Button variant="contained" onClick={onClose} disabled={busy}>
              Done
            </Button>
          </>
        )}
      </DialogActions>

      {/* Confirm dialog for regenerate / unsubscribe. */}
      <Dialog open={confirm !== null} onClose={busy ? undefined : () => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{confirm === 'regen' ? 'Regenerate subscription key?' : 'Unsubscribe this application?'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirm === 'regen'
              ? 'The subscription is revoked and re-created, so the current Subscription-Key stops working immediately. Any consumer using it must switch to the new value.'
              : 'This revokes the subscription and its token. Calls using it will fail once subscription validation is enforced. The application itself is kept and can be subscribed again.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setConfirm(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="contained" color={confirm === 'revoke' ? 'error' : 'primary'} onClick={handleConfirm} disabled={busy} startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}>
            {confirm === 'regen' ? 'Regenerate' : 'Unsubscribe'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
