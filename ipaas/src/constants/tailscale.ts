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

/** Tailscale proxy build/runtime constants, matching Devant. */
export const TAILSCALE_IMAGE = 'choreoanonymouspullable.azurecr.io/tailscale-proxy:1.2.0';
export const TAILSCALE_COMPONENT_SUBTYPE = 'tailscale';
export const TAILSCALE_COMPONENT_TYPE = 'byoiService';
/** Secret keys the proxy reads. */
export const TS_AUTH_KEY = 'TS_AUTH_KEY';
export const OAUTH_CLIENT_SECRET = 'OAUTH_CLIENT_SECRET';
