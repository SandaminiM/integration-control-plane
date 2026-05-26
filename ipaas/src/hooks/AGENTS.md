# src/hooks/ — React Query Layer

## Purpose

React Query wrappers around `src/api/` service functions. This is the only layer that components and pages may use to access server state.

One file per domain. Each file exports named `useQuery`/`useMutation` hooks — nothing else.

---

## What belongs here

- `useQuery` wrappers with stable `queryKey` arrays
- `useMutation` wrappers with `onSuccess` cache invalidation
- `useQueryClient` for manual cache operations
- Derived/normalised state computed from raw API responses
- Polling via `refetchInterval`
- Lazy imperative fetch via `queryClient.fetchQuery()` (for event-driven flows like OIDC callbacks)

## What does not belong here

- JSX or UI logic
- Navigation (`useNavigate`) — that goes in the component
- Raw `fetch` / `authenticatedFetch` calls — those go in `src/api/`
- Type definitions — those go in `src/types/`

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

If a hook calls an API function that only has a real implementation in one product (e.g. devant), the hook still works for all products at the type level. The product-specific gate should be in the UI that decides whether to call the hook at all (`IS_DEVANT && ...`).

---

## Adding a new hook

1. Locate or create the domain file matching the `src/api/` file (e.g. `useBuilds.ts` for `builds.ts`).
2. Import the service function from `src/api/<domain>.ts` (the public stub, not from `src/api/devant/`).
3. Wrap with `useQuery` or `useMutation`; assign a stable `queryKey`.
4. Export the hook — do not export the raw service function from here.
