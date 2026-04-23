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

import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Collapse, Drawer, IconButton, Stack, TextField, Typography } from '@wso2/oxygen-ui';
import { ChevronDown, ChevronUp, Plus, X } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEnvEndpoints, useGetConfigMgt, useSchemaConfig, type ConfigMgtItem, type GqlEnvEndpoint, type SchemaConfigItem } from '../../api/queries';
import { usePostConfigMgt, useGenerateComponentEndpoints, useUpdateEndpoint, useSaveSchemaConfig, type ConfigMgtSaveItem } from '../../api/mutations';
import ManageDrawer from './ManageDrawer';
import { EndpointCard, VISIBILITY_OPTS } from './EndpointCard';

// ── Schema parsing ────────────────────────────────────────────────────────────

interface ParsedField {
  key: string;
  displayName: string;
  group: string;
  type: string;
  description?: string;
  required: boolean;
  isSensitive: boolean;
}

function parseSchema(base64: string | undefined, configMount: ConfigMgtItem[] | undefined): ParsedField[] {
  if (!base64) return [];
  try {
    const root = JSON.parse(atob(base64));
    const fields: ParsedField[] = [];

    function flatten(props: Record<string, Record<string, unknown>>, required: string[], keyPrefix: string, group: string, displayPrefix: string) {
      for (const [name, prop] of Object.entries(props)) {
        const fullKey = `${keyPrefix}.${name}`;
        const display = displayPrefix ? `${displayPrefix}.${name}` : name;

        if (prop.type === 'object' && prop.properties) {
          const nestedRequired = Array.isArray(prop.required) ? (prop.required as string[]) : [];
          flatten(prop.properties as Record<string, Record<string, unknown>>, nestedRequired, fullKey, group, display);
        } else {
          fields.push({
            key: fullKey,
            displayName: display,
            group,
            type: typeof prop.type === 'string' ? prop.type : 'string',
            description: typeof prop.description === 'string' ? prop.description : undefined,
            required: required.includes(name),
            isSensitive: typeof prop['x-sensitive'] === 'boolean' ? (prop['x-sensitive'] as boolean) : false,
          });
        }
      }
    }

    for (const [org, orgSchema] of Object.entries((root.properties ?? {}) as Record<string, Record<string, unknown>>)) {
      for (const [pkg, pkgSchema] of Object.entries((orgSchema.properties ?? {}) as Record<string, Record<string, unknown>>)) {
        const group = `${org}.${pkg}`;
        const pkgRequired = Array.isArray((pkgSchema as Record<string, unknown>).required) ? ((pkgSchema as Record<string, unknown>).required as string[]) : [];
        flatten(((pkgSchema as Record<string, unknown>).properties ?? {}) as Record<string, Record<string, unknown>>, pkgRequired, `${org}.${pkg}`, group, '');
      }
    }

    const reqKeys = new Set((configMount ?? []).filter((c) => c.isRequired).map((c) => c.configKeyName));
    return fields.map((f) => ({ ...f, required: f.required || reqKeys.has(f.key) }));
  } catch {
    return [];
  }
}

function buildInitialValues(configMount: ConfigMgtItem[] | undefined): Record<string, string> {
  const vals: Record<string, string> = {};
  for (const item of configMount ?? []) {
    vals[item.configKeyName] = item.configurationValue?.value ?? '';
  }
  return vals;
}

// ── Config field components ───────────────────────────────────────────────────

interface FieldRowProps {
  displayName: string;
  type: string;
  description?: string;
  isSensitive: boolean;
  value: string;
  onChange: (v: string) => void;
}

function FieldRow({ displayName, type, description, isSensitive, value, onChange }: FieldRowProps) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" alignItems="center" gap={0.75} sx={{ mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {displayName}
        </Typography>
        <Chip label={type} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', borderRadius: 0.75 }} />
      </Stack>
      {description && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.25 }}>
          {description}
        </Typography>
      )}
      <TextField size="small" fullWidth type={isSensitive ? 'password' : 'text'} placeholder="Enter a value" value={value} onChange={(e) => onChange(e.target.value)} />
    </Box>
  );
}

