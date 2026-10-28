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

/** Why a project with integrations cannot be deleted yet; the BFF refuses the delete until it is empty. */
export function projectDeleteBlockedMessage(integrations: number): string {
  return integrations === 1 ? 'This project still has 1 integration. Delete it before deleting the project.' : `This project still has ${integrations} integrations. Delete them before deleting the project.`;
}
