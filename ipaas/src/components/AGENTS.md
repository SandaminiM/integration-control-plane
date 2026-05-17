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

## Adding a component

1. Create the file under the appropriate subdirectory (or directly in `components/` for single-file components).
2. Import data via hooks only.
3. Keep server state out of local `useState` — derive it from the hook's return value instead.
