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

/**
 * Single source of truth for the Platform Engineer perspective's left nav.
 *
 * This one config drives everything: the sidebar tree (AppLayout), the routes
 * (routes.tsx generates a ComingSoon page per leaf), active-item matching, and
 * the parent-group auto-expand map. Add a leaf here and it appears everywhere.
 *
 * All PE routes live under `/organizations/:orgHandler/pe/<segment>` (org scope).
 */

import {
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Briefcase,
  ClipboardList,
  Container,
  Cpu,
  Database,
  FileKey,
  Fingerprint,
  Gauge,
  GitBranch,
  Globe,
  Hammer,
  HardDrive,
  HeartPulse,
  KeyRound,
  Layers,
  LayoutDashboard,
  LineChart,
  Link2,
  Lock,
  Network,
  PieChart,
  Plug,
  Radar,
  Radio,
  Rocket,
  Scale,
  Scaling,
  Server,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Truck,
  Users,
  User,
  UsersRound,
  Wallet,
  Webhook,
  Workflow,
  type LucideIcon,
} from '@wso2/oxygen-ui-icons-react';
import { hasComponent, hasProject, type Scope } from '../nav';

/** A clickable leaf item that maps to a `pe/<segment>` route. */
export interface PeNavItem {
  /** Stable nav id — used as the Sidebar item id and in the active/select maps. */
  id: string;
  label: string;
  /** Path segment after `pe/`, e.g. `infrastructure/data-planes`. Must be unique. */
  segment: string;
  icon: LucideIcon;
}

/** An expandable section that groups leaf items under a heading. */
export interface PeNavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: PeNavItem[];
}

export type PeNavEntry = PeNavItem | PeNavGroup;

export function isPeNavGroup(entry: PeNavEntry): entry is PeNavGroup {
  return (entry as PeNavGroup).items !== undefined;
}

export const PE_NAV: PeNavEntry[] = [
  { id: 'pe-overview', label: 'Overview', segment: 'overview', icon: LayoutDashboard },
  {
    id: 'pe-infrastructure',
    label: 'Infrastructure',
    icon: Server,
    items: [
      { id: 'pe-data-planes', label: 'Data Planes', segment: 'infrastructure/data-planes', icon: Layers },
      { id: 'pe-environments', label: 'Environments', segment: 'infrastructure/environments', icon: Globe },
      { id: 'pe-credentials', label: 'Credentials', segment: 'infrastructure/credentials', icon: KeyRound },
      { id: 'pe-domains', label: 'Domains', segment: 'infrastructure/domains', icon: Link2 },
    ],
  },
  {
    id: 'pe-user-management',
    label: 'User Management',
    icon: Users,
    items: [
      { id: 'pe-users', label: 'Users', segment: 'user-management/users', icon: User },
      { id: 'pe-groups', label: 'Groups', segment: 'user-management/groups', icon: UsersRound },
      { id: 'pe-roles', label: 'Roles', segment: 'user-management/roles', icon: ShieldCheck },
    ],
  },
  {
    id: 'pe-devops',
    label: 'DevOps',
    icon: GitBranch,
    items: [
      { id: 'pe-ci-pipelines', label: 'CI Pipelines', segment: 'devops/ci-pipelines', icon: Hammer },
      { id: 'pe-cd-pipelines', label: 'CD Pipelines', segment: 'devops/cd-pipelines', icon: Rocket },
      { id: 'pe-config-groups', label: 'Configuration Groups', segment: 'devops/config-groups', icon: SlidersHorizontal },
      { id: 'pe-external-ci', label: 'External CI', segment: 'devops/external-ci', icon: Webhook },
      { id: 'pe-certificates', label: 'Certificates', segment: 'devops/certificates', icon: FileKey },
    ],
  },
  {
    id: 'pe-governance',
    label: 'Governance',
    icon: Scale,
    items: [
      { id: 'pe-workflows', label: 'Workflows', segment: 'governance/workflows', icon: Workflow },
      { id: 'pe-egress-control', label: 'Egress Control', segment: 'governance/egress-control', icon: ShieldAlert },
      { id: 'pe-approvals', label: 'Approvals', segment: 'governance/approvals', icon: BadgeCheck },
    ],
  },
  {
    id: 'pe-db-services',
    label: 'DB & Services',
    icon: Database,
    items: [
      { id: 'pe-databases', label: 'Databases', segment: 'db-services/databases', icon: Database },
      { id: 'pe-vector-databases', label: 'Vector Databases', segment: 'db-services/vector-databases', icon: Boxes },
      { id: 'pe-third-party', label: 'Third Party Services', segment: 'db-services/third-party', icon: Plug },
      { id: 'pe-message-brokers', label: 'Message Brokers', segment: 'db-services/message-brokers', icon: Radio },
      { id: 'pe-genai-services', label: 'GenAI Services', segment: 'db-services/genai-services', icon: Sparkles },
    ],
  },
  {
    id: 'pe-k8s',
    label: 'K8s Operations',
    icon: Boxes,
    items: [
      { id: 'pe-runtime', label: 'Runtime', segment: 'k8s/runtime', icon: Cpu },
      { id: 'pe-containers', label: 'Containers', segment: 'k8s/containers', icon: Container },
      { id: 'pe-configs-secrets', label: 'Configs & Secrets', segment: 'k8s/configs-secrets', icon: Lock },
      { id: 'pe-health-checks', label: 'Health Checks', segment: 'k8s/health-checks', icon: HeartPulse },
      { id: 'pe-scaling', label: 'Scaling', segment: 'k8s/scaling', icon: Scaling },
      { id: 'pe-storage', label: 'Storage', segment: 'k8s/storage', icon: HardDrive },
    ],
  },
  {
    id: 'pe-insights',
    label: 'Insights',
    icon: LineChart,
    items: [
      { id: 'pe-operational', label: 'Operational', segment: 'insights/operational', icon: Gauge },
      { id: 'pe-delivery', label: 'Delivery', segment: 'insights/delivery', icon: Truck },
      { id: 'pe-business', label: 'Business', segment: 'insights/business', icon: Briefcase },
      { id: 'pe-cost', label: 'Cost', segment: 'insights/cost', icon: Wallet },
    ],
  },
  {
    id: 'pe-observability',
    label: 'Observability',
    icon: Radar,
    items: [
      { id: 'pe-alerts', label: 'Alerts', segment: 'observability/alerts', icon: Bell },
      { id: 'pe-metrics', label: 'Metrics', segment: 'observability/metrics', icon: BarChart3 },
      { id: 'pe-runtime-logs', label: 'Runtime Logs', segment: 'observability/runtime-logs', icon: ClipboardList },
      { id: 'pe-audit-logs', label: 'Audit Logs', segment: 'observability/audit-logs', icon: ClipboardList },
    ],
  },
  {
    id: 'pe-api-management',
    label: 'API Management',
    icon: Network,
    items: [
      { id: 'pe-dev-portal', label: 'Developer Portal', segment: 'api-management/developer-portal', icon: BookOpen },
      { id: 'pe-moesif', label: 'Moesif Dashboard', segment: 'api-management/moesif-dashboard', icon: PieChart },
      { id: 'pe-consumer-idps', label: 'Consumer IdPs', segment: 'api-management/consumer-idps', icon: Fingerprint },
    ],
  },
];

