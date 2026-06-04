# src/types/ — Type Contracts

## Purpose

Shared TypeScript types that define the contract between the `api/` and `hooks/` layers, and between `hooks/` and the UI layer. Any layer may import from here; this directory imports from nothing.

---

## What belongs here

- Request input types (`CreateComponentInput`, `DeployDeploymentTrackInput`, …)
- Response/domain model types (`Component`, `Build`, `Environment`, …)
- Enums and union types used across layers

## What does not belong here

- Runtime logic, functions, or constants
- React-specific types (keep those in the component that owns them)
- Types so narrow they are only ever used in one function (keep those inline)
- **Raw wire shapes** — protocol-specific request/response envelopes (snake_case payloads, GraphQL response wrappers, REST DTOs). These stay private inside each product's `src/api/<product>/<domain>.ts` file.

---

## Domain shape, not wire shape

Types in this directory describe the **domain** (what a Component / Environment / Project *is*), not how any particular backend protocol happens to serialize them. The exported names have no `Gql`, `Rest`, `Raw`, or product prefix.

When `src/api/wip/` calls GraphQL and the response already matches the domain shape, the function returns the domain type directly. When `src/api/cloud/` (future) calls REST and the response uses different field names, that file maps wire → domain *before* returning. The mapping convention is documented in `src/api/AGENTS.md`.

This means types here are stable: a contributor adding a cloud REST adapter does not change anything in `src/types/`. They add private raw types and a mapper inside `src/api/cloud/<domain>.ts`.

---

## Rule

If a type is referenced in more than one layer (e.g. defined in `api/` and consumed in a `hooks/` file or a component), it belongs in `src/types/`. Never define a shared type inside an `api/` or `hooks/` file.

Raw wire types are the exception — they're product-internal and stay in the product's API file (see `src/api/AGENTS.md`).

---

## Product considerations

Types are shared across all three products (wip, cloud, icp). Do not create product-specific type files. If a type is only needed by one product's API implementation, it can stay inline in `src/api/<product>/<domain>.ts`, but if it is consumed by a hook, a component, or `src/api/contracts.ts`, move it here.

---

## Types referenced by `contracts.ts`

`src/api/contracts.ts` only imports from this directory. If you add a type that participates in an API function signature, it **must** live here — otherwise the contract cannot reference it consistently across all three products.
