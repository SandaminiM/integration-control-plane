# Product-specific UI variants

Contains only the components and pages that differ meaningfully between products.
Everything else lives in `src/components/` and `src/pages/` as usual.

## Structure

```
src/product/
  devant/          # Devant (Choreo v2) variants
  cloud/           # Cloud (Choreo v3) variants
  icp/             # ICP (local) variants
```

## Aliases

| Alias        | Resolves to (build time)    | TS path mapping          |
|--------------|-----------------------------|--------------------------|
| `#api/*`     | `src/api/<product>/*`       | → `src/api/devant/*`     |
| `#product/*` | `src/product/<product>/*`   | → `src/product/devant/*` |

## When to use `#product`

| Situation | Approach |
|---|---|
| 1-2 element toggle | `IS_ICP` / `IS_DEVANT` inline |
| Many toggles following a pattern | `productConfig` in `src/product-config.ts` |
| Whole component/page differs | `#product/ComponentName` |
| Page only exists in one product | stays in `src/pages/`, gated in `routes.tsx` |

## How to add a product variant

1. Extract the shared shell into `src/components/<ComponentName>/<ComponentName>Shell.tsx`

2. Create a variant in each product folder:
   ```tsx
   // src/product/icp/EnvironmentCardBody.tsx
   import EnvironmentCardShell from '../../components/EnvironmentCard/EnvironmentCardShell';

   export default function EnvironmentCardBody(props: Props) {
     return <EnvironmentCardShell {...props}>/* icp content */</EnvironmentCardShell>;
   }
   ```

3. Update the consumer to use the alias:
   ```tsx
   // src/components/EnvironmentCard/index.tsx
   import EnvironmentCardBody from '#product/EnvironmentCardBody';
   ```

## Rules

- Shared shells live in `src/components/` next to their parent — NOT in this folder
- Product files import the shared shell; the shell never imports product files
- Keep files flat inside each product folder; add subfolders only when the list grows large
