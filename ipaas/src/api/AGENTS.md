# src/api/ — Service Layer

## Purpose

Pure async service functions that talk to backend APIs. No React, no hooks, no JSX.

A component or page that needs data **must not** import from this directory directly. Use the corresponding hook in `src/hooks/` instead.

---

## What belongs here

- Named async functions (`fetchBuilds`, `createComponent`, `updateApimApi`, …)
- Product-specific transport infrastructure (HTTP clients, GraphQL wrappers) — inside each product subdirectory
- Request/response type adapters and domain mappers — inside each product subdirectory

## What does not belong here

- `useQuery`, `useMutation`, `useQueryClient` — those go in `src/hooks/`
- React state, effects, or context
- Navigation logic
- Shared UI types — those go in `src/types/`

---

## Product-switching mechanism

The API layer is split by product. Vite resolves the `#api` alias to `src/api/${PRODUCT}/` at build time, so only one product's code enters the bundle.

```text
src/api/
  wip/     ← real implementations (Choreo v2 / wip)
  cloud/   ← stubs, throw "[cloud] domain.fn: not implemented"
  icp/     ← stubs, throw "[icp] domain.fn: not implemented"
```

Hooks import all API functions through the alias:

```ts
import { fetchComponents } from '#api/components';
import { getAlertRules }   from '#api/alerts';
```

TypeScript always type-checks against `wip/` (via `tsconfig.app.json` paths) so the IDE is always correct regardless of which product is being built.

---

## Adding a new service function

1. Add the real implementation to `src/api/wip/<domain>.ts`.
2. Add a matching stub to `src/api/cloud/<domain>.ts` and `src/api/icp/<domain>.ts` — same function name, body throws `ni('<functionName>')`.
3. Write input and return types in `src/types/` — not inside the domain files.
4. In the hook, import via `'#api/<domain>'` — no other wiring needed.
5. Do **not** write a `useQuery`/`useMutation` wrapper inside `src/api/` — that goes in `src/hooks/`.

### If it is a new domain file

1. Create `src/api/wip/<domain>.ts` with the real implementation.
2. Create `src/api/cloud/<domain>.ts` and `src/api/icp/<domain>.ts` stubs.
3. Hooks import via `'#api/<domain>'` — the alias picks up the new file automatically.

---

## Checking whether a feature is product-specific

If a backend endpoint only makes sense for one product, implement it only in that product's subdirectory. The stubs in the other products can throw. The route or UI that calls it must be gated with `IS_WIP` / `IS_CLOUD` / `IS_ICP` from `src/features.ts` so dead code is eliminated at build time.

---

## Implementation details per product

For transport infrastructure, retry helpers, GraphQL usage, and known deviations see the `AGENTS.md` inside each product subdirectory:

- `src/api/wip/AGENTS.md` — wip implementation notes
