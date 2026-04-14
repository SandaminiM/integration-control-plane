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

export default function GitHubIcon({ size = 24 }: { size?: number }): JSX.Element {
  return (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12,0A12.155,12.155,0,0,0,0,12.3,12.281,12.281,0,0,0,8.207,23.978c.6.113.819-.267.819-.593,0-.292-.01-1.066-.016-2.092-3.338.743-4.042-1.65-4.042-1.65a3.238,3.238,0,0,0-1.333-1.8c-1.09-.763.083-.748.083-.748a2.527,2.527,0,0,1,1.838,1.268,2.52,2.52,0,0,0,3.493,1.022,2.656,2.656,0,0,1,.762-1.644c-2.665-.31-5.466-1.366-5.466-6.081a4.823,4.823,0,0,1,1.235-3.3A4.524,4.524,0,0,1,5.7,5.1S6.7,4.772,9,6.364a11.089,11.089,0,0,1,6.008,0C17.3,4.772,18.3,5.1,18.3,5.1a4.526,4.526,0,0,1,.12,3.256,4.814,4.814,0,0,1,1.233,3.3c0,4.727-2.806,5.767-5.479,6.071a2.979,2.979,0,0,1,.814,2.279c0,1.644-.015,2.971-.015,3.375,0,.329.217.712.825.592A12.285,12.285,0,0,0,24,12.3,12.155,12.155,0,0,0,12,0Z"
      />
    </svg>
  );
}
