# src/components/ — UI Components

## Purpose

Reusable UI components. Pure presentation and interaction logic — no direct backend communication.

---

## Import rules

| Allowed | Not allowed |
|---|---|
| `src/hooks/*` | `src/api/*` |
| `src/types/*` | `src/auth/tokenManager` (data functions) |
| `src/constants/*` | `authenticatedFetch`, `getOrgUuidFromToken` |
| `src/utils/*` | Any named HTTP client |
| `src/assets/*` | |
| `src/contexts/*` | |
| `@wso2/oxygen-ui`, `@wso2/oxygen-ui-icons-react` | |
| React Router (`useNavigate`, `useParams`) | |

If you need data, call a hook. If the hook does not exist yet, create it in `src/hooks/` first.

---

## Org UUID

Use `useOrgUuid()` from `src/hooks/useOrgUuid.ts`. Never call `getOrgUuidFromToken()` directly.

---

## Product-specific variants

### Small toggles (1–2 elements)

Use the build-time flags from `src/features.ts`:

```tsx
import { IS_WIP, IS_ICP } from '../features';

// Renders only in the wip bundle; tree-shaken from cloud and icp
{IS_WIP && <CopilotButton />}
```

### Whole component differs per product — the shell pattern

When a component renders significantly differently across products, split it:

1. Keep the shared structural shell in `src/components/<ComponentName>/<ComponentName>Shell.tsx`.
2. Create a variant file per product in `src/product/<product>/<ComponentName>Body.tsx` that imports the shell.
3. The consumer imports via the `#product` alias:

```tsx
// src/components/EnvironmentCard/index.tsx
import EnvironmentCardBody from '#product/EnvironmentCardBody';
```

**Critical rule**: the shell must never import from `src/product/`. Product files import the shell — not the reverse. Reversing this would pull all product variants into every bundle, defeating dead code elimination.

Cloud and wip share the same UI. Only `src/product/icp/` is expected to accumulate variants over time.

See `src/product/README.md` for the full guide and decision table.

---

## Adding a component

1. Determine if the component is shared or product-specific (see product gating in `AGENTS.md` at the repo root).
2. If shared: create the file under the appropriate subdirectory (or directly in `components/`).
3. If product-specific as a whole: use the shell pattern above.
4. Import data via hooks only.
5. Keep server state out of local `useState` — derive it from the hook's return value instead.
