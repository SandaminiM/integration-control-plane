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

import { INTEGRATION_TYPE_INFO } from '../../../constants/integrationTypes';
import type { IntegrationModule } from '../../../types/integration';
import EnvCardBody from '../_shared/bodies/RuntimeLogsEnvCardBody';
import CustomHeader from './CustomHeader';

/**
 * File Integration integration module.
 *
 * Resolves from components whose `componentSubType` is
 * `ballerinaFileIntegration` or `miFileIntegration`. Before this module,
 * file integrations rendered as generic services (the legacy `<Environment>`
 * only looks at `displayType`, which is `ballerinaService` / `miApiService`
 * for both genuine services and file integrations) — so users saw an empty
 * Endpoint URLs panel and HTTP service insights that don't apply to file
 * integrations.
 *
 * Phase 3 is the first module built directly in the new structure rather
 * than bridging to the legacy `<Environment>`. The body shows the runtime
 * log stream (the meaningful per-env signal for event-driven integrations)
 * via the shared `_shared/bodies/RuntimeLogsEnvCardBody`, which Event
 * Integration will also adopt when its phase lands.
 */
const fileIntegrationModule: IntegrationModule = {
  ...INTEGRATION_TYPE_INFO['file-integration'],
  CustomHeader,
  EnvCardBody,
};

export default fileIntegrationModule;
