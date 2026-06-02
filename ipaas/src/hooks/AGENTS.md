# src/hooks/ — React Query Layer

## Purpose

React Query wrappers around `src/api/` service functions. This is the only layer that components and pages may use to access server state.

One file per domain. Each file exports named `useQuery`/`useMutation` hooks — nothing else.

---

## What belongs here

- `useQuery` wrappers with stable `queryKey` arrays
- `useMutation` wrappers with `onSuccess` cache invalidation
- `useQueryClient` for manual cache operations
- Consumer-level projections of already-normalized domain data — filtering a list, computing a count, sorting, picking a single record by id (see "Hooks do NOT normalize types" below)
- Polling via `refetchInterval`
- Lazy imperative fetch via `queryClient.fetchQuery()` (for event-driven flows like OIDC callbacks)

## What does not belong here

- JSX or UI logic
- Navigation (`useNavigate`) — that goes in the component
- Raw `fetch` / `authenticatedFetch` calls — those go in `src/api/`
- Type definitions — those go in `src/types/`
- **Wire-shape → domain-shape normalization** (see next section)

---

## Hooks do NOT normalize types

The hooks layer is **shared across all three products** (`wip`, `cloud`, `icp`). If hooks did wire-shape normalization, they would have to know which product's protocol they were dealing with — defeating the entire one-hook-for-all-products goal.

**Normalization lives in the API layer**, inside each product's domain file. By the time data reaches a hook, it is already shaped as a `src/types/*` domain type — regardless of whether `wip/` got it from GraphQL or `cloud/` got it from REST. See `src/api/AGENTS.md` for the mapping convention.

### What IS allowed in hooks (consumer-level projections)

```ts
// Projecting domain data — fine
const sortedImages = images.sort((a, b) => new Date(b.builtAt).getTime() - new Date(a.builtAt).getTime());

// Polling logic — fine
refetchInterval: isInProgress ? 5000 : false;

// Picking out a subset via TanStack's `select` — fine
useQuery({ queryKey: [...], queryFn: ..., select: (components) => components.filter(c => c.isPrebuilt) });
```

### What is NOT allowed in hooks

```ts
// ❌ Reshaping wire fields to domain fields — must happen in api/
const normalized = raw.map(r => ({ id: r.component_id, displayName: r.display_name }));

// ❌ Branching on the protocol — couples hooks to a product
if (response.__typename === 'GqlEnvironment') { ... }
```

If you find yourself wanting to do either of these in a hook, the work belongs one layer down in `src/api/<product>/<domain>.ts`.

---

## Query key conventions

Query keys are arrays. Keep them consistent so cache invalidation works correctly:

```typescript
// Resource list
queryKey: ['builds', componentId]

// Single resource
queryKey: ['build-logs', componentId, versionId, workflowName]

// Scoped to org
queryKey: ['projects', orgNumericId]
```

Invalidate on mutation success using the same key structure:
```typescript
onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builds', componentId] })
```

---

## Polling pattern

Use `refetchInterval` on `useQuery` — never `setInterval` in a component:

```typescript
useQuery({
  queryKey: ['build-logs', componentId, versionId],
  queryFn: () => fetchBuildLogs(...),
  refetchInterval: isInProgress ? 5000 : false,
});
```

---

## Lazy imperative fetch pattern

For one-shot fetches inside async event handlers (e.g. OIDC callbacks, form submissions) that run outside the render cycle:

```typescript
export function useFetchProjectsByOrgId() {
  const queryClient = useQueryClient();
  return useCallback(
    (orgNumericId: number) =>
      queryClient.fetchQuery({
        queryKey: ['projects', orgNumericId],
        queryFn: () => fetchProjectsByOrgId(orgNumericId),
      }),
    [queryClient],
  );
}
```

---

## Product considerations

Hooks are shared across all products — there are no product-specific hook files. The product branching happens at the `src/api/<product>/` layer below, which is transparent to hooks.

If a hook calls an API function that only has a real implementation in one product (e.g. wip), the hook still works for all products at the type level — but the cloud/icp stubs throw at runtime. The product-specific gate should be in the UI that decides whether to call the hook at all (`IS_WIP && ...`).

---

## Adding a new hook

1. Locate or create the domain file matching the `src/api/` file (e.g. `useBuilds.ts` for `builds.ts`).
2. Import the service function via the `#api` alias (e.g. `import { fetchBuilds } from '#api/builds'`) — never from `src/api/wip/`, `cloud/`, or `icp/` directly.
3. Wrap with `useQuery` or `useMutation`; assign a stable `queryKey`.
4. Export the hook — do not export the raw service function from here.
