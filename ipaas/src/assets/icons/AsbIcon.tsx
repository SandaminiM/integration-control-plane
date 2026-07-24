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

import { useId, type JSX } from 'react';

/** Azure Service Bus brand icon. */
export default function AsbIcon({ size = 24 }: { size?: number }): JSX.Element {
  const gradientId = useId();
  return (
    <svg height={size} width={size} viewBox="0 0 18 18" aria-hidden="true">
      <g>
        <polygon points="13.387 7.4 13.382 7.396 13.382 7.384 13.363 7.384 8.997 4.405 4.631 7.384 4.612 7.384 4.612 7.396 4.606 7.4 4.612 7.4 4.612 13.201 13.382 13.201 13.382 7.4 13.387 7.4" fill="#50e6ff" />
        <path d="M4.606,7.4c0-.1.008,5.681.008,5.8L8.995,10.3Z" fill="#32bedd" />
        <path d="M13.384,7.4,8.995,10.3,13.376,13.2C13.376,13.083,13.384,7.3,13.384,7.4Z" fill="#198ab3" />
        <polygon points="8.995 10.299 4.614 13.194 4.614 13.199 13.376 13.199 13.376 13.194 8.995 10.299" fill={`url(#${gradientId})`} />
        <g>
          <path d="M1.072,1.43h1.29a0,0,0,0,1,0,0v3.6a.286.286,0,0,1-.286.286H.786A.286.286,0,0,1,.5,5.035V2A.572.572,0,0,1,1.072,1.43Z" fill="#999" />
          <path d="M1.072,1.43h1.29a0,0,0,0,1,0,0v3.6a.286.286,0,0,1-.286.286H.786A.286.286,0,0,1,.5,5.035V2A.572.572,0,0,1,1.072,1.43Z" fill="#999" opacity="0.5" />
        </g>
        <g>
          <path d="M15.638,1.43h1.29A.572.572,0,0,1,17.5,2V5.035a.286.286,0,0,1-.286.286h-1.29a.286.286,0,0,1-.286-.286V1.43A0,0,0,0,1,15.638,1.43Z" fill="#999" />
          <path d="M15.638,1.43h1.29A.572.572,0,0,1,17.5,2V5.035a.286.286,0,0,1-.286.286h-1.29a.286.286,0,0,1-.286-.286V1.43A0,0,0,0,1,15.638,1.43Z" fill="#999" opacity="0.5" />
        </g>
        <path d="M8.66-6.163H9.907a0,0,0,0,1,0,0v17a0,0,0,0,1,0,0H8.66a.567.567,0,0,1-.567-.567V-5.6A.567.567,0,0,1,8.66-6.163Z" transform="translate(11.337 -6.663) rotate(90)" fill="#949494" />
        <g>
          <path d="M.786,12.679h1.29a.286.286,0,0,1,.286.286v3.6a0,0,0,0,1,0,0H1.072A.572.572,0,0,1,.5,16V12.965A.286.286,0,0,1,.786,12.679Z" fill="#999" />
          <path d="M.786,12.679h1.29a.286.286,0,0,1,.286.286v3.6a0,0,0,0,1,0,0H1.072A.572.572,0,0,1,.5,16V12.965A.286.286,0,0,1,.786,12.679Z" fill="#999" opacity="0.5" />
        </g>
        <g>
          <path d="M15.924,12.679h1.29a.286.286,0,0,1,.286.286V16a.572.572,0,0,1-.572.572h-1.29a0,0,0,0,1,0,0v-3.6A.286.286,0,0,1,15.924,12.679Z" fill="#999" />
          <path d="M15.924,12.679h1.29a.286.286,0,0,1,.286.286V16a.572.572,0,0,1-.572.572h-1.29a0,0,0,0,1,0,0v-3.6A.286.286,0,0,1,15.924,12.679Z" fill="#999" opacity="0.5" />
        </g>
        <path d="M8.66,7.163H9.907a0,0,0,0,1,0,0v17a0,0,0,0,1,0,0H8.66a.567.567,0,0,1-.567-.567V7.73A.567.567,0,0,1,8.66,7.163Z" transform="translate(-6.663 24.663) rotate(-90)" fill="#949494" />
      </g>
      <defs>
        <linearGradient id={gradientId} x1="8.995" y1="10.299" x2="8.995" y2="13.199" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#005ba1" />
          <stop offset="0.258" stopColor="#00589d" />
          <stop offset="0.525" stopColor="#004f90" />
          <stop offset="0.796" stopColor="#003f7c" />
          <stop offset="1" stopColor="#003067" />
        </linearGradient>
      </defs>
    </svg>
  );
}
