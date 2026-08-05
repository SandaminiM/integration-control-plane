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

import { Alert, Box, Button, Chip, CircularProgress, Drawer, IconButton, Stack, TextField, Tooltip, Typography } from '@wso2/oxygen-ui';
import { Eye, EyeOff, X } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useState, type JSX } from 'react';
import { DEFAULT_API_KEY_HEADER, REGENERATE_SUBSCRIPTION_WARNING, TOKEN_MASK, UNSUBSCRIBE_WARNING } from '../../../constants/apiConsumption';
import { useCreateConsumer, useRegenerateConsumerToken, useRevokeConsumer } from '../../../hooks/useConsumers';
import type { Consumer, EndpointRef } from '../../../types/consumers';
import { consumerDisplayName } from '../../../utils/apiConsumption';
import { friendlyApiError } from '../../../utils/apiSecurity';
import ConfirmDeleteDialog from '../../ConfirmDeleteDialog';
import CopyButton from './CopyButton';
import * as styles from './apiConsumption.styles';

type ConfirmAction = 'regenerate' | 'unsubscribe';

interface ConsumerDrawerProps {
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
}

/**
 * Right drawer for creating a consumer application subscribed to this API, or
 * managing an existing one. The name is captured first; generating credentials
 * subscribes the application and reveals its key below, after which the name is
 * fixed. The credential is the subscription token, sent as `Subscription-Key`.
 */
export default function ConsumerDrawer({ open, onClose, projectName, endpointRef, envLabel, consumer }: ConsumerDrawerProps): JSX.Element {
  const createMutation = useCreateConsumer(projectName);
  const regenMutation = useRegenerateConsumerToken(projectName, endpointRef);
  const revokeMutation = useRevokeConsumer(projectName, endpointRef);

  const [appName, setAppName] = useState('');
  const [revealToken, setRevealToken] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The consumer in view and its subscription are server state, so they are
  // derived from the mutations rather than mirrored into local state.
  const consumerInView = consumer ?? createMutation.data ?? null;
  const subscription = regenMutation.data ?? consumerInView?.subscription ?? null;

  // The plaintext api-key is returned only once (on create/regenerate). A consumer opened from
  // the list has no retrievable key — the user regenerates to issue a fresh one.
  const token = subscription?.token ?? '';

  useEffect(() => {
    if (!open) return;
    setAppName(consumer ? consumerDisplayName(consumer) : '');
    setRevealToken(false);
    setConfirm(null);
    setError(null);
    createMutation.reset();
    regenMutation.reset();
    revokeMutation.reset();
    // Mutation objects are new each render, so they cannot be dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, consumer]);

  const handleGenerate = async () => {
    if (!appName.trim()) return;
    setError(null);
    try {
      await createMutation.mutateAsync({ ...endpointRef, projectName, appName: appName.trim() });
    } catch (err) {
      setError(friendlyApiError(err, 'Could not create the consumer application.'));
    }
  };

  const handleConfirm = async () => {
    if (!consumerInView || !subscription) return;
    const keyName = subscription.id;
    setError(null);
    try {
      if (confirm === 'regenerate') {
        await regenMutation.mutateAsync({ keyName, displayName: consumerDisplayName(consumerInView) });
        setRevealToken(false);
      } else {
        await revokeMutation.mutateAsync({ keyName });
        onClose();
      }
      setConfirm(null);
    } catch (err) {
      setError(friendlyApiError(err, confirm === 'regenerate' ? 'Could not regenerate the API key.' : 'Could not revoke this API key.'));
    }
  };

  const busy = createMutation.isPending || regenMutation.isPending || revokeMutation.isPending;
  // Credentials exist once the application is subscribed — the name is fixed from then on.
  const hasCredentials = !!consumerInView;

  return (
    <Drawer anchor="right" open={open} onClose={busy ? undefined : onClose} variant="temporary" sx={styles.rightDrawer}>
      <Box sx={styles.drawerFrame}>
        <Box sx={styles.drawerHeader}>
          <Stack direction="row" alignItems="center" gap={1.25}>
            <Typography variant="subtitle1" fontWeight={600}>
              {hasCredentials ? consumerDisplayName(consumerInView) : 'New Consumer Application'}
            </Typography>
            <Chip label={envLabel} size="small" color="success" variant="outlined" sx={styles.envChip} />
          </Stack>
          <IconButton size="small" onClick={onClose} disabled={busy} aria-label="Close">
            <X size={16} />
          </IconButton>
        </Box>

        <Box sx={styles.drawerBody}>
          {error && (
            <Alert severity="error" sx={styles.dialogAlert}>
              {error}
            </Alert>
          )}

          <Typography sx={styles.fieldLabel}>
            {/* The label sits outside the field, so the required marker is rendered here. */}
            <span>
              Consumer Application Name
              {!hasCredentials && (
                <Box component="span" sx={styles.requiredMark} aria-hidden="true">
                  *
                </Box>
              )}
            </span>
          </Typography>
          <TextField
            value={hasCredentials ? consumerDisplayName(consumerInView) : appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="e.g. my-greeting-client"
            size="small"
            fullWidth
            autoFocus={!hasCredentials}
            required={!hasCredentials}
            disabled={hasCredentials || busy}
            sx={hasCredentials ? styles.lockedField : undefined}
          />

          {hasCredentials && (
            <Box sx={styles.credentialsSection}>
              <Typography sx={styles.fieldLabel}>Header</Typography>
              <Box sx={styles.credField}>
                <Typography component="span" sx={styles.credValue}>
                  {DEFAULT_API_KEY_HEADER}
                </Typography>
                <CopyButton value={DEFAULT_API_KEY_HEADER} />
              </Box>

              <Typography sx={styles.nextFieldLabel}>API Key</Typography>
              {token ? (
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
                <Alert severity="info">The API key is shown only once, when it is created. Regenerate to issue a new key.</Alert>
              )}
            </Box>
          )}
        </Box>

        <Box sx={hasCredentials ? styles.drawerFooterSplit : styles.drawerFooter}>
          {hasCredentials ? (
            <>
              <Stack direction="row" gap={1}>
                <Button variant="outlined" onClick={() => setConfirm('regenerate')} disabled={busy}>
                  Regenerate
                </Button>
                <Button variant="outlined" color="error" onClick={() => setConfirm('unsubscribe')} disabled={busy}>
                  Revoke
                </Button>
              </Stack>
              <Button variant="contained" onClick={onClose} disabled={busy}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button variant="outlined" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button variant="contained" onClick={() => void handleGenerate()} disabled={!appName.trim() || busy} startIcon={createMutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}>
                Generate Credentials
              </Button>
            </>
          )}
        </Box>
      </Box>

      {confirm && (
        <ConfirmDeleteDialog
          title={confirm === 'regenerate' ? 'Regenerate API key?' : 'Revoke this API key?'}
          onConfirm={() => void handleConfirm()}
          onClose={() => setConfirm(null)}
          isPending={busy}
          confirmLabel={confirm === 'regenerate' ? 'Regenerate' : 'Revoke'}
          pendingLabel={confirm === 'regenerate' ? 'Regenerating…' : 'Revoking…'}
          maxWidth="xs">
          <Typography variant="body2" color="text.secondary">
            {confirm === 'regenerate' ? REGENERATE_SUBSCRIPTION_WARNING : UNSUBSCRIBE_WARNING}
          </Typography>
        </ConfirmDeleteDialog>
      )}
    </Drawer>
  );
}
