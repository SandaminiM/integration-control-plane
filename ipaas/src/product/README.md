# Product-specific UI variants

Contains only the components and pages that differ **meaningfully** between products.
Everything else lives in `src/components/` and `src/pages/` as usual.

---

## Structure

```
src/product/
  devant/          # Devant (Choreo v2) variants
  cloud/           # Cloud (Choreo v3) variants  ← currently empty; cloud shares devant UI
  icp/             # ICP (local) variants
```

---

## Aliases

| Alias        | Resolves to (build time)    | TS path mapping          |
|--------------|-----------------------------|--------------------------:|
| `#api/*`     | `src/api/<product>/*`       | → `src/api/devant/*`     |
| `#product/*` | `src/product/<product>/*`   | → `src/product/devant/*` |

Vite replaces these at build time. Only the selected product's files enter the bundle — the other two products are eliminated by Rollup dead code elimination (DCE).

---

## Decision table — when to use `#product`

| Situation | Approach |
|-----------|----------|
| 1–2 element toggle (e.g. hide a button) | `IS_ICP` / `IS_WIP` inline in the shared component |
| Many toggles following a consistent pattern | `productConfig` in `src/product-config.ts` |
| Whole component renders completely differently | `#product/ComponentName` alias |
| Page only exists in one product | stays in `src/pages/`, route gated in `src/config/routes.tsx` |

When in doubt, start with an inline `IS_ICP` flag. Only extract to `#product` when the component becomes hard to read or the diff grows large.

---

## Cloud vs devant

Cloud and devant have the **same UI**. The only difference is in `src/api/cloud/` vs `src/api/devant/`. You should rarely (if ever) need to add a file to `src/product/cloud/`.

---

## How to add a product variant

1. **Extract the shared shell** into `src/components/<ComponentName>/<ComponentName>Shell.tsx`.

2. **Create a variant** in each product folder that needs it:

   ```tsx
   // src/product/icp/EnvironmentCardBody.tsx
   import EnvironmentCardShell from '../../components/EnvironmentCard/EnvironmentCardShell';

   export default function EnvironmentCardBody(props: Props) {
     return <EnvironmentCardShell {...props}>/* icp-specific content */</EnvironmentCardShell>;
   }
   ```

   ```tsx
   // src/product/devant/EnvironmentCardBody.tsx
   import EnvironmentCardShell from '../../components/EnvironmentCard/EnvironmentCardShell';

   export default function EnvironmentCardBody(props: Props) {
     return <EnvironmentCardShell {...props}>/* devant-specific content */</EnvironmentCardShell>;
   }
   ```

3. **Update the consumer** to use the alias:

   ```tsx
   // src/components/EnvironmentCard/index.tsx
   import EnvironmentCardBody from '#product/EnvironmentCardBody';
   ```

---

## Rules

- **Shared shells live in `src/components/`** next to their parent — NOT in this folder.
- **Product files import the shell; the shell never imports product files.** Reversing this would pull all variants into every bundle and defeat DCE.
- **Keep files flat** inside each product folder; add subfolders only when the list grows large.
- **Never import from `src/product/<product>/` directly** in shared code. Always use the `#product` alias so the correct product is selected at build time.
