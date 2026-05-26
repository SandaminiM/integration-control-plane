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

---

## Rule

If a type is referenced in more than one layer (e.g. defined in `api/` and consumed in a `hooks/` file or a component), it belongs in `src/types/`. Never define a shared type inside an `api/` or `hooks/` file.

---

## Product considerations

Types are shared across all three products (devant, cloud, icp). Do not create product-specific type files. If a type is only needed by one product's API implementation, it can stay inline in `src/api/<product>/<domain>.ts`, but if it is consumed by a hook or a component, move it here.
