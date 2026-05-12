# API Layer

> [!IMPORTANT]
> This directory contains all backend communication logic. The layer is structured in three tiers:

```text
authenticatedFetch          (auth/tokenManager.ts)
        ↓
createHttpClient / gql()    (http.ts / graphql.ts)
        ↓
Named service clients       (http.ts exports)
        ↓
Domain files                (alerts.ts, builds.ts, queries.ts, …)
```

---

## Tier 1 — Auth transport

`authenticatedFetch` in `auth/tokenManager.ts` is the single point responsible for injecting access tokens, detecting expiry, refreshing, and retrying on 401. **Domain files must not call `authenticatedFetch` directly** except in the documented special cases below.

---

## Tier 2 — Protocol wrappers

| File | Protocol | Endpoint |
|------|----------|----------|
| `graphql.ts` | GraphQL | `window.API_CONFIG.graphqlUrl` |
| `http.ts` | REST/JSON | configurable per client |

`createHttpClient(getBaseUrl)` is the REST factory. It handles JSON serialisation, `Content-Type` headers, error throwing on non-2xx, and response parsing. The optional third parameter on `post/put/delete` accepts custom headers (e.g. `application/x-www-form-urlencoded`).

---

## Tier 3 — Named service clients

All defined in `http.ts`. Import the relevant client in domain files — never construct base URLs manually.

| Client | Backend service | Base URL source |
|--------|----------------|-----------------|
| `devopsClient` | Choreo DevOps API | `choreoDevopsApiUrl()` |
| `orgClient` | Choreo Org API | `choreoOrgApiUrl` |
| `authClient` | Auth service | `authBaseUrl` |
| `systemClient` | System APIs (logs, obs) | `systemApisBaseUrl` |
| `apimClient` | APIM Publisher | derived from `choreoOrgApiUrl` |
| `obsClient` | Observability | `observabilityUrl` |
| `platformClient` | Platform APIs (component-mgt, config-svc, config-mapping-svc, configuration-schema, config-mgt, proxy/deployer) | origin of `choreoOrgApiUrl` |
| `subscriptionsClient` | Subscriptions service | `subscriptionsApiUrl()` |
| `insightsClient` | Choreo Insights | derived from `choreoOrgApiUrl` |
| `governanceClient` | Governance service | derived from `choreoOrgApiUrl` |
| `copilotDatacollectorClient` | AI Copilot data collector | `aiCopilotDatacollectorBaseUrl` |

---

## Known deviations

These are the only places where `authenticatedFetch` is used directly in domain files. Each has a one-line comment at the call site explaining why.

| Location | Reason |
|----------|--------|
| `queries.ts` — `useRepoContents` | 403 triggers STS token scope refresh + retry; requires manual `Response` inspection |
| `mutations.ts` — `runPod` | 403 requires JSON body parsing to detect scope error before deciding to retry |
| `copilot.ts` — `getAiCopilotAnswer` | Caller-provided URL, streaming `Response`, and custom per-request headers |

> [!NOTE]
> `alerts.ts` and `logs.ts` use `createHttpClient(() => baseUrl)` per call because the base URL is passed as a runtime parameter by callers. A static `alertingClient` is planned for the component-level refactor phase.
