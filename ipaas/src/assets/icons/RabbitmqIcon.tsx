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

export default function RabbitmqIcon({ size = 24 }: { size?: number }): JSX.Element {
  return (
    <svg height={size} width={size} viewBox="0 0 132.29167 132.29166" aria-hidden="true">
      <g transform="translate(-76.200105,-115.62292)">
        <g transform="matrix(3.3139169,0,0,3.3139169,76.216727,114.23118)">
          <path
            d="M 39.42,17.37 H 26.65 a 1.59,1.59 0 0 1 -1.6,-1.6 V 3 A 1.59,1.59 0 0 0 23.45,1.41 H 18.67 A 1.59,1.59 0 0 0 17.07,3 v 12.77 a 1.59,1.59 0 0 1 -1.6,1.6 h -4.78 a 1.59,1.59 0 0 1 -1.6,-1.6 V 3 A 1.59,1.59 0 0 0 7.49,1.4 H 2.7 A 1.59,1.59 0 0 0 1.11,3 v 36.72 a 1.59,1.59 0 0 0 1.6,1.6 h 36.71 a 1.59,1.59 0 0 0 1.6,-1.6 V 19 a 1.59,1.59 0 0 0 -1.6,-1.63 z M 33,30.93 a 2.39,2.39 0 0 1 -2.39,2.4 h -3.2 a 2.39,2.39 0 0 1 -2.39,-2.4 v -3.19 a 2.39,2.39 0 0 1 2.39,-2.4 h 3.2 a 2.39,2.39 0 0 1 2.39,2.4 z"
            transform="translate(-1.11,-0.98)"
            fill="#ff6600"
          />
        </g>
      </g>
    </svg>
  );
}
