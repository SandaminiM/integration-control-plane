# Overview surface — per-integration-type rendering

The Overview page (`pages/Component.tsx`) renders an env-card UI that varies by
**integration type** (automation, integration-as-api, file-integration, …). It uses
the **surface + slots** pattern. This README maps *this* directory; the rules and
the "how to add a type" steps live in `src/components/AGENTS.md`
("Per-integration-type rendering").

## Structure

```text
overview/
├── _shared/                     generic frame + dispatch — NO type-specific logic
│   ├── OverviewShell.tsx        lays out env cards + PromoteButton between envs
│   ├── IntegrationRenderer.tsx  lazy-loads the type module from the registry;
│   │                            shows skeleton cards while the chunk loads
│   ├── EnvCardShell.tsx         the env-card FRAME. Owns ONLY shared state:
│   │                            deployment fetch + polling, notification,
│   │                            pending-trigger bridge, refresh. Renders the slots.
│   ├── EnvCardHeader.tsx        thin header frame: env name + commit + Refresh,
│   │                            with {status} (left) and {actions} (right) slots
│   ├── EnvCardSkeleton.tsx      common body loading skeleton
│   ├── StatusDot.tsx            presentational status dot (composed by a type)
│   ├── ConfigureButton.tsx      presentational Configure button (composed by a type)
│   ├── FileEventHeader.tsx      shared CustomHeader for file- + event-integration
│   │                           (status dot + Critical chip + Configure + Stop/Start)
│   ├── HeaderShell.tsx          integration-level header rendered above the cards
│   ├── UnsupportedFallback.tsx  module for not-yet-migrated types (CustomOverview)
│   ├── UnsupportedOverview.tsx
│   └── bodies/                  bodies shared by >1 type
│       └── FileEventBody.tsx    runtime-log stream (file- + event-integration)
├── automation/                  one folder per type → exports an IntegrationModule
│   ├── index.ts                 { ...INTEGRATION_TYPE_INFO['automation'], …slots }
│   ├── HeaderStatus.tsx         Configure + missing-config state (no status dot)
│   ├── EnvCardActions.tsx       Schedule / Run / next-run + cron auto-fire
│   ├── EnvCardBody.tsx          executions table + schedule banner + insights
│   └── … (RunButton, ScheduleButton, dialogs, insights, configStatus)
├── integration-as-api/          status dot + Configure / Test·Logs·Stop·Start /
│   │                            endpoint URLs + swagger + service insights
│   ├── HeaderStatus.tsx  EnvCardActions.tsx  EnvCardBody.tsx  EndpointUrlsPanel.tsx
│   └── ServiceInsights / ServiceLogsDrawer / SwaggerOperationsList
├── file-integration/            index.ts → shared FileEventHeader + FileEventBody
├── event-integration/           index.ts → shared FileEventHeader + FileEventBody
└── registry.ts                  IntegrationType → () => import('./<type>')  (one chunk per type)
```

## The model in one line

`EnvCardShell` (frame + shared state) renders each type's **slots**:
`CustomHeader` **or** (`HeaderStatus` + `EnvCardActions`), then `EnvCardBody`, then an
optional `EnvCardFooter`. A type with no env-card concept (e.g. Tailscale) exports
`CustomOverview` and bypasses the shell entirely.

| Slot | Who provides it | Example |
|---|---|---|
| `EnvCardBody` | every rendered type | executions table / endpoints / logs |
| `HeaderStatus` | types with a status/Configure | service status dot + Configure |
| `EnvCardActions` | types with header actions | Run/Schedule, Stop/Test/Logs |
| `CustomHeader` | header outliers | file- + event-integration (shared `FileEventHeader`) |
| `EnvCardFooter` | optional | — none today |
| `CustomOverview` | full-surface outliers | Tailscale |

The shell passes shared per-env data (deployment status, `releaseId`, build ids) and
cross-slot callbacks (`onNotify`, `onTrigger`, `requestPoll`) to every slot via
`EnvCardSlotProps`. Each slot fetches any **type-specific** data itself via domain
hooks (`useExecutions`, `useDeployments`, `useLogs`, …) — react-query de-dupes.

## Rules (short version)

- Type is resolved **once** by `identifyIntegration`; never re-derive it here. No
  `isAutomation` / `isGenericService` / `GENERIC_SERVICE_TYPES` under `overview/`.
- Type-specific code lives in the `<type>/` folder; truly shared chrome in `_shared/`.
  `_shared/` never imports a type folder.
- Shared bodies take **behaviour props**, not type flags.

To add a type, see `src/components/AGENTS.md`.