/** Every leaf item, flattened (groups expanded, standalone items kept). */
export const PE_LEAVES: PeNavItem[] = PE_NAV.flatMap((entry) => (isPeNavGroup(entry) ? entry.items : [entry]));

/** Leaf nav id → parent group id, for sidebar auto-expand. */
export const PE_PARENT_MAP: Record<string, string> = Object.fromEntries(
  PE_NAV.flatMap((entry) => (isPeNavGroup(entry) ? entry.items.map((item) => [item.id, entry.id] as const) : [])),
);

/**
 * Scope-aware PE routing.
 *
 * The PE perspective mirrors the Developer nav's three scopes. As in Devant, the
 * same nav groups show at every scope; only the URL prefix changes, and items
 * that aren't meaningful at a scope resolve to a ComingSoon stub. The route
 * params (`:projectHandler` / `:componentHandler`) are what `ScopeResolver` reads
 * to drive the header switchers, so the paths must include them.
 */
export type PeScopeLevel = 'org' | 'project' | 'component';

/** Route path prefix (React Router pattern) per PE scope level. */
export const PE_SCOPE_PREFIX: Record<PeScopeLevel, string> = {
  org: 'organizations/:orgHandler/pe',
  project: 'organizations/:orgHandler/pe/projects/:projectHandler',
  component: 'organizations/:orgHandler/pe/projects/:projectHandler/components/:componentHandler',
};

/** Absolute path prefix for a concrete scope (used at runtime for navigation). */
export function peBase(scope: Scope): string {
  if (hasComponent(scope)) return `/organizations/${scope.org}/pe/projects/${scope.project}/components/${scope.component}`;
  if (hasProject(scope)) return `/organizations/${scope.org}/pe/projects/${scope.project}`;
  return `/organizations/${scope.org}/pe`;
}

/** One route def per (scope level × leaf). Consumed by routes.tsx to build the tree. */
export interface PeRouteDef {
  level: PeScopeLevel;
  id: string;
  segment: string;
  label: string;
  /** Full React Router path pattern including scope params. */
  path: string;
}

export const PE_ALL_ROUTE_DEFS: PeRouteDef[] = (['org', 'project', 'component'] as const).flatMap((level) =>
  PE_LEAVES.map((leaf) => ({ level, id: leaf.id, segment: leaf.segment, label: leaf.label, path: `${PE_SCOPE_PREFIX[level]}/${leaf.segment}` })),
);

/** Absolute URL for a PE nav id within the given scope, or undefined if unknown. */
export function pePathForId(scope: Scope, id: string): string | undefined {
  const leaf = PE_LEAVES.find((item) => item.id === id);
  return leaf ? `${peBase(scope)}/${leaf.segment}` : undefined;
}

/** The PE overview landing route for an org — the perspective switcher's entry point. */
export function peOverviewPath(org: string): string {
  return `/organizations/${org}/pe/overview`;
}

/** Resolve the active PE nav id from the current pathname within a scope. */
export function peActiveId(pathname: string, scope: Scope): string {
  const base = peBase(scope);
  const rest = pathname.slice(base.length).replace(/^\//, '');
  const match = PE_LEAVES.find((item) => rest === item.segment || rest.startsWith(`${item.segment}/`));
  return match ? match.id : 'pe-overview';
}
