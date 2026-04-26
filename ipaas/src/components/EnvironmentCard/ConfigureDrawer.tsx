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

import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, IconButton, MenuItem, Select as MuiSelect, Stack, TextField, Typography } from '@wso2/oxygen-ui';
import { ChevronDown, ChevronUp, Link, Trash2, Upload, X } from '@wso2/oxygen-ui-icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useEnvEndpoints,
  useGetConfigMgt,
  useSchemaConfig,
  useCertificateGroups,
  useCertificateMappings,
  useConfigGroups,
  type ConfigMgtItem,
  type GqlEnvEndpoint,
  type SchemaConfigItem,
  type CertGroup,
  type CertMapping,
  type CertMappingConfig,
} from '../../api/queries';
import { usePostConfigMgt, useGenerateComponentEndpoints, useUpdateEndpoint, useSaveSchemaConfig, usePostCertificateMappings, useDeployDeploymentTrack, type ConfigMgtSaveItem } from '../../api/mutations';
import ManageDrawer from './ManageDrawer';
import { VISIBILITY_OPTS } from './EndpointCard';
import { ConfigForm, parseConfigToml, filterTomlValuesBySchema, type BaseType, type LinkingInfo, type JSONSchema } from '../SchemaConfigForm';

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
const AUTOMATION_STEPS = ['Configurations', 'Certificate Mount'];

