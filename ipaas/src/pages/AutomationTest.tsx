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

import { Alert, Box, Button, Card, CircularProgress, Divider, MenuItem, PageTitle, Select, Stack, Typography } from '@wso2/oxygen-ui';
import { Activity, Play, RefreshCw } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useMemo, useState, type JSX } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DeploymentTrackBar from '../components/DeploymentTrackBar';
import AutomationExecutions from '../components/AutomationExecutions';
import ExecutionArgsView from '../components/AutomationTest/ExecutionArgsView';
import ExecutionForm from '../components/AutomationTest/ExecutionForm';
import ExecutionLogsPanel from '../components/AutomationTest/ExecutionLogsPanel';
import ExecutionsDrawer from '../components/AutomationTest/ExecutionsDrawer';
import DraftTestDialog, { type DraftDialogIntent, type DraftDialogMode } from '../components/AutomationTest/DraftTestDialog';
import FormExecutionSummary from '../components/AutomationTest/FormExecutionSummary';
import TestStepper from '../components/AutomationTest/TestStepper';
import { useComponentByHandler } from '../hooks/useComponents';
import { useComponentDeployment } from '../hooks/useDeployments';
import { useEnvironments } from '../hooks/useEnvironments';
import { useExecutionArguments, useRuntimeArguments, useTaskExecutionCount, useTaskExecutions, useTriggerComponent } from '../hooks/useExecutions';
import { useOrgUuid } from '../hooks/useOrgUuid';
import { useProjectId } from '../hooks/useProjects';
import { buildExecutionArgumentsFromForm, formDataEqual, hasAnyFormData, parseArgumentsToFormData, parseRuntimeArgumentsToFormFields, validateRequiredFields } from '../utils/runtimeArguments';
import { isTerminalStatus } from '../utils/executionStatus';
import type { DynamicFormData, DynamicFormFieldValue, DynamicFormValidationErrors, TaskExecution } from '../types/executions';
import type { ComponentScope } from '../nav';

/** A GraphQL/HTTP 404 from the runtime-args query means "no schema" → trigger-only, not an error. */
// A GraphQL/HTTP 404 from the runtime-args query means "no schema" → trigger-only, not an error.
function isNotFoundError(error: unknown): boolean {
  return /HTTP 404\b/.test(error instanceof Error ? error.message : '');
}

/**
 * Automation "Test" page — mirrors Devant's "Test Your Automation" console layout:
 * a summary header, then a two-panel body with the runtime-arguments form on the
 * left and the live argument preview, run stepper, and execution logs on the right.
 * Form state is held here so the preview and stepper stay in sync with the form.
 */
