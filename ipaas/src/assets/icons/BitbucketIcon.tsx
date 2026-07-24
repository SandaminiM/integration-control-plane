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

export default function BitbucketIcon({ size = 24 }: { size?: number }): JSX.Element {
  return (
    <svg height={size} width={(size * 65) / 59} viewBox="0 0 65 59" aria-hidden="true">
      <path
        fill="#1868DB"
        d="M61.2469 26.1175L56.4025 55.7103C56.0866 57.5007 54.8228 58.5538 53.0325 58.5538H11.9606C10.1703 58.5538 8.90653 57.5007 8.59063 55.7103L0.0603263 2.9487C-0.255674 1.1584 0.692227 0 2.37723 0H62.616C64.301 0 65.2488 1.1584 64.9329 2.9487L62.616 16.85C62.3 18.8509 61.1416 19.6934 59.246 19.6934H23.0184C22.4919 19.6934 22.1759 20.0094 22.2812 20.6412L25.1247 38.1231C25.23 38.5444 25.5459 38.8603 25.9672 38.8603H39.0259C39.4472 38.8603 39.7631 38.5444 39.8684 38.1231L41.8694 25.4856C42.08 23.9059 43.1331 23.2741 44.6075 23.2741H58.8247C60.931 23.2741 61.5629 24.3272 61.2469 26.1175Z"
      />
    </svg>
  );
}
