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

```
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

## Adding a new service function

1. Pick the correct named client from `httpClients.ts` for the target backend.
2. Write a typed async function — input and return types defined in `src/types/`.
3. If the endpoint can return 403 due to token scope, wrap with `withStsRetry` or `withScopeRetry`.
4. Export the function.
5. Do **not** write a `useQuery`/`useMutation` wrapper here — that goes in `src/hooks/`.