interface PackageGroupProps {
  label: string;
  fields: ParsedField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

function PackageGroup({ label, fields, values, onChange }: PackageGroupProps) {
  const [open, setOpen] = useState(true);
  return (
    <Box sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" onClick={() => setOpen((p) => !p)} sx={{ px: 1.5, py: 0.75, cursor: 'pointer', userSelect: 'none', borderBottom: open ? '1px solid' : 'none', borderColor: 'divider' }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
          {label}
        </Typography>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </Stack>
      <Collapse in={open}>
        <Box sx={{ px: 1.5, pb: 1.5, pt: 1 }}>
          {fields.map((f) => (
            <FieldRow key={f.key} displayName={f.displayName} type={f.type} description={f.description} isSensitive={f.isSensitive} value={values[f.key] ?? ''} onChange={(v) => onChange(f.key, v)} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

interface DefaultableConfigurablesAccordionProps {
  groups: { label: string; fields: ParsedField[] }[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

function DefaultableConfigurablesAccordion({ groups, values, onChange }: DefaultableConfigurablesAccordionProps) {
  const [open, setOpen] = useState(true);
  return (
    <Box sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onClick={() => setOpen((p) => !p)}
        sx={{ px: 2, py: 1.25, cursor: 'pointer', userSelect: 'none', borderBottom: open ? '1px solid' : 'none', borderColor: 'divider', bgcolor: 'action.hover' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Defaultable Configurables
        </Typography>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </Stack>
      <Collapse in={open}>
        <Box sx={{ p: 1.5 }}>
          {groups.map((g) => (
            <PackageGroup key={g.label} label={g.label} fields={g.fields} values={values} onChange={onChange} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ['Configurations', 'Endpoints'];

function StepIndicator({ step }: { step: number }) {
  return (
    <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
      {STEPS.map((label, idx) => {
        const num = idx + 1;
        const isActive = num === step;
        const isDone = num < step;
        return (
          <Stack key={label} direction="row" alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  bgcolor: isActive ? 'primary.main' : isDone ? 'success.main' : 'action.disabledBackground',
                  color: isActive || isDone ? 'primary.contrastText' : 'text.disabled',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}>
                {num}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'text.primary' : 'text.secondary',
                  whiteSpace: 'nowrap',
                }}>
                {label}
              </Typography>
            </Stack>
            {idx < STEPS.length - 1 && <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider', mx: 0.75 }} />}
          </Stack>
        );
      })}
    </Stack>
  );
}

// ── ManageEndpoint (inline edit view) ─────────────────────────────────────────

interface ManageEndpointProps {
  ep: GqlEnvEndpoint;
  componentId: string;
  versionId: string;
  releaseId: string;
  onBack: () => void;
}

function ManageEndpoint({ ep, componentId, versionId, releaseId, onBack }: ManageEndpointProps) {
  const [visibilities, setVisibilities] = useState<string[]>(ep.networkVisibilities ?? [ep.visibility ?? 'Public']);
  const [saveError, setSaveError] = useState<string | null>(null);
  const updateEp = useUpdateEndpoint();

  const handleToggle = (key: string) => {
    setVisibilities((prev) => (prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]));
  };

  const handleSave = () => {
    setSaveError(null);
    updateEp.mutate(
      { componentId, versionId, releaseId, endpointId: ep.id, displayName: ep.displayName, networkVisibilities: visibilities },
      {
        onSuccess: onBack,
        onError: (err) => setSaveError(err instanceof Error ? err.message : 'Failed to update endpoint'),
      },
    );
  };

  return (
    <Box>
      {/* Endpoint details (read-only) */}
      <Box sx={{ mb: 2 }}>
        {[
          { label: 'Name', value: ep.displayName },
          { label: 'Port', value: ep.port != null ? String(ep.port) : null },
          { label: 'Status', value: ep.state ?? null },
          { label: 'Type', value: ep.type ?? null },
          { label: 'Context', value: ep.apiContext ?? null },
          { label: 'Schema', value: ep.apiDefinitionPath ?? null },
        ].map(({ label, value }) =>
          value ? (
            <Typography key={label} variant="body2" sx={{ mb: 0.5 }}>
              <Box component="span" sx={{ fontWeight: 700 }}>
                {label}
              </Box>
              : {value}
            </Typography>
          ) : null,
        )}
      </Box>

      {/* Network visibility */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Network Visibility
      </Typography>
      <Stack gap={1} sx={{ mb: 2 }}>
        {VISIBILITY_OPTS.map(({ key, label, Icon, description }) => {
          const checked = visibilities.includes(key);
          return (
            <Box
              key={key}
              onClick={() => handleToggle(key)}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.25,
                p: 1.5,
                border: '1px solid',
                borderColor: checked ? 'primary.main' : 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: 'primary.main' },
              }}>
              <Box sx={{ display: 'flex', color: 'primary.main', mt: 0.25, flexShrink: 0 }}>
                <Icon size={18} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {description}
                </Typography>
              </Box>
              <Checkbox checked={checked} size="small" sx={{ p: 0, flexShrink: 0, mt: 0.25 }} onClick={(e) => e.stopPropagation()} onChange={() => handleToggle(key)} />
            </Box>
          );
        })}
      </Stack>

      {saveError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {saveError}
        </Alert>
      )}

      <Stack direction="row" justifyContent="flex-end" gap={1}>
        <Button onClick={onBack}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={updateEp.isPending || visibilities.length === 0} startIcon={updateEp.isPending ? <CircularProgress color="inherit" size={16} /> : undefined}>
          {updateEp.isPending ? 'Updating…' : 'Update'}
        </Button>
      </Stack>
    </Box>
  );
}

// ── Automation configure drawer ───────────────────────────────────────────────

interface AutoFlatField {
  key: string;
  leafKey: string;
  parentPath: string;
  type: string;
  description?: string;
  required: boolean;
  isSensitive: boolean;
}

function autoFlattenSchema(properties: Record<string, Record<string, unknown>>, required: string[], dotPrefix = '', slashPrefix = ''): AutoFlatField[] {
  const fields: AutoFlatField[] = [];
  for (const [name, prop] of Object.entries(properties)) {
    const dotKey = dotPrefix ? `${dotPrefix}.${name}` : name;
    const slashPath = slashPrefix ? `${slashPrefix}/${name}` : name;
    if (prop.type === 'object' && prop.properties) {
      const childRequired = Array.isArray(prop.required) ? (prop.required as string[]) : [];
      fields.push(...autoFlattenSchema(prop.properties as Record<string, Record<string, unknown>>, childRequired, dotKey, slashPath));
    } else {
      fields.push({
        key: dotKey,
        leafKey: name,
        parentPath: slashPrefix,
        type: typeof prop.type === 'string' && prop.type === 'array' ? 'object[]' : typeof prop.type === 'string' ? prop.type : 'string',
        description: typeof prop.description === 'string' ? prop.description : undefined,
        required: required.includes(name),
        isSensitive: typeof prop['x-sensitive'] === 'boolean' ? (prop['x-sensitive'] as boolean) : false,
      });
    }
  }
  return fields;
}

function autoParseFields(base64: string | undefined): AutoFlatField[] {
  if (!base64) return [];
  try {
    const schema = JSON.parse(atob(base64));
    return autoFlattenSchema(schema.properties ?? {}, schema.required ?? []);
  } catch {
    return [];
  }
}

function autoGroupFields(fields: AutoFlatField[]): { groupPath: string; fields: AutoFlatField[] }[] {
  const map = new Map<string, AutoFlatField[]>();
  for (const f of fields) {
    const g = f.parentPath || f.leafKey;
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(f);
  }
  return Array.from(map.entries()).map(([groupPath, groupFields]) => ({ groupPath, fields: groupFields }));
}

interface AutoFieldRowProps {
  field: AutoFlatField;
  value: string;
  onChange: (v: string) => void;
}

function AutoFieldRow({ field, value, onChange }: AutoFieldRowProps) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" alignItems="center" gap={0.75} sx={{ mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {field.leafKey}
        </Typography>
        <Chip label={field.type} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', borderRadius: 0.75 }} />
      </Stack>
      {field.description && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.25 }}>
          {field.description}
        </Typography>
      )}
      {field.type === 'object[]' ? (
        <Button variant="outlined" size="small" startIcon={<Plus size={12} />} sx={{ mt: 0.25 }}>
          Add
        </Button>
      ) : (
        <TextField size="small" fullWidth type={field.isSensitive ? 'password' : 'text'} placeholder="Enter a value" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </Box>
  );
}

interface AutoFieldGroupProps {
  groupPath: string;
  fields: AutoFlatField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

function AutoFieldGroup({ groupPath, fields, values, onChange }: AutoFieldGroupProps) {
  const [open, setOpen] = useState(true);
  return (
    <Box sx={{ mx: 1.5, mb: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" onClick={() => setOpen((p) => !p)} sx={{ px: 1.5, py: 0.75, cursor: 'pointer', userSelect: 'none', borderBottom: open ? '1px solid' : 'none', borderColor: 'divider' }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
          {groupPath}
        </Typography>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </Stack>
      <Collapse in={open}>
        <Box sx={{ px: 1.5, pb: 1.5, pt: 1 }}>
          {fields.map((field) => (
            <AutoFieldRow key={field.key} field={field} value={values[field.key] ?? ''} onChange={(v) => onChange(field.key, v)} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

interface AutoSectionProps {
  title: string;
  groups: { groupPath: string; fields: AutoFlatField[] }[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  defaultOpen?: boolean;
}

function AutoSection({ title, groups, values, onChange, defaultOpen = true }: AutoSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  if (groups.length === 0) return null;
  return (
    <Box sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" onClick={() => setOpen((p) => !p)} sx={{ px: 2, py: 1.25, cursor: 'pointer', userSelect: 'none' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </Stack>
      <Collapse in={open}>
        <Box sx={{ pt: 1 }}>
          {groups.map(({ groupPath, fields }) => (
            <AutoFieldGroup key={groupPath} groupPath={groupPath} fields={fields} values={values} onChange={onChange} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

interface AutomationConfigureDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Called only when the user successfully saves via the Update button. */
  onSaved?: () => void;
  projectId: string;
  componentId: string;
  envId: string;
  deploymentTrackId: string;
  commitHash?: string;
}

function AutomationConfigureDrawer({ open, onClose, onSaved, projectId, componentId, envId, deploymentTrackId, commitHash }: AutomationConfigureDrawerProps) {
  const handleClose = () => {
    (document.activeElement as HTMLElement)?.blur();
    onClose();
  };

  const { data, isLoading, isError } = useSchemaConfig(projectId, componentId, envId, deploymentTrackId, commitHash);
  const save = useSaveSchemaConfig();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const fields = useMemo(() => {
    const base = autoParseFields(data?.jsonSchema);
    const reqKeys = new Set((data?.configurations ?? []).filter((c) => c.isRequired).map((c) => c.key));
    if (!reqKeys.size) return base;
    return base.map((f) => ({ ...f, required: f.required || reqKeys.has(f.key) }));
  }, [data]);

  const requiredFields = useMemo(() => fields.filter((f) => f.required), [fields]);
  const optionalFields = useMemo(() => fields.filter((f) => !f.required), [fields]);
  const requiredGroups = useMemo(() => autoGroupFields(requiredFields), [requiredFields]);
  const optionalGroups = useMemo(() => autoGroupFields(optionalFields), [optionalFields]);

  useEffect(() => {
    if (open) {
      setSaveError(null);
      const initial: Record<string, string> = {};
      if (data?.configurations) {
        for (const cfg of data.configurations) {
          initial[cfg.key] = cfg.values?.[0]?.value ?? '';
        }
      }
      setValues(initial);
    }
  }, [open, data]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaveError(null);
    const configurations: SchemaConfigItem[] = fields.filter((f) => f.type !== 'object[]' && values[f.key] !== undefined && values[f.key] !== '').map((f) => ({ key: f.key, values: [{ environmentUuid: envId, value: values[f.key] }] }));
    save.mutate(
      { projectId, componentId, envId, deploymentTrackId, configurations, commitHash },
      {
        onSuccess: () => { onClose(); onSaved?.(); },
        onError: (err) => setSaveError(err instanceof Error ? err.message : 'Failed to save configuration'),
      },
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress size={32} color="primary" />
        </Box>
      );
    }
    if (isError || data === null) {
      return (
        <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Configuration schema is not available for this component.
          </Typography>
        </Box>
      );
    }
    if (!data?.jsonSchema || fields.length === 0) {
      return (
        <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No configurable values found for this component.
          </Typography>
        </Box>
      );
    }
    return (
      <>
        <AutoSection title="Required" groups={requiredGroups} values={values} onChange={handleChange} />
        <AutoSection title="Optional" groups={optionalGroups} values={values} onChange={handleChange} defaultOpen={false} />
        {saveError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {saveError}
          </Alert>
        )}
      </>
    );
  };

  const hasSchema = !isLoading && !isError && data !== null && !!data?.jsonSchema && fields.length > 0;
  const hasRequiredMissing = requiredFields.some((f) => !values[f.key]);

  return (
    <Drawer anchor="right" open={open} onClose={handleClose} variant="temporary" sx={drawerSx}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="h5">Configurations</Typography>
        <IconButton size="small" aria-label="close" onClick={handleClose}>
          <X size={16} />
        </IconButton>
      </Stack>
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2 }}>{renderContent()}</Box>
      {hasSchema && (
        <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={save.isPending || hasRequiredMissing} startIcon={save.isPending ? <CircularProgress color="inherit" size={16} /> : undefined}>
            {save.isPending ? 'Saving…' : 'Update'}
          </Button>
        </Stack>
      )}
    </Drawer>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────

const drawerSx = {
  '& .MuiDrawer-paper': {
    width: 440,
    position: 'fixed',
    top: 64,
    height: 'calc(100% - 64px)',
    borderLeft: '1px solid',
    borderColor: 'divider',
    display: 'flex',
    flexDirection: 'column',
  },
} as const;

export interface ConfigureDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  orgHandler: string;
  projectId: string;
  componentId: string;
  envId: string;
  versionId: string;
  componentName: string;
  projectHandler: string;
  commitHash?: string;
  releaseId?: string;
  displayType?: string;
  releaseMgtReleaseId?: string;
  releaseMgtDeploymentId?: string;
  isAutomation?: boolean;
  envTemplateId?: string;
}

export default function ConfigureDrawer(props: ConfigureDrawerProps) {
  if (props.isAutomation) {
    return <AutomationConfigureDrawer open={props.open} onClose={props.onClose} projectId={props.projectId} componentId={props.componentId} envId={props.envTemplateId ?? props.envId} deploymentTrackId={props.versionId} commitHash={props.commitHash} />;
  }
  return <GenericServiceConfigureDrawer {...props} />;
}

function GenericServiceConfigureDrawer({
  open,
  onClose,
  onSaved,
  orgHandler,
  projectId,
  componentId,
  envId,
  versionId,
  componentName,
  projectHandler: _projectHandler,
  commitHash,
  releaseId,
  displayType: _displayType,
  releaseMgtReleaseId: _releaseMgtReleaseId,
  releaseMgtDeploymentId: _releaseMgtDeploymentId,
}: ConfigureDrawerProps) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [managingEp, setManagingEp] = useState<GqlEnvEndpoint | null>(null);
  const [manageDrawerOpen, setManageDrawerOpen] = useState(false);
  const [manageApimId, setManageApimId] = useState<string | null>(null);

  const handleClose = () => {
    (document.activeElement as HTMLElement)?.blur();
    onClose();
  };

  const { data, isLoading, isError, error } = useGetConfigMgt(orgHandler, projectId, componentId, envId, versionId, componentName, commitHash, open);
  const { data: endpoints = [] } = useEnvEndpoints(open ? componentId : '', open ? versionId : '', open && releaseId ? releaseId : '');
  const queryClient = useQueryClient();
  const save = usePostConfigMgt();
  const generateEp = useGenerateComponentEndpoints();

  const fields = useMemo(() => parseSchema(data?.jsonSchema, data?.configurationMount), [data]);

  const defaultGroup = useMemo(() => {
    if (!data?.defaultPackage) return '';
    const [org, pkg] = data.defaultPackage.split('/');
    return org && pkg ? `${org}.${pkg}` : '';
  }, [data?.defaultPackage]);

  const groups = useMemo(() => {
    const byGroup = new Map<string, ParsedField[]>();
    for (const f of fields) {
      if (!byGroup.has(f.group)) byGroup.set(f.group, []);
      byGroup.get(f.group)!.push(f);
    }
    return Array.from(byGroup.entries()).map(([group, groupFields]) => ({
      label: group === defaultGroup ? componentName : group,
      fields: groupFields,
    }));
  }, [fields, defaultGroup, componentName]);

  // Tracks whether we have seeded values for the current open session, so that
  // subsequent data refetches while the drawer is open don't clobber edits.
  const seededRef = useRef(false);

  // Reset UI state when the drawer opens; seed immediately if data is already available.
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSaveError(null);
    setManagingEp(null);
    if (data !== undefined) {
      setValues(buildInitialValues(data?.configurationMount));
      seededRef.current = true;
    } else {
      seededRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // intentionally omit data — seeding on open only

  // Seed values when data arrives for the first time after the drawer opened.
  useEffect(() => {
    if (!open || seededRef.current || data === undefined) return;
    setValues(buildInitialValues(data?.configurationMount));
    seededRef.current = true;
  }, [open, data]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    setSaveError(null);
    if (!commitHash) {
      setSaveError('Cannot save: commit information is not available.');
      return;
    }
    const configs: ConfigMgtSaveItem[] = fields
      .filter((f) => values[f.key] !== undefined && values[f.key] !== '')
      .map((f) => {
        const mountItem = data?.configurationMount?.find((c) => c.configKeyName === f.key);
        return {
          configKeyName: f.key,
          valueType: f.type,
          valueOrSource: values[f.key],
          isRequired: f.required,
          metadata: { isSecret: mountItem?.metadata?.isSecret ?? f.isSensitive },
          configPackageName: mountItem?.configPackageName ?? f.group.split('.')[1] ?? '',
          configPackageOrganization: mountItem?.configPackageOrganization ?? f.group.split('.')[0] ?? '',
        };
      });

    save.mutate(
      { orgHandler, projectId, componentId, envId, versionId, moduleName: componentName, commitHash, configs },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['envEndpoints'] });
          queryClient.invalidateQueries({ queryKey: ['componentDeployment'] });
          onClose();
          onSaved?.();
        },
        onError: (err) => setSaveError(err instanceof Error ? err.message : 'Failed to save configuration'),
      },
    );
  };

  const handleNext = () => {
    if (step < 2) {
      setSaveError(null);
      if (!releaseId || !commitHash) {
        // No active release yet — just advance to show endpoints
        setStep(2);
        return;
      }
      generateEp.mutate(
        { componentId, versionId, releaseId, commitHash, dryRun: false },
        {
          onSuccess: () => setStep(2),
          onError: (err) => setSaveError(err instanceof Error ? err.message : 'Failed to deploy endpoints'),
        },
      );
    } else {
      handleApply();
    }
  };

  const handlePrev = () => {
    if (step > 1) { setSaveError(null); setStep((s) => s - 1); }
    else handleClose();
  };

  const handleSettings = (ep: GqlEnvEndpoint) => {
    setManageApimId(ep.apimId ?? null);
    setManageDrawerOpen(true);
  };

  // ── Step content ──────────────────────────────────────────────────────────

  const renderConfigurations = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress size={32} color="primary" />
        </Box>
      );
    }
    if (isError) {
      return <Alert severity="error">{error instanceof Error ? error.message : 'Failed to load configuration.'}</Alert>;
    }
    if (!fields.length) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No configurable values found for this component.
          </Typography>
        </Box>
      );
    }
    return (
      <Box>
        <DefaultableConfigurablesAccordion groups={groups} values={values} onChange={handleChange} />
      </Box>
    );
  };

  const renderEndpoints = () => {
    if (managingEp) {
      return <ManageEndpoint ep={managingEp} componentId={componentId} versionId={versionId} releaseId={releaseId ?? ''} onBack={() => setManagingEp(null)} />;
    }
    if (!endpoints.length) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No endpoints available for this deployment.
          </Typography>
        </Box>
      );
    }
    return (
      <Box>
        {endpoints.map((ep, idx) => (
          <EndpointCard key={ep.id} ep={ep} defaultExpanded={idx === 0} onEdit={setManagingEp} onSettings={handleSettings} />
        ))}
      </Box>
    );
  };

  const stepContent = step === 1 ? renderConfigurations() : renderEndpoints();
  const prevLabel = step === 1 ? 'Cancel' : 'Back';
  const isApplying = save.isPending;
  const nextLabel = step === 2 ? (isApplying ? 'Applying…' : 'Apply') : generateEp.isPending ? 'Loading…' : 'Next';
  const nextDisabled = (step === 1 && (isLoading || generateEp.isPending)) || (step === 2 && isApplying);
  // Hide footer buttons when in ManageEndpoint (it has its own buttons)
  const showFooter = !(step === 2 && managingEp !== null);

  return (
    <>
      <Drawer anchor="right" open={open} onClose={handleClose} variant="temporary" sx={drawerSx}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Typography variant="h5">Configure</Typography>
          <IconButton size="small" aria-label="close" onClick={handleClose}>
            <X size={16} />
          </IconButton>
        </Stack>

        {/* Step indicator */}
        <StepIndicator step={step} />

        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2 }}>{stepContent}</Box>

        {/* Save error */}
        {saveError && (
          <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
            {saveError}
          </Alert>
        )}

        {/* Footer */}
        {showFooter && (
          <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Button onClick={handlePrev}>{prevLabel}</Button>
            <Button variant="contained" onClick={handleNext} disabled={nextDisabled} startIcon={(step === 2 && isApplying) || (step === 1 && generateEp.isPending) ? <CircularProgress color="inherit" size={16} /> : undefined}>
              {nextLabel}
            </Button>
          </Stack>
        )}
      </Drawer>

      <ManageDrawer open={manageDrawerOpen} onClose={() => setManageDrawerOpen(false)} apimId={manageApimId} />
    </>
  );
}
