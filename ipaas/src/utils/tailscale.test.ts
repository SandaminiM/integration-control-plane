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

import { describe, expect, it } from 'vitest';
import { safeAtob, tailscaleSecretName, tailscaleConfigMapName, buildPortMappingsYaml, parsePortMappingsYaml, buildEndpointsYaml, parseEndpointsYaml, joinPortMappings } from './tailscale';

describe('safeAtob', () => {
  it('decodes valid base64', () => {
    expect(safeAtob('aGVsbG8=')).toBe('hello');
  });

  it('returns empty string for malformed input', () => {
    expect(safeAtob('!!!not-base64!!!')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(safeAtob('')).toBe('');
  });
});

describe('tailscaleSecretName', () => {
  it('joins handle and lowercased env name with -auth', () => {
    expect(tailscaleSecretName('my-proxy', 'Production')).toBe('my-proxy-production-auth');
  });
});

describe('tailscaleConfigMapName', () => {
  it('joins handle and lowercased env name with -config', () => {
    expect(tailscaleConfigMapName('my-proxy', 'Production')).toBe('my-proxy-production-config');
  });
});

describe('buildPortMappingsYaml', () => {
  it('serializes port mappings keyed by port', () => {
    const yaml = buildPortMappingsYaml([{ name: 'Internal', port: 8080, ip: '100.108.78.93', targetPort: 8090 }]);
    expect(yaml).toBe('portMappings:\n  "8080": 100.108.78.93:8090\n');
  });

  it('serializes multiple mappings', () => {
    const yaml = buildPortMappingsYaml([
      { name: 'Internal', port: 8080, ip: '100.108.78.93', targetPort: 8090 },
      { name: 'Other', port: 9090, ip: '10.0.0.1', targetPort: 80 },
    ]);
    expect(yaml).toBe('portMappings:\n  "8080": 100.108.78.93:8090\n  "9090": 10.0.0.1:80\n');
  });

  it('serializes an empty mapping list', () => {
    expect(buildPortMappingsYaml([])).toBe('portMappings: {}\n');
  });
});

describe('parsePortMappingsYaml', () => {
  it('returns an empty map for undefined input', () => {
    expect(parsePortMappingsYaml(undefined)).toEqual(new Map());
  });

  it('returns an empty map for empty string input', () => {
    expect(parsePortMappingsYaml('')).toEqual(new Map());
  });

  it('parses a valid port mappings document', () => {
    const yaml = 'portMappings:\n  "8080": 100.108.78.93:8090\n';
    const result = parsePortMappingsYaml(yaml);
    expect(result.get(8080)).toEqual({ ip: '100.108.78.93', targetPort: 8090 });
  });

  it('parses multiple entries', () => {
    const yaml = 'portMappings:\n  "8080": 100.108.78.93:8090\n  "9090": 10.0.0.1:80\n';
    const result = parsePortMappingsYaml(yaml);
    expect(result.size).toBe(2);
    expect(result.get(9090)).toEqual({ ip: '10.0.0.1', targetPort: 80 });
  });

  it('returns an empty map when there is no portMappings key', () => {
    expect(parsePortMappingsYaml('foo: bar')).toEqual(new Map());
  });

  it('defaults ip and targetPort when the target segment is malformed', () => {
    const result = parsePortMappingsYaml('portMappings:\n  "8080": onlyip\n');
    expect(result.get(8080)).toEqual({ ip: 'onlyip', targetPort: 0 });
  });

  it('returns an empty map for malformed yaml', () => {
    expect(parsePortMappingsYaml(':::not: valid: yaml: [')).toEqual(new Map());
  });
});

describe('buildEndpointsYaml', () => {
  it('serializes mappings into TCP endpoints', () => {
    const yaml = buildEndpointsYaml([{ name: 'Internal APIs', port: 8080, ip: '100.108.78.93', targetPort: 8090 }]);
    expect(yaml).toBe('version: "0.1"\nendpoints:\n  - name: Internal APIs\n    port: 8080\n    type: TCP\n    networkVisibility: Project\n    context: /\n');
  });

  it('serializes an empty endpoints list', () => {
    expect(buildEndpointsYaml([])).toBe('version: "0.1"\nendpoints: []\n');
  });
});

describe('parseEndpointsYaml', () => {
  it('returns an empty array for undefined input', () => {
    expect(parseEndpointsYaml(undefined)).toEqual([]);
  });

  it('returns an empty array for empty string input', () => {
    expect(parseEndpointsYaml('')).toEqual([]);
  });

  it('parses a valid endpoints document', () => {
    const yaml = 'version: "0.1"\nendpoints:\n  - name: Internal APIs\n    port: 8080\n';
    expect(parseEndpointsYaml(yaml)).toEqual([{ name: 'Internal APIs', port: 8080 }]);
  });

  it('returns an empty array when there is no endpoints key', () => {
    expect(parseEndpointsYaml('version: "0.1"')).toEqual([]);
  });

  it('defaults missing name and port fields', () => {
    const yaml = 'endpoints:\n  - foo: bar\n';
    expect(parseEndpointsYaml(yaml)).toEqual([{ name: '', port: 0 }]);
  });

  it('returns an empty array for malformed yaml', () => {
    expect(parseEndpointsYaml(':::not: valid: yaml: [')).toEqual([]);
  });
});

describe('joinPortMappings', () => {
  it('joins endpoints with their matching config map entry', () => {
    const endpointsYaml = 'endpoints:\n  - name: Internal APIs\n    port: 8080\n';
    const configMapYaml = 'portMappings:\n  "8080": 100.108.78.93:8090\n';
    expect(joinPortMappings(endpointsYaml, configMapYaml)).toEqual([{ name: 'Internal APIs', port: 8080, ip: '100.108.78.93', targetPort: 8090 }]);
  });

  it('defaults ip and targetPort when there is no matching config map entry', () => {
    const endpointsYaml = 'endpoints:\n  - name: Internal APIs\n    port: 8080\n';
    expect(joinPortMappings(endpointsYaml, undefined)).toEqual([{ name: 'Internal APIs', port: 8080, ip: '', targetPort: 0 }]);
  });

  it('returns an empty array when there are no endpoints', () => {
    expect(joinPortMappings(undefined, undefined)).toEqual([]);
  });
});
