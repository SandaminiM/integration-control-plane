# ICP iPaaS — Agent Guide

## What this app is

WSO2 Integration Control Plane (ICP) iPaaS frontend. A React + TypeScript SPA that lets users create, deploy, and manage integrations across cloud and on-premise environments. It talks to a set of Choreo/WSO2 backend services via REST and GraphQL.

---

## Four-layer architecture

Every feature follows a strict four-layer separation. Violating these boundaries is the most common class of error an AI agent can introduce.

```text
┌─────────────────────────────────────────────────┐
│  pages/   components/                           │  UI only
│  Import from: hooks/, types/, constants/,       │
│               utils/, assets/, auth/ (OAuth      │
│               state utilities only — see below) │
└───────────────┬─────────────────────────────────┘
                │ imports
┌───────────────▼─────────────────────────────────┐
│  hooks/                                         │  React Query wrappers
│  Import from: api/, types/, config/             │
│  Never: JSX, UI state, navigation               │
└───────────────┬─────────────────────────────────┘
                │ imports
┌───────────────▼─────────────────────────────────┐
│  api/                                           │  Pure async service fns
│  Import from: auth/tokenManager (clients only), │
│               config/, types/                   │
│  Never: React hooks, JSX                        │
└───────────────┬─────────────────────────────────┘
                │ imports
┌───────────────▼─────────────────────────────────┐
│  auth/tokenManager.ts                           │  HTTP transport + token mgmt
│  api/httpClients.ts   api/graphql.ts            │
└─────────────────────────────────────────────────┘

types/      ← imported by any layer, never imports from any layer
constants/  ← same
utils/      ← same
config/     ← same
```

**The single most important rule**: components and pages must never import directly from `api/`, `auth/tokenManager` (data functions), or any backend transport. All data access goes through `hooks/`.

---

## The one accepted exception

`auth/tokenManager.ts` exports two categories of functions:

| Category | Examples | Used in |
|---|---|---|
| OAuth CSRF state (pure local storage utilities) | `generateAndSaveGitHubState`, `validateAndClearGitHubState`, `validateAndClearOIDCState`, `getAndClearRedirectUrl` | pages — acceptable |
| Token/data access | `getOrgUuidFromToken`, `authenticatedFetch` | hooks only, via `useOrgUuid()` |

Pages may import the OAuth CSRF helpers directly because they are pure client-side state utilities with no cache semantics, not data access.

---

## Adding a new API endpoint — end to end

1. **`src/types/<domain>.ts`** — add or extend the TypeScript type
2. **`src/api/<domain>.ts`** — add a named async service function using the appropriate client from `httpClients.ts`
3. **`src/hooks/use<Domain>.ts`** — wrap with `useQuery` or `useMutation`; set a stable `queryKey`
4. **`src/components/` or `src/pages/`** — call the hook; never call the service function directly

---

## Key technology choices

| Concern | Solution |
|---|---|
| Server state / caching | TanStack Query (React Query v5) — `useQuery`, `useMutation`, `useQueryClient` |
| UI components | `@wso2/oxygen-ui` and `@wso2/oxygen-ui-icons-react` |
| Routing | React Router v7 (`useNavigate`, `useParams`) |
| GraphQL | `gql()` helper in `api/graphql.ts` — returns a typed fetch function |
| Runtime config | `window.API_CONFIG` — shape defined in `src/config/runtimeConfig.ts` |
| Org UUID | `useOrgUuid()` hook (`src/hooks/useOrgUuid.ts`) — never call `getOrgUuidFromToken()` from UI |

---

## Directory reference

```text
src/
  api/          Service functions + HTTP clients (see src/api/AGENTS.md)
  hooks/        React Query hooks, one file per domain (see src/hooks/AGENTS.md)
  types/        TypeScript types — the layer contract (see src/types/AGENTS.md)
  components/   Reusable UI components (see src/components/AGENTS.md)
  pages/        Route-level page components (see src/pages/AGENTS.md)
  auth/         OIDC/token management — only tokenManager.ts is consumed by hooks
  config/       Runtime config helpers (runtimeConfig.ts, statusColors.ts)
  constants/    Static lookup tables, style constants, route constants
  contexts/     React context providers (non-server state only)
  layouts/      App shell and layout wrappers
  utils/        Pure utility functions (no React, no API calls)
  assets/       SVG icons and static assets
  mock-data/    Local mock fixtures for development
```

---

## Common mistakes to avoid

- **Do not add `useQuery`/`useMutation` inside `api/` files.** They belong in `hooks/`.
- **Do not call `fetch` or `authenticatedFetch` inside a component or page.** Write a service function in `api/` and a hook in `hooks/`.
- **Do not add new types inline in `api/` or `hooks/` files.** Types go in `src/types/`.
- **Do not create a new HTTP client.** Reuse the appropriate named client from `api/httpClients.ts`.
- **Do not import `useQuery`/`useMutation` directly in pages/components.** Use the domain hook.
