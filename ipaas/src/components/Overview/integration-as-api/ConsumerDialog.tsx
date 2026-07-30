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
import { INVOKE_URL_PLACEHOLDER, REGENERATE_SUBSCRIPTION_WARNING, SUBSCRIPTION_KEY_HEADER, TOKEN_MASK, UNSUBSCRIBE_WARNING } from '../../../constants/apiConsumption';
import { useCreateConsumer, useRegenerateConsumerToken, useRevokeConsumer, useSubscription } from '../../../hooks/useConsumers';
import type { Consumer, EndpointRef } from '../../../types/consumers';
import { consumerDisplayName, subscriptionCurl } from '../../../utils/apiConsumption';
import { friendlyApiError } from '../../../utils/apiSecurity';
import ConfirmDeleteDialog from '../../ConfirmDeleteDialog';
import CopyButton from './CopyButton';
import * as styles from './apiConsumption.styles';

type ConfirmAction = 'regenerate' | 'unsubscribe';

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
 * one. The credential is the subscription token, sent as `Subscription-Key`.
 */
export default function ConsumerDialog({ open, onClose, projectName, endpointRef, envLabel, consumer, endpointUrl }: ConsumerDialogProps): JSX.Element {
  const createMutation = useCreateConsumer(projectName);
  const regenMutation = useRegenerateConsumerToken(projectName, endpointRef);
  const revokeMutation = useRevokeConsumer(projectName, endpointRef);

  const [appName, setAppName] = useState('');
  const [description, setDescription] = useState('');
  const [revealToken, setRevealToken] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The consumer in view and its subscription are server state, so they are
  // derived from the mutations rather than mirrored into local state.
  const consumerInView = consumer ?? createMutation.data ?? null;
  const subscription = regenMutation.data ?? consumerInView?.subscription ?? null;

  // Create and regenerate return the token; the list route does not, so an
  // existing consumer's token has to be re-read from the single subscription.
  const { data: fetchedSubscription, isLoading: loadingToken, error: tokenError } = useSubscription(consumerInView?.application.id, subscription?.id, open && !!subscription && !subscription.token);
  const token = subscription?.token ?? fetchedSubscription?.token ?? '';

  useEffect(() => {
    if (!open) return;
    setAppName('');
    setDescription('');
    setRevealToken(false);
    setConfirm(null);
    setError(null);
    createMutation.reset();
    regenMutation.reset();
    revokeMutation.reset();
    // Mutation objects are new each render, so they cannot be dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, consumer]);

  const handleCreate = async () => {
    if (!appName.trim()) return;
    setError(null);
    try {
      await createMutation.mutateAsync({ ...endpointRef, projectName, appName: appName.trim(), description: description.trim() || undefined });
    } catch (err) {
      setError(friendlyApiError(err, 'Could not create the consumer application.'));
    }
  };

  const handleConfirm = async () => {
    if (!consumerInView || !subscription) return;
    const target = { applicationId: consumerInView.application.id, subscriptionId: subscription.id };
    setError(null);
    try {
      if (confirm === 'regenerate') {
        await regenMutation.mutateAsync(target);
        setRevealToken(false);
      } else {
        await revokeMutation.mutateAsync(target);
        onClose();
      }
      setConfirm(null);
    } catch (err) {
      setError(friendlyApiError(err, confirm === 'regenerate' ? 'Could not regenerate the subscription key.' : 'Could not unsubscribe this application.'));
    }
  };

  const busy = createMutation.isPending || regenMutation.isPending || revokeMutation.isPending;
  const isCreate = !consumerInView;
  const name = consumerInView ? consumerDisplayName(consumerInView) : '';
  const url = endpointUrl || INVOKE_URL_PLACEHOLDER;
  // The snippet is in plain view, so it honours the reveal toggle; copy always
  // carries the real token.
  const curlDisplay = subscriptionCurl(url, token && !revealToken ? TOKEN_MASK : token);
  const curlCopy = subscriptionCurl(url, token);

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={styles.dialogTitle}>
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Typography variant="h6" component="span">
            {isCreate ? 'New Consumer Application' : name}
          </Typography>
          <Chip label={envLabel} size="small" color="success" variant="outlined" sx={styles.envChip} />
        </Stack>
        <IconButton size="small" onClick={onClose} disabled={busy} aria-label="Close">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent>
        {error && (
          <Alert severity="error" sx={styles.dialogAlert}>
            {error}
          </Alert>
        )}

        {isCreate ? (
          <>
            <Typography sx={styles.fieldLabel}>
              {/* The label sits outside the field, so the required marker is rendered here. */}
              <span>
                Consumer Application Name
                <Box component="span" sx={styles.requiredMark} aria-hidden="true">
                  *
                </Box>
              </span>
            </Typography>
            <TextField value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="e.g. my-greeting-client" size="small" fullWidth autoFocus required disabled={busy} />

            <Typography sx={styles.nextFieldLabel}>Description (optional)</Typography>
            <TextField value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What calls this API?" size="small" fullWidth disabled={busy} />
          </>
        ) : (
          <Stack gap={2}>
            <Box>
              <Typography sx={styles.fieldLabel}>
                <span>Subscription Key</span>
                <span>header: {SUBSCRIPTION_KEY_HEADER}</span>
              </Typography>
              {loadingToken ? (
                <Box sx={styles.centredRow}>
                  <CircularProgress size={18} />
                </Box>
              ) : token ? (
                <Box sx={styles.credField}>
                  <Typography component="span" sx={styles.credValue}>
                    {revealToken ? token : TOKEN_MASK}
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
                <CopyButton value={curlCopy} />
              </Box>
              <Box component="pre" sx={styles.codePre}>
                {curlDisplay}
              </Box>
            </Box>

            <Stack direction="row" alignItems="center" gap={0.75} sx={styles.subscribedNote}>
              <Check size={15} />
              <Typography variant="body2">
                {name} is subscribed to this API in {envLabel}.
              </Typography>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={styles.dialogActions}>
        {isCreate ? (
          <>
            <Button variant="outlined" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button variant="contained" onClick={() => void handleCreate()} disabled={!appName.trim() || busy} startIcon={createMutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}>
              Create &amp; subscribe
            </Button>
          </>
        ) : (
          <>
            <Stack direction="row" gap={1}>
              <Button variant="outlined" onClick={() => setConfirm('regenerate')} disabled={busy}>
                Regenerate
              </Button>
              <Button variant="outlined" color="error" onClick={() => setConfirm('unsubscribe')} disabled={busy}>
                Unsubscribe
              </Button>
            </Stack>
            <Button variant="contained" onClick={onClose} disabled={busy}>
              Done
            </Button>
          </>
        )}
      </DialogActions>

      {confirm && (
        <ConfirmDeleteDialog
          title={confirm === 'regenerate' ? 'Regenerate subscription key?' : 'Unsubscribe this application?'}
          onConfirm={() => void handleConfirm()}
          onClose={() => setConfirm(null)}
          isPending={busy}
          confirmLabel={confirm === 'regenerate' ? 'Regenerate' : 'Unsubscribe'}
          pendingLabel={confirm === 'regenerate' ? 'Regenerating…' : 'Unsubscribing…'}
          maxWidth="xs">
          <Typography variant="body2" color="text.secondary">
            {confirm === 'regenerate' ? REGENERATE_SUBSCRIPTION_WARNING : UNSUBSCRIBE_WARNING}
          </Typography>
        </ConfirmDeleteDialog>
      )}
    </Dialog>
  );
}
