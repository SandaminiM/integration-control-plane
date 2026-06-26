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

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { TailscalePortMapping } from '../types/tailscale';

/** Decode base64, returning '' for malformed input (BYOI endpoints YAML is base64-encoded). */
export function safeAtob(value: string): string {
  try {
    return atob(value);
  } catch {
    return '';
  }
}

/** Secret + ConfigMap names are derived from the component handle + env, matching Devant. */
export const tailscaleSecretName = (handle: string, envName: string): string => `${handle}-${envName.toLowerCase()}-auth`;
export const tailscaleConfigMapName = (handle: string, envName: string): string => `${handle}-${envName.toLowerCase()}-config`;

/**
 * Serialize the proxy port → "ip:targetPort" map for the ConfigMap `config.yaml`:
 *   portMappings:
 *     8080: "100.108.78.93:8090"
 */
export function buildPortMappingsYaml(mappings: TailscalePortMapping[]): string {
  const portMappings: Record<string, string> = {};
  for (const m of mappings) portMappings[String(m.port)] = `${m.ip}:${m.targetPort}`;
  return stringifyYaml({ portMappings });
}

/** Parse the ConfigMap `config.yaml` back into a `port → {ip,targetPort}` lookup. */
export function parsePortMappingsYaml(yaml: string | undefined): Map<number, { ip: string; targetPort: number }> {
  const out = new Map<number, { ip: string; targetPort: number }>();
  if (!yaml) return out;
  try {
    const doc = parseYaml(yaml) as { portMappings?: Record<string, string> } | null;
    const pm = doc?.portMappings ?? {};
    for (const [port, target] of Object.entries(pm)) {
      const [ip, targetPort] = String(target).split(':');
      out.set(Number(port), { ip: ip ?? '', targetPort: Number(targetPort) || 0 });
    }
  } catch {
    // Malformed YAML → treat as no mappings.
  }
  return out;
}

/**
 * Serialize the BYOI endpoints file. Each proxy port becomes a TCP endpoint:
 *   version: "0.1"
 *   endpoints:
 *     - name: Internal APIs
 *       port: 8080
 *       type: TCP
 *       networkVisibility: Project
 *       context: /
 */
export function buildEndpointsYaml(mappings: TailscalePortMapping[]): string {
  const endpoints = mappings.map((m) => ({ name: m.name, port: m.port, type: 'TCP', networkVisibility: 'Project', context: '/' }));
  return stringifyYaml({ version: '0.1', endpoints });
}

/** Parse the BYOI endpoints YAML into `[{ name, port }]`. */
export function parseEndpointsYaml(yaml: string | undefined): Array<{ name: string; port: number }> {
  if (!yaml) return [];
  try {
    const doc = parseYaml(yaml) as { endpoints?: Array<{ name?: string; port?: number }> } | null;
    return (doc?.endpoints ?? []).map((e) => ({ name: e.name ?? '', port: Number(e.port) || 0 }));
  } catch {
    return [];
  }
}

/**
 * Join BYOI endpoints (name + port) with the ConfigMap port mappings (ip +
 * targetPort) by port to reconstruct the editor rows.
 */
export function joinPortMappings(endpointsYaml: string | undefined, configMapYaml: string | undefined): TailscalePortMapping[] {
  const endpoints = parseEndpointsYaml(endpointsYaml);
  const mappings = parsePortMappingsYaml(configMapYaml);
  return endpoints.map((e) => {
    const m = mappings.get(e.port);
    return { name: e.name, port: e.port, ip: m?.ip ?? '', targetPort: m?.targetPort ?? 0 };
  });
}
