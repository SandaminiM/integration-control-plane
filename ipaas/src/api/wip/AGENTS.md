# src/api/wip/ — wip Implementation Notes

This file covers implementation details **specific to the wip product**. For the general API layer rules (what belongs in the API layer, the product-switching mechanism, and how to add a new function across all products) see `src/api/AGENTS.md`.

---

## Transport tiers

```text
auth/tokenManager.ts         authenticatedFetch — token injection, 401 refresh
        ↓
api/wip/httpClients.ts       createHttpClient factory, named clients, retry helpers
api/wip/graphql.ts           gql() helper — wraps the single GraphQL endpoint
        ↓
api/wip/<domain>.ts          Named service functions
```

---

## 403 handling

Two retry helpers are exported from `httpClients.ts`. Domain files use these instead of calling `authenticatedFetch` directly:

| Helper | When to use |
|--------|-------------|
| `withStsRetry(fn)` | Token is unscoped (no org UUID); STS configured. Refreshes token then retries once. |
| `withScopeRetry(fn)` | APIM scope validation error (code 900910). Refreshes token then retries once. |

`createHttpClient()` also accepts an `on403` callback for client-level custom handling.

---

## Known deviations from standard client usage

Only one domain file calls `authenticatedFetch` directly. All other 403 retry cases are handled via `withStsRetry`/`withScopeRetry`.

| File | Function | Reason |
|------|----------|--------|
| `copilot.ts` | `getAiCopilotAnswer` | Caller-provided URL, streaming `Response`, and custom per-request headers — incompatible with `createHttpClient` |

`graphql.ts` and `httpClients.ts` also call `authenticatedFetch` internally — those are transport-layer files, not domain files, so this is expected.

---

## Adding a new service function to wip

1. Add the function to the appropriate `src/api/wip/<domain>.ts` using the relevant named client from `httpClients.ts`.
2. Add a matching stub to `src/api/cloud/<domain>.ts` and `src/api/icp/<domain>.ts` — same function name, body throws `ni('<functionName>')`.
3. Write input and return types in `src/types/` — domain files must not define types that belong in the shared types layer.
4. If the endpoint can return 403 due to token scope, wrap with `withStsRetry` or `withScopeRetry`.
5. Do **not** write a `useQuery`/`useMutation` wrapper here — that goes in `src/hooks/`.

### If it is a new domain file

1. Create `src/api/wip/<domain>.ts` with the real implementation.
2. Create `src/api/cloud/<domain>.ts` and `src/api/icp/<domain>.ts` stubs (`ni()` pattern).
3. Hooks import via `'#api/<domain>'` — no additional wiring needed.

---

## GraphQL inline queries

Some mutations are built with string interpolation rather than variables (e.g. `createComponent`, `fetchReleaseMgtDeployments`). Always use the local `gqlStr()` / `esc()` helpers for user-supplied values to avoid injection. Never concatenate raw strings into a GraphQL query without escaping.
