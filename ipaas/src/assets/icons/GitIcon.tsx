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

export default function GitIcon({ size = 24 }: { size?: number }): JSX.Element {
  return (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.546 10.93L13.067.452a1.55 1.55 0 0 0-2.188 0L8.708 2.627l2.76 2.76a1.838 1.838 0 0 1 2.327 2.341l2.658 2.66a1.838 1.838 0 1 1-1.104 1.045L12.794 8.86v6.617a1.838 1.838 0 1 1-1.51-.072V8.743a1.838 1.838 0 0 1-.997-2.414L7.55 3.574 .45 10.672a1.55 1.55 0 0 0 0 2.187l10.478 10.478a1.55 1.55 0 0 0 2.189 0l10.43-10.43a1.55 1.55 0 0 0 0-1.977z" />
    </svg>
  );
}
