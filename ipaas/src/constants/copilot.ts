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

export const COPILOT_SESSION_KEY = 'CHOREO_COPILOT_SESSION_ID';

export const COPILOT_DEFAULT_PERSPECTIVE = 'dev';

export const COPILOT_REGION_DISPLAY_NAMES: Record<string, string> = {
  'Choreo Cloud US Dataplane': 'US',
  'Choreo Cloud EU Dataplane': 'EU',
};

export const COPILOT_SESSION_MESSAGES_KEY = 'icp:copilot:messages';
export const COPILOT_SESSION_ERROR_IDS_KEY = 'icp:copilot:error-ids';

export const COPILOT_CONNECTION_ERROR = 'Copilot could not connect to the server. Please retry.';
export const COPILOT_CONNECTION_URL_ERROR = 'Copilot could not connect to the server. Please refresh.';
export const COPILOT_PROCESSING_ERROR = 'Copilot was unable to generate a response. Please retry.';
