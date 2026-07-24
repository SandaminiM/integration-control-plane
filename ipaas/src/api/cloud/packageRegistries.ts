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
 * Ballerina Central access token API. Calls the ipaas-service BFF.
 *
 * Cloud-exclusive surface — org-scoped via the caller's JWT, never a client
 * param (see src/hooks/useBallerinaCentralToken.ts, loaded the same way as
 * billing: dynamic import, no #api alias, no contracts.ts entry, since
 * wip/icp have no Ballerina Central backend and carry no contract).
 */

import { bff } from './_client';
import type { BallerinaCentralTokenStatus } from '../../types/packageRegistries';

const TOKEN_PATH = '/ballerina-central/token';

export const fetchBallerinaCentralToken = (): Promise<BallerinaCentralTokenStatus> => bff.get<BallerinaCentralTokenStatus>(TOKEN_PATH);

/** Verifies against Ballerina Central before saving; rotates the existing secret on repeat saves. */
export const saveBallerinaCentralToken = (token: string): Promise<BallerinaCentralTokenStatus> => bff.put<BallerinaCentralTokenStatus>(TOKEN_PATH, { token });

/** Idempotent — safe to call even if nothing's configured. */
export const removeBallerinaCentralToken = (): Promise<void> => bff.delete<void>(TOKEN_PATH);
