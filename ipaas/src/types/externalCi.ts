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
 * External CI lets an external build/CI pipeline deploy images to a BYOI component
 * via a webhook authenticated with a long-lived token. Wire shapes mirror Devant's
 * devops `/ci/component/{id}/tokens` API.
 */

/** A long-lived External CI token. `last_used` is the `0001-01-01…` sentinel when never used. */
export interface ExternalCiToken {
  id: string;
  name: string;
  created_at: string;
  last_used: string;
  last_updated?: string;
  component_id?: string;
  project_id?: string;
}
