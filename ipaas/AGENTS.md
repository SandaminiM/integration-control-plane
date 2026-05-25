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

## Product gating — shared vs product-specific

This codebase builds three distinct products from one source tree:

| `PRODUCT` | Description |
|-----------|-------------|
| `devant`  | Choreo v2 / preview-dv (default) |
| `cloud`   | Choreo v3 / cloud |
| `icp`     | Local / ICP desktop |

### Build-time flags

`src/features.ts` exports three boolean constants that Vite replaces at build time. Rollup/esbuild eliminates dead branches — unused product code never reaches the bundle.

```ts
import { IS_DEVANT, IS_CLOUD, IS_ICP } from '../features';
```

`__PRODUCT__` is a Vite `define` global; never read it directly. Use the flags from `features.ts`.

### Before you write product-specific code — ask yourself

1. **Is this feature shared across all products?** → No gating needed, code stays in `src/components/` / `src/pages/` / `src/api/` as usual.
2. **Is this a small 1–2 element toggle?** → Use `IS_DEVANT` / `IS_ICP` inline.
3. **Are many toggles following a consistent pattern?** → Add a key to `productConfig` in `src/product-config.ts`.
4. **Does a whole component/page render completely differently per product?** → Use the `#product` alias (see below).
5. **Does a page only exist in one product?** → Gate the route in `src/config/routes.tsx` using `IS_DEVANT` etc.

### `#api` alias — product-specific API implementations

All API domain stubs (`src/api/components.ts`, `builds.ts`, …) re-export from `#api/<domain>`:

```ts
// src/api/components.ts
export * from '#api/components';
```

Vite resolves `#api` → `src/api/${product}/` at build time. Only the selected product's implementation enters the bundle.

| Directory | Purpose |
|-----------|---------|
| `src/api/devant/` | Real GraphQL/REST implementations |
| `src/api/cloud/`  | Placeholder stubs (throw `[cloud] x: not implemented`) |
| `src/api/icp/`    | Placeholder stubs (throw `[icp] x: not implemented`) |

When you add a new API function, add it to **all three** product implementations. Use the same function signature. Real logic goes in `devant/`; stubs just throw.

### `#product` alias — product-specific UI variants

When a whole component needs a different implementation per product, use the `#product` alias:

```ts
// consumer
import EnvironmentCardBody from '#product/EnvironmentCardBody';
```

Vite resolves `#product` → `src/product/${product}/`. Only the selected product's file enters the bundle (DCE preserved).

**Shell pattern** — extract shared structure into a shell component:
```
src/components/EnvironmentCard/EnvironmentCardShell.tsx  ← shared shell
src/product/icp/EnvironmentCardBody.tsx                 ← icp variant (imports shell)
src/product/devant/EnvironmentCardBody.tsx              ← devant variant (imports shell)
```

The shell must **not** import product files — that would pull all variants into every bundle.

Cloud and devant share the same UI; only `src/product/icp/` accumulates UI variants.

See `src/product/README.md` for the full guide.

### TypeScript paths

`tsconfig.app.json` maps both aliases to the `devant/` folder for type checking regardless of build product. This means the IDE always type-checks against devant implementations — which is intentional since devant is the reference product.

---

## Adding a new API endpoint — end to end

1. **`src/types/<domain>.ts`** — add or extend the TypeScript type
2. **`src/api/devant/<domain>.ts`** — add the real implementation using the appropriate client from `httpClients.ts`
3. **`src/api/cloud/<domain>.ts`** and **`src/api/icp/<domain>.ts`** — add a matching stub that throws `[cloud] domain.fn: not implemented`
4. **`src/hooks/use<Domain>.ts`** — wrap with `useQuery` or `useMutation`; set a stable `queryKey`
5. **`src/components/` or `src/pages/`** — call the hook; never call the service function directly

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
  api/              Public domain stubs — each re-exports from #api/<domain> (see src/api/AGENTS.md)
    devant/         Real GraphQL/REST implementations
    cloud/          Not-implemented stubs for cloud product
    icp/            Not-implemented stubs for icp product
  product/          Product-specific UI variants resolved via #product alias (see src/product/README.md)
    devant/         Devant UI variants
    cloud/          Cloud UI variants (currently empty — cloud shares devant UI)
    icp/            ICP UI variants
  hooks/            React Query hooks, one file per domain (see src/hooks/AGENTS.md)
  types/            TypeScript types — the layer contract (see src/types/AGENTS.md)
  components/       Reusable shared UI components (see src/components/AGENTS.md)
  pages/            Route-level page components (see src/pages/AGENTS.md)
  features.ts       Build-time IS_DEVANT / IS_CLOUD / IS_ICP flags
  auth/             OIDC/token management — only tokenManager.ts is consumed by hooks
  config/           Runtime config helpers (runtimeConfig.ts, statusColors.ts)
  constants/        Static lookup tables, style constants, route constants
  contexts/         React context providers (non-server state only)
  layouts/          App shell and layout wrappers
  utils/            Pure utility functions (no React, no API calls)
  assets/           SVG icons and static assets
  mock-data/        Local mock fixtures for development
```

---

## Common mistakes to avoid

- **Do not add `useQuery`/`useMutation` inside `api/` files.** They belong in `hooks/`.
- **Do not call `fetch` or `authenticatedFetch` inside a component or page.** Write a service function in `api/` and a hook in `hooks/`.
- **Do not add new types inline in `api/` or `hooks/` files.** Types go in `src/types/`.
- **Do not create a new HTTP client.** Reuse the appropriate named client from `api/httpClients.ts`.
- **Do not import `useQuery`/`useMutation` directly in pages/components.** Use the domain hook.
- **Do not read `__PRODUCT__` directly.** Use `IS_DEVANT`, `IS_CLOUD`, `IS_ICP` from `src/features.ts`.
- **Do not import from `src/api/devant/` directly.** Import from `src/api/<domain>.ts` (the public stub) or via the `#api` alias inside product implementations only.
- **Do not put a product variant file in `src/components/` or `src/pages/`.** Product-specific whole-component variants go in `src/product/<product>/`.
- **Do not add new API functions only to `src/api/devant/`.** Add a matching stub to `cloud/` and `icp/` too so the other products still build.
