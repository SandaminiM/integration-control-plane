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

import { type JSX } from 'react';

export default function NatsIcon({ size = 24 }: { size?: number }): JSX.Element {
  return (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="#34a574" d="M12 0.25h11.349775v9.20115H12V0.25Z" />
      <path fill="#27aae1" d="M0.6501475 0.25H11.999925v9.20115H0.6501475V0.25Z" />
      <path fill="#8dc63f" d="M23.34965 9.4596V18.66075H15.88425v5.089275L10.33155 18.6776l1.668325 -0.067425V9.4596h11.349775Z" />
      <path fill="#375c93" d="M11.999925 9.4596v10.70045l-1.66835 -1.48245H0.6501475v-9.218H11.999925Z" />
      <path fill="#ffffff" d="M16.701725 12.14745V4.5304h2.71315v9.84995H15.303025L7.00345 6.62845v7.760325H4.28185V4.5304h4.255125l8.16475 7.61705Z" />
    </svg>
  );
}
