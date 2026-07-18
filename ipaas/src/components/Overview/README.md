# Overview surface — per-integration-type rendering

The Overview page (`pages/Component.tsx`) renders an env-card UI that varies by
**integration type** (automation, integration-as-api, file-integration, …). It uses
the **surface + slots** pattern. This README maps _this_ directory; the rules and
the "how to add a type" steps live in `src/components/AGENTS.md`
("Per-integration-type rendering").

## Structure

```text
Overview/
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
│   ├── EndpointUrlsPanel.tsx    Endpoint selector + visibility URLs + Download Spec
│   │                            (shared by integration-as-api + ai-agent bodies)
│   ├── StatusDot.tsx            presentational status dot (composed by a type)
│   ├── ConfigureButton.tsx      presentational Configure button — flips to
│   │                            "Configure to Continue" when required configs are unset
│   ├── configStatus.ts          hasMissingRequiredConfigs() — shared by automation,
│   │                            file/event, ai-agent (drives the button + Run/Schedule)
│   ├── FileEventHeader.tsx      shared CustomHeader for file- + event-integration
│   │                            (status dot + Configure + Stop/Start; logs are in the body)
│   ├── HeaderShell.tsx          integration-level header rendered above the cards
│   ├── UnsupportedFallback.tsx  module for not-yet-migrated types (CustomOverview)
│   ├── UnsupportedOverview.tsx
│   └── bodies/                  bodies shared by >1 type
│       ├── FileEventBody.tsx    runtime-log stream (file- + event-integration)
│       └── OperationTile.tsx / OperationHeader.tsx
│                                operation/tool tile + drawer header
│                                (integration-as-api swagger ops + mcp-server tools)
├── automation/                  one folder per type → exports an IntegrationModule
│   ├── index.ts                 { ...INTEGRATION_TYPE_INFO['automation'], …slots }
│   ├── HeaderStatus.tsx         Configure + missing-config state (no status dot)
│   ├── EnvCardActions.tsx       Schedule / Run / next-run + cron auto-fire
│   ├── EnvCardBody.tsx          executions table + schedule banner + insights
│   └── … (RunButton, ScheduleButton, dialogs, insights, configStatus)
├── integration-as-api/          status dot + Configure / Test·Logs·Stop·Start /
│   │                            endpoint URLs + swagger + service insights
│   ├── HeaderStatus.tsx  EnvCardActions.tsx  EnvCardBody.tsx  (EndpointUrlsPanel is in _shared/)
│   └── ServiceInsights / ServiceLogsDrawer / SwaggerOperationsList
├── file-integration/            index.ts → shared FileEventHeader + FileEventBody
├── event-integration/           index.ts → shared FileEventHeader + FileEventBody
├── ai-agent/                    status dot + Configure(hideEndpoints) / Test·Logs·Stop·Start;
│   │                            body is an inline chat against the deployed agent
│   ├── HeaderStatus.tsx         status dot + Configure / Configure-to-Continue
│   ├── EnvCardActions.tsx       Test (→ test/agent-chat) · View Logs · Stop/Start
│   └── EnvCardBody.tsx          shared EndpointUrlsPanel (non-critical) + <AgentChat>
├── mcp-server/                  MCP Server + MCP Proxy (registry maps both here):
│   │                            tools list via the MCP SDK + Configure Policies action
│   ├── HeaderStatus.tsx  EnvCardActions.tsx  EnvCardBody.tsx  OverviewHeaderActions.tsx
│   └── McpToolTile.tsx / McpToolDrawer.tsx  (reuse _shared/bodies/OperationTile + OperationHeader)
└── registry.ts                  IntegrationType → () => import('./<type>')  (one chunk per type)
```

> **Cross-surface note:** the chat itself lives at **`src/components/AgentChat.tsx`** (top
> level, _not_ under `overview/`) because two surfaces consume it: the ai-agent
> `EnvCardBody` here and the Test page (`pages/AgentChatConsole.tsx`, route
> `test/agent-chat`). Its message/connection types are in `src/types/agentChat.ts`.

## The model in one line

`EnvCardShell` (frame + shared state) renders each type's **slots**:
`CustomHeader` **or** (`HeaderStatus` + `EnvCardActions`), then `EnvCardBody`, then an
optional `EnvCardFooter`. A type with no env-card concept (e.g. Tailscale) exports
`CustomOverview` and bypasses the shell entirely.

| Slot             | Who provides it               | Example                                                  |
| ---------------- | ----------------------------- | -------------------------------------------------------- |
| `EnvCardBody`    | every rendered type           | executions table / endpoints / runtime logs / agent chat |
| `HeaderStatus`   | types with a status/Configure | service / ai-agent status dot + Configure                |
| `EnvCardActions` | types with header actions     | Run/Schedule, Stop/Test/Logs                             |
| `CustomHeader`   | header outliers               | file- + event-integration (shared `FileEventHeader`)     |
| `EnvCardFooter`  | optional                      | — none today                                             |
| `CustomOverview` | full-surface outliers         | Tailscale                                                |

`ai-agent` uses the generic-frame slots (`HeaderStatus` + `EnvCardActions` + `EnvCardBody`)
like integration-as-api — it's a generic service under the hood (`componentSubType: aiAgent`),
so it Tests (→ `test/agent-chat`), shows logs, and Stop/Starts. File/event use a `CustomHeader`
instead and have **no** Test/View-Logs buttons (their body _is_ the log stream).

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
