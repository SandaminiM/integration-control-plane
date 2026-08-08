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

/**
 * API security & exposure domain, mirroring the ipaas-service BFF surface
 * ("Integration Platform - API Security & Exposure").
 *
 * Two orthogonal concerns live here:
 *
 *  1. **The exposed API** — a deployed endpoint registered as a managed REST
 *     API on the WSO2 API Platform gateway, plus its enforcement policies
 *     (`api-key-auth`, `jwt-auth`, `subscription-validation`) and its API keys.
 *     Everything in this group is addressed by the
 *     component / environment / endpoint triple ({@link EndpointRef}).
 *
 *  2. **Consumers** — a consumer *application* (org-scoped, created against a
 *     project) subscribed to an exposed API. The subscription carries an opaque
 *     token the consumer sends as the `Subscription-Key` header.
 *
 * The surface is cloud-only today; `wip`/`icp` stub it.
 */

/** Identifies one deployed endpoint — the path triple every security call takes. */
export interface EndpointRef {
  componentName: string;
  environmentName: string;
  endpointName: string;
}

/** One selectable endpoint in the security drawer's endpoint picker. */
export interface EndpointOption {
  /** Endpoint name — the BFF's `endpointName` path segment. */
  name: string;
  displayName: string;
}

/** A service endpoint exposed as a managed API on the API Platform gateway. */
export interface ApiExposure {
  /** The API Platform REST API handle — also the subscription's `restApiId`. */
  handle: string;
  /** Gateway context path. */
  context?: string;
  /** Handle of the gateway the API is deployed to. */
  gatewayId?: string;
  /** Deployment status on the gateway, e.g. `DEPLOYED`. */
  status?: string;
  /** Public URL of the exposed API, when resolvable. */
  publicUrl?: string;
}

/** A masked API key of an exposed endpoint API. */
export interface ApiKeySummary {
  /** Key name — the identifier used to revoke it. */
  name: string;
  displayName?: string;
  /** Masked form, e.g. `***abcde`. The plaintext is never retrievable. */
  maskedApiKey: string;
  status: string;
  expiresAt?: string;
}

/** Result of minting a key. `apiKey` is the plaintext, returned only here. */
export interface ApiKeyResult {
  keyId: string;
  displayName?: string;
  /** Plaintext API key — shown once, not retrievable later. */
  apiKey: string;
}

/** Payload for creating an API key on an exposed endpoint API. */
export interface CreateApiKeyInput {
  displayName?: string;
  /** ISO date-time. Omitted means the gateway default (no expiry). */
  expiresAt?: string;
}

/** Options for the `api-key-auth` gateway policy. */
export interface ApiKeyAuthOptions {
  /** Header/query param carrying the key. Defaults to `X-API-Key`. */
  key?: string;
  /** Where the key is read from. Defaults to `header`. */
  in?: string;
}

/**
 * The single active auth mode of an exposed API. The gateway ANDs auth policies with no
 * fallback, so exactly one mode is active at a time (they are mutually exclusive):
 *  - `none`    — open, no auth.
 *  - `api-key` — api-key-auth (the default for a newly exposed endpoint).
 *  - `jwt`     — jwt-auth (OAuth2 bearer, validated against the org key manager).
 */
export type SecurityMode = 'none' | 'api-key' | 'jwt';

/** The active security configuration of an exposed endpoint API (GET/PUT `.../security`). */
export interface SecurityConfig {
  mode: SecurityMode;
  apiKey?: {
    /** Request header carrying the key (default `X-API-Key`). */
    header?: string;
  };
  jwt?: {
    /** Gateway key-manager names to trust; empty defaults to the org key manager. */
    issuers?: string[];
    audiences?: string[];
  };
  /**
   * The exposed API's invoke URL on the API Platform gateway (the enforcing endpoint to call),
   * distinct from the component's open raw route. Read-only: populated on GET, ignored on PUT.
   */
  publicUrl?: string;
}

/** A consumer application. Org-scoped and shared across the org. */
export interface ConsumerApplication {
  id: string;
  displayName?: string;
  projectId?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload for creating a consumer application. */
export interface CreateApplicationInput {
  displayName: string;
  /** Project handle the application belongs to. */
  projectName: string;
  description?: string;
}

/** An application's subscription to an exposed API. */
export interface Subscription {
  id: string;
  applicationId: string;
  /** Handle of the exposed API this subscription grants access to. */
  restApiId: string;
  /**
   * Opaque subscription token, sent as the `Subscription-Key` header. Returned
   * on create and on a single-subscription GET — not on the list endpoint.
   */
  token?: string;
  status?: string;
  createdAt?: string;
}

/**
 * View model for the Consumers panel: an application paired with its
 * subscription to the API currently in view.
 */
export interface Consumer {
  application: ConsumerApplication;
  subscription: Subscription;
}

/** Payload for creating a consumer application and subscribing it in one step. */
export interface CreateConsumerInput extends EndpointRef {
  /** Project handle the new application belongs to. */
  projectName: string;
  /** Display name of the consumer application. */
  appName: string;
  description?: string;
}
