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

import mermaid from 'mermaid';

const MERMAID_TYPE_KEYWORDS = [
  'flowchart', 'graph', 'sequencediagram', 'classDiagram', 'statediagram',
  'erdiagram', 'journey', 'gantt', 'pie', 'quadrantchart', 'requirementdiagram',
  'gitgraph', 'mindmap', 'timeline', 'sankey-beta', 'xychart-beta', 'block-beta',
  'packet-beta', 'kanban', 'architecture-beta',
];

let diagramCounter = 0;
let mermaidInitialized = false;

export function nextDiagramId(): string {
  return `mermaid-chart-${++diagramCounter}`;
}

export function ensureMermaidInit(): void {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    fontSize: 14,
    flowchart: { htmlLabels: true, curve: 'basis', padding: 12 },
    // Prevents mermaid from rendering error SVGs into document.body on parse failure,
    // which causes orphaned elements that widen the page and produce layout shifts.
    suppressErrorRendering: true,
  });
  mermaidInitialized = true;
}

/** Strips a ```mermaid code fence. Prepends `flowchart TB` when no diagram-type directive is found. */
export function extractDefinition(raw: string): string {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  let body = normalized;
  if (normalized.toLowerCase().startsWith('```mermaid')) {
    body = normalized
      .replace(/^```mermaid[^\n]*\n/i, '')
      .replace(/\n```\s*$/, '')
      .trim();
  }
  const firstToken = body.split(/[\s({[]/)[0].toLowerCase();
  if (!MERMAID_TYPE_KEYWORDS.includes(firstToken)) {
    body = `flowchart TB\n${body}`;
  }
  return body;
}

/** Coerces a CSS color to a hex string safe for mermaid classDef (no commas/parens). */
export function toMermaidSafeColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const v = value.trim();
  if (!v) return fallback;
  if (v.startsWith('#')) return v;
  const m = v.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) {
    const [r, g, b] = [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0'));
    return `#${r}${g}${b}`;
  }
  return fallback;
}

export function buildClassDefs(primary: string, primaryLight: string, grey: string): string {
  return [
    `classDef startNode fill:${primaryLight},stroke:${primary},stroke-width:0px,color:#fff`,
    `classDef endNode fill:${primaryLight},stroke:${primary},stroke-width:0px,color:#fff`,
    `classDef inputNode fill:white,stroke:${grey},stroke-width:1px,color:#000`,
    `classDef processNode fill:white,stroke:${grey},stroke-width:1px,color:#000`,
    `classDef decisionNode fill:#FFF9E6,stroke:#FFA000,stroke-width:2px,color:#000`,
  ].join('\n');
}

/** Removes any DOM elements mermaid orphaned in document.body. */
export function purgeMermaidOrphans(id: string): void {
  [`d${id}`, id].forEach((orphanId) => document.getElementById(orphanId)?.remove());
  document.querySelectorAll('[id^="mermaid-chart-"]').forEach((el) => {
    if ((el as HTMLElement).style?.visibility === 'hidden') el.remove();
  });
}

export async function renderMermaidSvg(id: string, definition: string): Promise<string> {
  const { svg } = await mermaid.render(id, definition);
  return svg;
}
