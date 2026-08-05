/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/** Static copy and defaults for the cloud API consumption + security surface. */

/** Header a consumer sends its subscription token in. */
export const SUBSCRIPTION_KEY_HEADER = 'Subscription-Key';

/**
 * Header the `api-key-auth` policy reads the key from. `X-API-Key` is the
 * gateway default (`SetAPIKeyAuthRequest.key`) and the header the spec's
 * test-key flow tells consumers to send.
 */
export const DEFAULT_API_KEY_HEADER = 'X-API-Key';

/** Header OAuth would use once the jwt-auth policy is wired up. */
export const OAUTH_HEADER = 'Authorization';

/** Stand-in shown wherever a subscription token is hidden. */
export const TOKEN_MASK = '•'.repeat(28);

export const COMING_SOON_OAUTH = 'Securing with OAuth coming soon';
export const COMING_SOON_UPSTREAM_ATTRS = 'Passing end-user attributes to upstream coming soon';

export const API_KEY_SCHEME_DESCRIPTION = 'Secure your API with API Key protocol.';
export const OAUTH_SCHEME_DESCRIPTION = 'Secure your API with OAuth 2 protocol.';

export const REGENERATE_SUBSCRIPTION_WARNING = 'The subscription is revoked and re-created, so the current Subscription-Key stops working immediately. Any consumer using it must switch to the new value.';
export const UNSUBSCRIBE_WARNING = 'This revokes the subscription and its token. Calls using it will fail once subscription validation is enforced. The application itself is kept and can be subscribed again.';