function StepIndicator({ step, steps }: { step: number; steps: string[] }) {
  return (
    <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
      {steps.map((label, idx) => {
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
            {idx < steps.length - 1 && <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider', mx: 0.75 }} />}
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

// ── Certificate Mount step components ──────────────────────────────────────────

interface LinkedCert {
  groupUuid: string;
  groupName: string;
  groupDisplayName?: string;
  mountPath: string;
  keys: { keyUuid: string; key: string; mountedAs: string }[];
}

interface CertLinkFormProps {
  availableCerts: CertGroup[];
  onLink: (cert: CertGroup, mountPath: string) => void;
  onCancel: () => void;
}

function CertLinkForm({ availableCerts, onLink, onCancel }: CertLinkFormProps) {
  const [selectedGroupUuid, setSelectedGroupUuid] = useState('');
  const [mountPath, setMountPath] = useState('');
  const mountPathError = mountPath && !mountPath.startsWith('/') ? 'Mount path must start with /' : '';
  const selected = availableCerts.find((c) => c.groupUuid === selectedGroupUuid) ?? null;
  const canLink = !!selected && !!mountPath && !mountPathError;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 1, p: 1.5, mb: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        Link Certificate
      </Typography>
      <TextField
        size="small"
        fullWidth
        label="Mount Path"
        placeholder="/certs"
        value={mountPath}
        onChange={(e) => setMountPath(e.target.value)}
        error={!!mountPathError}
        helperText={mountPathError || 'Directory where certificate files will be mounted'}
        sx={{ mb: 1.5 }}
      />
      <MuiSelect size="small" fullWidth displayEmpty value={selectedGroupUuid} onChange={(e) => setSelectedGroupUuid(e.target.value as string)} sx={{ mb: 1.5 }}>
        <MenuItem value="" disabled>
          Select a Certificate
        </MenuItem>
        {availableCerts.map((c) => (
          <MenuItem key={c.groupUuid} value={c.groupUuid}>
            {c.groupDisplayName || c.groupName}
          </MenuItem>
        ))}
      </MuiSelect>
      <Stack direction="row" gap={1} justifyContent="flex-end">
        <Button size="small" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="small" variant="contained" disabled={!canLink} onClick={() => selected && onLink(selected, mountPath)}>
          Link
        </Button>
      </Stack>
    </Box>
  );
}

interface LinkedCertCardProps {
  cert: LinkedCert;
  onUnlink: () => void;
  onMountPathChange: (path: string) => void;
}

function LinkedCertCard({ cert, onUnlink, onMountPathChange }: LinkedCertCardProps) {
  const [open, setOpen] = useState(true);
  const [mountPath, setMountPath] = useState(cert.mountPath);
  const mountPathError = mountPath && !mountPath.startsWith('/') ? 'Mount path must start with /' : '';

  return (
    <Box sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ px: 1.5, py: 1, cursor: 'pointer', borderBottom: open ? '1px solid' : 'none', borderColor: 'divider' }} onClick={() => setOpen((p) => !p)}>
        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
          {cert.groupDisplayName || cert.groupName}
        </Typography>
        <Chip label="Certificate" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', borderRadius: 0.75 }} />
        <Button
          size="small"
          variant="text"
          color="error"
          startIcon={<Trash2 size={13} />}
          onClick={(e) => {
            e.stopPropagation();
            onUnlink();
          }}
          sx={{ minWidth: 0, px: 0.5 }}>
          Unlink
        </Button>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </Stack>
      <Collapse in={open}>
        <Box sx={{ px: 1.5, pt: 1, pb: 1.5 }}>
          <TextField
            size="small"
            fullWidth
            label="Mount Path"
            value={mountPath}
            error={!!mountPathError}
            helperText={mountPathError || 'Directory where certificate files will be mounted'}
            onChange={(e) => {
              setMountPath(e.target.value);
              if (!e.target.value || e.target.value.startsWith('/')) onMountPathChange(e.target.value);
            }}
            sx={{ mb: 1 }}
          />
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0.5, overflow: 'hidden' }}>
            <Stack direction="row" sx={{ px: 1, py: 0.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, flex: 1 }}>
                FILE NAME
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                CERTIFICATE KEY NAME
              </Typography>
            </Stack>
            {cert.keys.map((k) => (
              <Stack key={k.keyUuid} direction="row" alignItems="center" sx={{ px: 1, py: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', flex: 1 }}>
                  {k.mountedAs}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  {k.key}
                </Typography>
              </Stack>
            ))}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

interface CertificateMountStepProps {
  projectId: string;
  componentId: string;
  envId: string;
  deploymentTrackId: string;
  open: boolean;
  linkedCerts: LinkedCert[];
  onChange: (certs: LinkedCert[]) => void;
}

function CertificateMountStep({ projectId, componentId, envId: _envId, deploymentTrackId: _deploymentTrackId, open, linkedCerts, onChange }: CertificateMountStepProps) {
  const { data: certGroups = [], isLoading } = useCertificateGroups(projectId, componentId, open);
  const [isLinking, setIsLinking] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<string | null>(null);

  const linkedUuids = new Set(linkedCerts.map((c) => c.groupUuid));
  const linkable = certGroups.filter((g) => !linkedUuids.has(g.groupUuid));

  const handleLink = (cert: CertGroup, mountPath: string) => {
    const newCert: LinkedCert = {
      groupUuid: cert.groupUuid,
      groupName: cert.groupName,
      groupDisplayName: cert.groupDisplayName,
      mountPath,
      keys: cert.configurations
        .filter((k) => k.isFile)
        .map((k) => ({
          keyUuid: k.keyUuid,
          key: k.key,
          mountedAs:
            k.key
              .split('/')
              .pop()
              ?.toLowerCase()
              .replace(/[^a-z0-9._-]/g, '_') || k.key,
        })),
    };
    onChange([...linkedCerts, newCert]);
    setIsLinking(false);
  };

  const handleUnlink = (groupUuid: string) => {
    onChange(linkedCerts.filter((c) => c.groupUuid !== groupUuid));
    setUnlinkTarget(null);
  };

  const handleMountPathChange = (groupUuid: string, path: string) => {
    onChange(linkedCerts.map((c) => (c.groupUuid === groupUuid ? { ...c, mountPath: path } : c)));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 1.5 }}>
        <Button variant="outlined" size="small" startIcon={<Link size={14} />} onClick={() => setIsLinking(true)} disabled={isLinking || linkable.length === 0}>
          Link a Certificate
        </Button>
      </Box>

      {isLinking && <CertLinkForm availableCerts={linkable} onLink={handleLink} onCancel={() => setIsLinking(false)} />}

      {linkedCerts.length === 0 && !isLinking ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No certificates linked. Click &apos;Link a Certificate&apos; to mount certificates to your component.
          </Typography>
        </Box>
      ) : (
        linkedCerts.map((cert) => <LinkedCertCard key={cert.groupUuid} cert={cert} onUnlink={() => setUnlinkTarget(cert.groupUuid)} onMountPathChange={(path) => handleMountPathChange(cert.groupUuid, path)} />)
      )}

      <Dialog open={!!unlinkTarget} onClose={() => setUnlinkTarget(null)}>
        <DialogTitle>Unlink Certificate</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to unlink this certificate? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlinkTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => unlinkTarget && handleUnlink(unlinkTarget)}>
            Unlink
          </Button>
        </DialogActions>
      </Dialog>
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
  actualEnvId: string;
  deploymentTrackId: string;
  commitHash?: string;
  orgHandler: string;
  releaseId?: string;
  displayType?: string;
  releaseMgtReleaseId?: string;
  releaseMgtDeploymentId?: string;
  buildId?: string;
}

function AutomationConfigureDrawer({ open, onClose, projectId, componentId, envId, actualEnvId, deploymentTrackId, commitHash, orgHandler: _orgHandler, buildId }: AutomationConfigureDrawerProps) {
  const handleClose = () => {
    (document.activeElement as HTMLElement)?.blur();
    onClose();
  };

  const { data, isLoading, isError } = useSchemaConfig(projectId, componentId, envId, deploymentTrackId, commitHash);
  const { data: existingCertMappings } = useCertificateMappings(projectId, componentId, envId, deploymentTrackId, open);
  const { data: configGroups } = useConfigGroups(projectId, componentId, open);
  const save = useSaveSchemaConfig();
  const saveCertMappings = usePostCertificateMappings();
  const deployTrack = useDeployDeploymentTrack();
  const [step, setStep] = useState(1);
  const [valueMap, setValueMap] = useState<Map<string, BaseType>>(new Map());
  const [validationMap, setValidationMap] = useState<Map<string, boolean>>(new Map());
  const [sensitiveMap, setSensitiveMap] = useState<Map<string, boolean>>(new Map());
  const [linkingMap, setLinkingMap] = useState<Map<string, LinkingInfo>>(new Map());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [linkedCerts, setLinkedCerts] = useState<LinkedCert[]>([]);
  const certSeededRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedSchema = useMemo<JSONSchema | null>(() => {
    if (!data?.jsonSchema) return null;
    try {
      return JSON.parse(atob(data.jsonSchema)) as JSONSchema;
    } catch {
      return null;
    }
  }, [data?.jsonSchema]);

  // Seed values only on open; avoid clobbering edits on background refetches.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSaveError(null);
    setImportedFileName(null);
    certSeededRef.current = false;
    if (data !== undefined) {
      const initValues = new Map<string, BaseType>();
      const initSensitive = new Map<string, boolean>();
      const initLinking = new Map<string, LinkingInfo>();
      for (const cfg of data?.configurations ?? []) {
        const val = cfg.values?.[0]?.value;
        if (val !== undefined && val !== '') initValues.set(cfg.key, val);
        if (cfg.isSensitive) initSensitive.set(cfg.key, true);
        if (cfg.configGroupId || cfg.configKeyId || cfg.isDynamic) {
          initLinking.set(cfg.key, { configGroupId: cfg.configGroupId, configKeyId: cfg.configKeyId, isDynamic: cfg.isDynamic });
        }
      }
      setValueMap(initValues);
      setValidationMap(new Map());
      setSensitiveMap(initSensitive);
      setLinkingMap(initLinking);
      seededRef.current = true;
    } else {
      seededRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || seededRef.current || data === undefined) return;
    const initValues = new Map<string, BaseType>();
    const initSensitive = new Map<string, boolean>();
    const initLinking = new Map<string, LinkingInfo>();
    for (const cfg of data?.configurations ?? []) {
      const val = cfg.values?.[0]?.value;
      if (val !== undefined && val !== '') initValues.set(cfg.key, val);
      if (cfg.isSensitive) initSensitive.set(cfg.key, true);
      if (cfg.configGroupId || cfg.configKeyId || cfg.isDynamic) {
        initLinking.set(cfg.key, { configGroupId: cfg.configGroupId, configKeyId: cfg.configKeyId, isDynamic: cfg.isDynamic });
      }
    }
    setValueMap(initValues);
    setValidationMap(new Map());
    setSensitiveMap(initSensitive);
    setLinkingMap(initLinking);
    seededRef.current = true;
  }, [open, data]);

  // Seed cert mappings from existing data
  useEffect(() => {
    if (!open || certSeededRef.current || !existingCertMappings) return;
    // Group existing cert mappings by configGroupId
    const byGroup: Record<string, CertMappingConfig[]> = {};
    for (const cfg of existingCertMappings.configurations ?? []) {
      if (!cfg.configGroupId || !cfg.isFile) continue;
      if (!byGroup[cfg.configGroupId]) byGroup[cfg.configGroupId] = [];
      byGroup[cfg.configGroupId].push(cfg);
    }
    const certs: LinkedCert[] = Object.entries(byGroup).map(([groupId, cfgs]) => {
      const first = cfgs[0];
      // mountDirectory is derived from the full key (e.g., /certs/ca.crt → /certs)
      const fullKey = first.key;
      const lastSlash = fullKey.lastIndexOf('/');
      const mountPath = lastSlash > 0 ? fullKey.substring(0, lastSlash) : '/certs';
      return {
        groupUuid: groupId,
        groupName: first.configGroupName || groupId,
        mountPath,
        keys: cfgs.map((c) => ({
          keyUuid: c.configKeyId || '',
          key: c.configKeyName || c.key,
          mountedAs: lastSlash > 0 ? c.key.substring(lastSlash + 1) : c.key,
        })),
      };
    });
    if (certs.length > 0) {
      setLinkedCerts(certs);
    }
    certSeededRef.current = true;
  }, [open, existingCertMappings]);

  const handleValueChange = (key: string, value: BaseType, newMap?: Map<string, BaseType>) => {
    if (newMap) {
      setValueMap(newMap);
    } else {
      setValueMap((prev) => {
        const next = new Map(prev);
        next.set(key, value);
        return next;
      });
    }
  };

  const handleValidationChange = (key: string, isValid: boolean, newMap?: Map<string, boolean>) => {
    if (newMap) {
      setValidationMap(newMap);
    } else {
      setValidationMap((prev) => {
        const next = new Map(prev);
        next.set(key, isValid);
        return next;
      });
    }
  };

  const handleTomlImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = (ev.target?.result as string) ?? '';
      const result = parseConfigToml(content);
      if (parsedSchema && result.success && result.data) {
        const filtered = filterTomlValuesBySchema(result.data, parsedSchema);
        setValueMap((prev) => {
          const next = new Map(prev);
          filtered.forEach((v, k) => next.set(k, v));
          return next;
        });
      }
      setImportedFileName(file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearToml = () => {
    setImportedFileName(null);
    const initValues = new Map<string, BaseType>();
    const initSensitive = new Map<string, boolean>();
    const initLinking = new Map<string, LinkingInfo>();
    for (const cfg of data?.configurations ?? []) {
      const val = cfg.values?.[0]?.value;
      if (val !== undefined && val !== '') initValues.set(cfg.key, val);
      if (cfg.isSensitive) initSensitive.set(cfg.key, true);
      if (cfg.configGroupId || cfg.configKeyId || cfg.isDynamic) {
        initLinking.set(cfg.key, { configGroupId: cfg.configGroupId, configKeyId: cfg.configKeyId, isDynamic: cfg.isDynamic });
      }
    }
    setValueMap(initValues);
    setSensitiveMap(initSensitive);
    setLinkingMap(initLinking);
  };

  const handleNext = () => {
    if (step < 2) {
      setStep((s) => s + 1);
    } else {
      setSaveError(null);
      const configurations: SchemaConfigItem[] = [];
      valueMap.forEach((value, key) => {
        if (value !== '' && value !== undefined && value !== null) {
          const linking = linkingMap.get(key);
          const isSensitive = sensitiveMap.get(key) || false;
          const existing = data?.configurations?.find((c) => c.key === key);
          configurations.push({
            key,
            keyId: existing?.keyId,
            values: [{ environmentUuid: envId, value: String(value) }],
            ...(isSensitive ? { isSensitive } : {}),
            isRequired: existing?.isRequired,
            configGroupId: linking?.configGroupId,
            configKeyId: linking?.configKeyId,
            isDynamic: linking?.isDynamic,
          });
        }
      });

      const saveCerts = () => {
        // Build cert mapping configurations
        const certConfigs: CertMappingConfig[] = [];
        for (const cert of linkedCerts) {
          for (const k of cert.keys) {
            certConfigs.push({
              key: `${cert.mountPath}/${k.mountedAs}`,
              isDynamic: false,
              configGroupId: cert.groupUuid,
              configKeyId: k.keyUuid,
              configGroupName: cert.groupName,
              configKeyName: k.key,
              isFile: true,
              isSensitive: false,
              values: [{ value: `\${${cert.groupName}.${k.key}}`, environmentUuid: envId }],
            });
          }
        }

        const certPayload: CertMapping = {
          projectId,
          componentId,
          envTemplateId: envId,
          deploymentTrackId,
          configurations: certConfigs,
          ...(existingCertMappings?.mappingId ? { mappingId: existingCertMappings.mappingId } : {}),
        };

        const afterSave = () => {
          if (buildId) {
            deployTrack.mutateAsync({ componentId, id: deploymentTrackId, imageId: buildId, environmentId: actualEnvId, cronTimezone: '' }).finally(onClose);
          } else {
            onClose();
          }
        };

        if (certConfigs.length === 0 && !existingCertMappings?.mappingId) {
          afterSave();
          return;
        }

        saveCertMappings
          .mutateAsync(certPayload)
          .then(afterSave)
          .catch((err: unknown) => setSaveError(err instanceof Error ? err.message : 'Failed to save certificate mounts'));
      };

      save
        .mutateAsync({ projectId, componentId, envId, deploymentTrackId, configurations, commitHash })
        .then(saveCerts)
        .catch((err: unknown) => setSaveError(err instanceof Error ? err.message : 'Failed to save configuration'));
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
    else handleClose();
  };

  const renderConfigurations = () => {
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
    if (!data?.jsonSchema || !parsedSchema) {
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
        <ConfigForm
          schema={parsedSchema}
          valueMap={valueMap}
          validationMap={validationMap}
          linkingMap={linkingMap}
          setLinkingMap={setLinkingMap}
          sensitiveMap={sensitiveMap}
          setSensitiveMap={setSensitiveMap}
          configGroups={configGroups}
          handleValueChange={handleValueChange}
          handleValidationChange={handleValidationChange}
        />
        {saveError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {saveError}
          </Alert>
        )}
      </>
    );
  };

  const renderCertificateMount = () => <CertificateMountStep projectId={projectId} componentId={componentId} envId={envId} deploymentTrackId={deploymentTrackId} open={open} linkedCerts={linkedCerts} onChange={setLinkedCerts} />;

  const hasSchema = !isLoading && !isError && data !== null && !!data?.jsonSchema && !!parsedSchema;
  const hasValidationErrors = Array.from(validationMap.values()).some((v) => !v);
  const isApplying = save.isPending || saveCertMappings.isPending || deployTrack.isPending;
  const prevLabel = step === 1 ? 'Cancel' : 'Back';
  const nextLabel = step === 2 ? (isApplying ? 'Updating…' : 'Update') : 'Next';
  const nextDisabled = step === 1 ? hasValidationErrors || isLoading : isApplying;

  return (
    <Drawer anchor="right" open={open} onClose={handleClose} variant="temporary" sx={drawerSx}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="h5">Configurations</Typography>
        <Stack direction="row" alignItems="center" gap={1}>
          {hasSchema &&
            step === 1 &&
            (importedFileName ? (
              <Chip label={importedFileName} onDelete={handleClearToml} size="small" variant="outlined" sx={{ maxWidth: 180 }} />
            ) : (
              <Button variant="outlined" size="small" startIcon={<Upload size={14} />} onClick={() => fileInputRef.current?.click()}>
                Import config.toml
              </Button>
            ))}
          <IconButton size="small" aria-label="close" onClick={handleClose}>
            <X size={16} />
          </IconButton>
        </Stack>
      </Stack>

      {/* Step indicator */}
      <StepIndicator step={step} steps={AUTOMATION_STEPS} />

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2 }}>{step === 1 ? renderConfigurations() : renderCertificateMount()}</Box>

      {/* Footer */}
      {hasSchema && (
        <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Button onClick={handlePrev}>{prevLabel}</Button>
          <Button variant="contained" onClick={handleNext} disabled={nextDisabled} startIcon={isApplying ? <CircularProgress color="inherit" size={16} /> : undefined}>
            {nextLabel}
          </Button>
        </Stack>
      )}
      <input ref={fileInputRef} type="file" accept=".toml" style={{ display: 'none' }} onChange={handleTomlImport} />
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
  buildId?: string;
}

export default function ConfigureDrawer(props: ConfigureDrawerProps) {
  if (props.isAutomation) {
    return (
      <AutomationConfigureDrawer
        open={props.open}
        onClose={props.onClose}
        projectId={props.projectId}
        componentId={props.componentId}
        envId={props.envTemplateId ?? props.envId}
        actualEnvId={props.envId}
        deploymentTrackId={props.versionId}
        commitHash={props.commitHash}
        orgHandler={props.orgHandler}
        releaseId={props.releaseId}
        displayType={props.displayType}
        releaseMgtReleaseId={props.releaseMgtReleaseId}
        releaseMgtDeploymentId={props.releaseMgtDeploymentId}
        buildId={props.buildId}
      />
    );
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
    if (step > 1) {
      setSaveError(null);
      setStep((s) => s - 1);
    } else handleClose();
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
        <StepIndicator step={step} steps={STEPS} />

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
