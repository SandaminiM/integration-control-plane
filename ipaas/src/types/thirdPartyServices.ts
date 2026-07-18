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

import type { EndpointConfigDraft } from './genaiServices';

/**
 * The register-wizard draft for a Third Party Service. The service definition is a
 * user-uploaded file (base64-encoded); endpoints reuse the shared marketplace draft.
 */
export interface ThirdPartyServiceDraft {
  name: string;
  version: string;
  summary: string;
  /** REST | GRAPHQL | SOAP | ASYNC_API | GRPC. */
  serviceType: string;
  /** Uploaded service-definition content, base64(url-encoded); empty when none provided. */
  serviceDefContent: string;
  endpoints: EndpointConfigDraft[];
}

/** Args to the third-party create orchestration (create → connection config → status). */
export interface CreateThirdPartyServiceArgs {
  draft: ThirdPartyServiceDraft;
}
