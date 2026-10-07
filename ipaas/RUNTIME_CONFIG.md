# Runtime configuration

The console reads `public/config.json` at startup (not baked into the bundle). Each environment deploys its own copy.

## Cloud sign-in (Thunder SDK)

The `cloud` build signs in with the Thunder SDK (`@thunderid/react`). Until it gets keys of its own it reads the existing ones:

| Key                             | Used as                                                                   |
| ------------------------------- | ------------------------------------------------------------------------- |
| `VITE_AUTH_BASE_URL`            | Thunder base URL; the SDK reads `<base>/.well-known/openid-configuration` |
| `ASGARDEO_CLIENT_ID`            | OAuth client ID (`IPAAS_CONSOLE`)                                         |
| `ASGARDEO_SCOPE`                | Requested scopes                                                          |
| `ASGARDEO_RESOURCE`             | `resource` on the authorize request only — never on the token request     |
| `ASGARDEO_SIGN_IN_REDIRECT_URL` | Redirect URI (`https://<console-host>/signin`)                            |

Sign-out returns to the page origin, the only post-logout URI the client registers. `ASGARDEO_AUTHORIZE_ENDPOINT`, `ASGARDEO_TOKEN_ENDPOINT` and the `STS_*` keys are not read by the cloud build — the SDK takes its endpoints from discovery.