export default function AutomationTest({ org, project, component }: ComponentScope): JSX.Element {
  const orgUuid = useOrgUuid();
  const queryClient = useQueryClient();
  const { projectId } = useProjectId(project);
  const { data: comp, isLoading } = useComponentByHandler(projectId, component);

  const tracks = useMemo(() => comp?.deploymentTracks ?? [], [comp?.deploymentTracks]);
  const [trackId, setTrackId] = useState('');
  useEffect(() => {
    if (tracks.length) setTrackId((prev) => (prev && tracks.some((t) => t.id === prev) ? prev : (tracks.find((t) => t.latest)?.id ?? tracks[0].id)));
  }, [tracks]);

  const { data: environments = [] } = useEnvironments(org, projectId);
  const [envId, setEnvId] = useState('');
  useEffect(() => {
    if (environments.length) setEnvId((prev) => (prev && environments.some((e) => e.id === prev) ? prev : environments[0].id));
  }, [environments]);

  const { data: deployment } = useComponentDeployment(org, orgUuid ?? '', comp?.id ?? '', trackId, envId);
  const releaseId = deployment?.releaseId ?? '';
  // The deployed commit lives on the build, not as a top-level field (see EnvironmentCard).
  const commitHash = deployment?.build?.commit?.sha ?? '';
  const buildDate = deployment?.build?.commit?.author?.date;

  const { data: runtimeArguments = [], isLoading: argsLoading, isError: argsError, error: argsErr } = useRuntimeArguments(comp?.id ?? '', trackId, commitHash, !!releaseId && !!commitHash);
  const formFields = useMemo(() => parseRuntimeArgumentsToFormFields(runtimeArguments), [runtimeArguments]);

  // form + run state (lifted so the args preview and stepper stay in sync)
  const [formData, setFormData] = useState<DynamicFormData>({});
  const [validationErrors, setValidationErrors] = useState<DynamicFormValidationErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [logsOpen, setLogsOpen] = useState(true);
  const [execDrawerOpen, setExecDrawerOpen] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  // No-args view: optimistic queued row + run feedback.
  const [pendingTriggerTime, setPendingTriggerTime] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // draft + apply-from-drawer state. `committedFormData` is the baseline for unsaved-edit detection.
  const [committedFormData, setCommittedFormData] = useState<DynamicFormData>({});
  const [draft, setDraft] = useState<{ formData: DynamicFormData } | null>(null);
  const [draftDialog, setDraftDialog] = useState<{ open: boolean; mode: DraftDialogMode; intent: DraftDialogIntent }>({ open: false, mode: 'unsavedChanges', intent: 'newTest' });
  const [pendingExecution, setPendingExecution] = useState<TaskExecution | null>(null);
  const [applyRunId, setApplyRunId] = useState('');

  const { data: executionCount } = useTaskExecutionCount(releaseId, comp?.id ?? '', envId, projectId);
  const trigger = useTriggerComponent();
  const executionArgs = useMemo(() => buildExecutionArgumentsFromForm(runtimeArguments, formData), [runtimeArguments, formData]);

  const { data: executions = [] } = useTaskExecutions(releaseId, comp?.id ?? '', envId, projectId, polling ? 4000 : false);
  const execution = currentRunId ? executions.find((e) => e.runId === currentRunId) : undefined;
  const isTerminal = isTerminalStatus(execution?.status);
  // Stop polling once the tracked run reaches a terminal state.
  useEffect(() => {
    if (currentRunId && execution && isTerminal) setPolling(false);
  }, [currentRunId, execution, isTerminal]);

  const hasUnsavedChanges = !formDataEqual(formData, committedFormData);

  // Reset the form + run state. Keeps any saved draft unless `clearDraft` is set.
  const resetTest = (opts?: { clearDraft?: boolean }) => {
    setFormData({});
    setCommittedFormData({});
    setValidationErrors({});
    setShowErrors(false);
    setCurrentRunId(null);
    setPolling(false);
    setRunError(null);
    if (opts?.clearDraft) setDraft(null);
  };
  // Switching track/environment changes the schema + target release — reset everything,
  // including the draft (it belongs to the previous revision).
  useEffect(() => {
    resetTest({ clearDraft: true });
    setApplyRunId('');
    setDraftDialog((d) => ({ ...d, open: false }));
    setPendingExecution(null);
  }, [trackId, envId]);

  const handleFieldChange = (fieldId: string, value: DynamicFormFieldValue) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (showErrors && validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Load responses into the form as the committed baseline, dropping any in-progress run view.
  const applyFormData = (data: DynamicFormData) => {
    setFormData(data);
    setCommittedFormData(data);
    setValidationErrors({});
    setShowErrors(false);
    setCurrentRunId(null);
    setPolling(false);
    setRunError(null);
    setExecDrawerOpen(false);
  };

  const closeDraftDialog = () => {
    setDraftDialog((d) => ({ ...d, open: false }));
    setPendingExecution(null);
  };

  const handleNewTest = () => {
    if (!hasUnsavedChanges) {
      resetTest();
      return;
    }
    // Always offer both Clear and Draft; Clear (proceed(false)) never drafts the current args.
    setDraftDialog({ open: true, mode: 'unsavedChanges', intent: 'newTest' });
  };

  const applyExecution = (exec: TaskExecution) => {
    if (!exec.runId) return;
    setApplyRunId(exec.runId);
    setExecDrawerOpen(false);
  };

  const handleSelectExecution = (exec: TaskExecution) => {
    if (hasUnsavedChanges) {
      setPendingExecution(exec);
      setDraftDialog({ open: true, mode: draft ? 'existingDraft' : 'unsavedChanges', intent: 'applyExecution' });
      return;
    }
    applyExecution(exec);
  };

  const handleSelectDraft = () => {
    if (!draft) return;
    applyFormData(draft.formData);
    setDraft(null);
  };

  // `saveDraft` snapshots the current responses before starting fresh or applying a selection.
  const proceed = (saveDraft: boolean) => {
    if (saveDraft) setDraft({ formData });
    if (draftDialog.intent === 'newTest') {
      resetTest();
    } else if (pendingExecution) {
      applyExecution(pendingExecution);
    }
    closeDraftDialog();
  };

  // Fetch the selected execution's saved arguments, then parse them into the form.
  const { data: appliedArgs = [], isLoading: applyLoading } = useExecutionArguments(applyRunId, comp?.id ?? '', releaseId, !!applyRunId);
  useEffect(() => {
    if (!applyRunId || applyLoading) return;
    applyFormData(parseArgumentsToFormData(appliedArgs, runtimeArguments));
    setApplyRunId('');
  }, [applyRunId, applyLoading, appliedArgs, runtimeArguments]);

  const handleRun = async () => {
    setRunError(null);
    const errors = validateRequiredFields(formFields, formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setShowErrors(true);
      return;
    }
    try {
      const { runId } = await trigger.mutateAsync({ orgHandler: org, projectId, componentId: comp?.id ?? '', releaseId, args: executionArgs });
      setCurrentRunId(runId);
      setPolling(true);
      setLogsOpen(true);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to trigger the execution.');
    }
  };

  const handleDirectRun = () => {
    setAlert(null);
    trigger.mutate(
      { orgHandler: org, projectId, componentId: comp?.id ?? '', releaseId, args: [] },
      {
        onSuccess: () => {
          setPendingTriggerTime(Date.now());
          queryClient.invalidateQueries({ queryKey: ['taskExecutions'] });
          setAlert({ type: 'success', message: 'Execution triggered successfully' });
        },
        onError: (err) => setAlert({ type: 'error', message: err instanceof Error ? err.message : 'Failed to trigger execution' }),
      },
    );
  };

  const hardArgsError = argsError && !isNotFoundError(argsErr);
  const hasFormData = hasAnyFormData(formData);
  const hasArgs = runtimeArguments.length > 0;
  // Critical (e.g. Production) environments phrase the action as Run rather than Test.
  const envCritical = !!environments.find((e) => e.id === envId)?.critical;
  const runLabel = envCritical ? 'Run' : 'Test';
  const runningLabel = envCritical ? 'Running…' : 'Testing…';

  const envSelect = (
    <Select
      size="small"
      value={environments.some((e) => e.id === envId) ? envId : ''}
      onChange={(e) => setEnvId(e.target.value as string)}
      inputProps={{ 'aria-label': 'Environment' }}
      sx={{ fontSize: '0.8125rem', '& .MuiSelect-select': { py: 0.5, px: 1.5 }, minWidth: 140 }}>
      {environments.map((e) => (
        <MenuItem key={e.id} value={e.id}>
          {e.name}
        </MenuItem>
      ))}
    </Select>
  );

  // No runtime arguments → the executions view: a "Total Executions" summary with a
  // direct Test trigger, plus the executions table. Mirrors Devant's no-args layout.
  const renderExecutionsView = (): JSX.Element => (
    <Box>
      <PageTitle>
        <PageTitle.Header>Test Your Automation</PageTitle.Header>
      </PageTitle>
      <Card sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ m: 3 }}>
          <Stack direction="row" alignItems="center" gap={2}>
            <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
              <Activity size={20} />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Executions{' '}
                <Typography component="span" variant="caption" color="text.secondary">
                  (Last 30 days)
                </Typography>
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {executionCount ?? 0}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1}>
            <Button variant="text" size="small" startIcon={<RefreshCw size={16} />} onClick={() => queryClient.invalidateQueries({ queryKey: ['taskExecutions'] })}>
              Refresh
            </Button>
            <Button variant="contained" size="small" startIcon={trigger.isPending ? <CircularProgress size={14} color="inherit" /> : <Play size={16} />} onClick={handleDirectRun} disabled={trigger.isPending}>
              {trigger.isPending ? runningLabel : runLabel}
            </Button>
          </Stack>
        </Stack>
      </Card>

      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ my: 2 }}>
          {alert.message}
        </Alert>
      )}

      <AutomationExecutions
        releaseId={releaseId}
        projectId={projectId}
        componentId={comp?.id ?? ''}
        deploymentTrackId={trackId}
        environmentId={envId}
        orgHandler={org}
        projectHandler={project}
        componentHandler={component}
        envCritical={envCritical}
        pendingTriggerTime={pendingTriggerTime}
        onTriggerResolved={() => setPendingTriggerTime(null)}
      />
    </Box>
  );

  // Runtime arguments present → the "Test Your Automation" form view (two panels).
  const renderFormView = (): JSX.Element => (
    <Box>
      <FormExecutionSummary
        commitSha={commitHash}
        buildDate={buildDate}
        onNewTest={handleNewTest}
        newTestDisabled={!hasUnsavedChanges}
        onExecutions={() => setExecDrawerOpen(true)}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['taskExecutions'] })}
        refreshDisabled={trigger.isPending}
      />

      <Box sx={{ display: 'flex', gap: 4, mt: 5, alignItems: 'stretch' }}>
        {/* Left panel scrolls with the page when the form is long. */}
        <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
          {runError && (
            <Alert severity="error" onClose={() => setRunError(null)} sx={{ mb: 2 }}>
              {runError}
            </Alert>
          )}
          <ExecutionForm
            formFields={formFields}
            formData={formData}
            validationErrors={validationErrors}
            showErrors={showErrors}
            onFieldChange={handleFieldChange}
            onRun={handleRun}
            onClear={() => resetTest()}
            isRunDisabled={trigger.isPending || !releaseId}
            isClearDisabled={!hasFormData && !currentRunId}
            isTriggering={trigger.isPending}
            envCritical={envCritical}
          />
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Right panel stays put (sticky) while the left scrolls — offset to clear the pinned track bar. */}
        <Box sx={{ flex: '1 1 50%', minWidth: 0, position: 'sticky', top: 72, alignSelf: 'flex-start' }}>
          <Stack gap={4}>
            <ExecutionArgsView execArgs={executionArgs} />
            <TestStepper hasTriggered={!!currentRunId} status={execution?.status} />
            <ExecutionLogsPanel componentId={comp?.id ?? ''} deploymentTrackId={trackId} environmentId={envId} executionId={execution?.id ?? ''} isRunning={!!currentRunId && !isTerminal} expanded={logsOpen} onToggle={setLogsOpen} />
          </Stack>
        </Box>
      </Box>

      <ExecutionsDrawer open={execDrawerOpen} onClose={() => setExecDrawerOpen(false)} executions={executions} hasDraft={!!draft} onSelectDraft={handleSelectDraft} onSelectExecution={handleSelectExecution} />

      <DraftTestDialog open={draftDialog.open} mode={draftDialog.mode} intent={draftDialog.intent} onClose={closeDraftDialog} onDraft={() => proceed(true)} onClearAndProceed={() => proceed(false)} onOverrideDraft={() => proceed(true)} />
    </Box>
  );

  const renderBody = (): JSX.Element => {
    if (isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', py: 8 }} />;
    if (!comp) return <Typography>Integration not found</Typography>;
    if (!releaseId) return <Alert severity="info">Deploy this integration to the selected environment to test it.</Alert>;
    if (argsLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', py: 8 }} />;
    if (hardArgsError) return <Alert severity="error">Failed to load the runtime arguments for this automation.</Alert>;
    return hasArgs ? renderFormView() : renderExecutionsView();
  };

  return (
    <>
      {tracks.length > 0 && (
        // Pin the track bar to the top of the scroll area so it stays visible as the page scrolls.
        <Box sx={{ position: 'sticky', top: 0, zIndex: (theme) => theme.zIndex.appBar }}>
          <DeploymentTrackBar tracks={tracks} selectedId={trackId} onChange={setTrackId} orgHandler={org} projectHandler={project} componentHandler={component} extra={envSelect} />
        </Box>
      )}
      {/* Plain padded container (not PageContent) so the page uses the single outer scroller — the
          sticky track bar above pins against it, with no nested scroll region. */}
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: 8 }}>{renderBody()}</Box>
    </>
  );
}
