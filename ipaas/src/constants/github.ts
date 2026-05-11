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

export const GITHUB_URL_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\s*$/i;

export const GITHUB_AUTH = {
  POPUP_DIMENSIONS: 'width=800,height=600',
  POPUP_POLL_INTERVAL_MS: 500,
  BROADCAST_CHANNEL: 'EXTERNALOAUTH',
} as const;

export const SAMPLE_REPO_URL = 'https://github.com/wso2/integration-samples';
