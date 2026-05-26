# src/api/ — Service Layer

## Purpose

Pure async service functions that talk to backend APIs. No React, no hooks, no JSX.

A component or page that needs data **must not** import from this directory. Use the corresponding hook in `src/hooks/` instead.

---

## What belongs here

- Named async functions (`fetchBuilds`, `createComponent`, `updateApimApi`, …)
- HTTP client definitions (`httpClients.ts`)
- The GraphQL wrapper (`graphql.ts`)
- Request/response type adapters too narrow to live in `src/types/`

## What does not belong here

- `useQuery`, `useMutation`, `useQueryClient` — those go in `src/hooks/`
- React state, effects, or context
- Navigation logic

---

## Transport tiers

```text
auth/tokenManager.ts         authenticatedFetch — token injection, 401 refresh
        ↓
api/httpClients.ts           createHttpClient factory, named clients, retry helpers
api/graphql.ts               gql() helper for GraphQL queries
        ↓
api/<domain>.ts              Named service functions
```

See the full client table in `src/api/README.md`.

---

## 403 handling

Two retry helpers are exported from `httpClients.ts`. Domain files use these instead of calling `authenticatedFetch` directly:

| Helper | When to use |
|---|---|
| `withStsRetry(fn)` | Token is unscoped (no org UUID); STS configured. Refreshes token then retries once. |
| `withScopeRetry(fn)` | APIM scope validation error (code 900910). Refreshes token then retries once. |

`createHttpClient()` also accepts an `on403` callback for client-level custom handling.

---

## Known deviations from standard client usage

Only one domain file calls `authenticatedFetch` directly. All other 403 retry cases are handled via `withStsRetry`/`withScopeRetry`.

| File | Function | Reason |
|---|---|---|
| `copilot.ts` | `getAiCopilotAnswer` | Caller-provided URL, streaming `Response`, and custom per-request headers — incompatible with `createHttpClient` |

`graphql.ts` and `httpClients.ts` also call `authenticatedFetch` internally — those are transport-layer files, not domain files, so this is expected.

---

## Product-specific implementations

The API layer is split by product. Domain stub files at the top of this directory (`components.ts`, `builds.ts`, …) are each a single re-export:

```ts
// src/api/components.ts
export * from '#api/components';
```

Vite resolves `#api` to `src/api/${PRODUCT}/` at build time, so only one product's code enters the bundle.

```text
src/api/
  components.ts          ← public stub — re-exports from #api/components
  builds.ts              ← public stub
  …
  devant/                ← real GraphQL/REST implementations
    components.ts
    builds.ts
    …
  cloud/                 ← not-implemented stubs
    components.ts        ← throws "[cloud] components.fetchComponents: not implemented"
    …
  icp/                   ← not-implemented stubs
    components.ts        ← throws "[icp] components.fetchComponents: not implemented"
    …
```

### Adding a new service function

1. Add the function to `src/api/devant/<domain>.ts` using the appropriate named client.
2. Add a matching stub function to `src/api/cloud/<domain>.ts` and `src/api/icp/<domain>.ts` — same signature, body throws.
3. The public stub (`src/api/<domain>.ts`) needs no change if the domain file already exists.
4. If it is a new domain, create the public stub: `export * from '#api/<domain>';`
5. Write a typed async function — input and return types defined in `src/types/`.
6. If the endpoint can return 403 due to token scope, wrap with `withStsRetry` or `withScopeRetry`.
7. Do **not** write a `useQuery`/`useMutation` wrapper here — that goes in `src/hooks/`.

### Checking whether a feature is product-specific

If a backend endpoint only makes sense for one product, only implement it in that product's subfolder. The stub in the other products can throw. The route or UI that calls it must be gated with `IS_DEVANT` / `IS_ICP` / `IS_CLOUD` from `src/features.ts` so the dead code is eliminated at build time.
