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
import { getAlertRules } from '#api/alerts';
```

TypeScript always type-checks against `wip/` (via `tsconfig.app.json` paths) so the IDE is always correct regardless of which product is being built.

---

## Mapping responsibility (raw wire shape → domain type)

**This is where normalization lives.** Each product's API file is the _only_ place that knows the wire protocol (GraphQL, REST shape, snake_case, etc.). Domain functions return types from `src/types/*` — never raw protocol shapes.

When `wip/` calls GraphQL and the response already matches the domain shape, no mapping is needed — the function passes through. When `cloud/` calls REST and the response uses different field names (e.g. snake_case, nested envelopes), the function maps explicitly before returning.

### Canonical pattern

```ts
// src/api/cloud/components.ts (hypothetical future REST impl)

import { choreoClient } from './httpClients';
import type { Component } from '../../types/component';

// Raw wire shape — private to this file, never exported, never in src/types/
interface RawCloudComponent {
  component_id: string;
  display_name: string;
  component_type: string;
  // ...
}

// Mapper — private to this file
function toComponent(raw: RawCloudComponent): Component {
  return {
    id: raw.component_id,
    displayName: raw.display_name,
    displayType: raw.component_type,
    // ...
  };
}

export async function fetchComponents(orgHandler: string, projectId: string): Promise<Component[]> {
  const raw = await choreoClient.get<{ items: RawCloudComponent[] }>(`/components?org=${orgHandler}&project=${projectId}`);
  return raw.items.map(toComponent);
}
```

### Three rules

1. **Raw types stay private to the product file** — never `export`, never in `src/types/`. They describe a wire shape, which is a product concern.
2. **Mappers stay private to the product file** — named `toDomain(raw)` for response mapping, `fromInput(input)` only if the input also needs shape conversion in the other direction.
3. **The exported function signature uses domain types only** — that's the contract the hooks layer (and `contracts.ts`) relies on.

If a domain happens to have a pass-through shape (the wire response equals the domain shape, as is common in current `wip/` files), no mapper is needed — just declare the return type and return directly.

---

## API contracts (`contracts.ts` + per-product `_check.ts`)

`src/api/contracts.ts` is the single source of truth for the function signatures each product must implement. It groups signatures into one interface per domain (`ComponentsApi`, `DeploymentsApi`, …) and an aggregate `AppApi`.

Each product directory has a `_check.ts` file that performs a compile-time assertion:

```ts
import type * as Contracts from '../contracts';
import * as components from './components';

const _components: Contracts.ComponentsApi = components;
void _components;
```

The file is never imported at runtime. It exists so that `tsc` errors the moment any product's exported function signature drifts from the contract.

**When you add or change a contract:**

1. Update the interface in `src/api/contracts.ts`.
2. Update **all three** product implementations (`wip/`, `cloud/`, `icp/`) so the new/changed signature is satisfied.
3. If a new domain interface is added, also add a corresponding `import * as <domain> from './<domain>'` + `const _<domain>: Contracts.<DomainApi> = <domain>` line to each `_check.ts`.
4. Parameter and return types in contracts must come from `src/types/*` — never from a product subdirectory.

---

## Adding a new service function

1. Write input and return types in `src/types/<domain>.ts` — never inline in the domain files.
2. Add the real implementation to `src/api/wip/<domain>.ts`.
3. Add a matching stub to `src/api/cloud/<domain>.ts` and `src/api/icp/<domain>.ts` — same function name, body throws `ni('<functionName>')`.
4. Update the relevant interface in `src/api/contracts.ts` to include the new signature. The next `tsc` run will verify all three products satisfy it via their `_check.ts`.
5. In the hook, import via `'#api/<domain>'` — no other wiring needed.
6. Do **not** write a `useQuery`/`useMutation` wrapper inside `src/api/` — that goes in `src/hooks/`.

### If it is a new domain file

1. Create `src/api/wip/<domain>.ts` with the real implementation.
2. Create `src/api/cloud/<domain>.ts` and `src/api/icp/<domain>.ts` stubs.
3. Add a new domain interface (e.g. `MyDomainApi`) to `src/api/contracts.ts` and a new entry in the aggregate `AppApi`.
4. In each of `wip/_check.ts`, `cloud/_check.ts`, `icp/_check.ts`, add a matching `import * as myDomain from './myDomain'` plus a `const _myDomain: Contracts.MyDomainApi = myDomain` line.
5. Hooks import via `'#api/<domain>'` — the alias picks up the new file automatically.

---

## Checking whether a feature is product-specific

If a backend endpoint only makes sense for one product, implement it only in that product's subdirectory. The stubs in the other products can throw. The route or UI that calls it must be gated with `IS_WIP` / `IS_CLOUD` / `IS_ICP` from `src/features.ts` so dead code is eliminated at build time.

---

## Implementation details per product

For transport infrastructure, retry helpers, GraphQL usage, and known deviations see the `AGENTS.md` inside each product subdirectory:

- `src/api/wip/AGENTS.md` — wip implementation notes
