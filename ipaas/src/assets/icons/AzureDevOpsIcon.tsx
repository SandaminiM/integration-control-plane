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

/**
 * Azure DevOps' brand mark is a blue gradient on light backgrounds; their guidelines
 * call for the flat white variant on dark backgrounds. Oxygen UI's theme toggles a
 * `data-color-scheme` attribute on `<html>` (not MUI's `theme.palette.mode`, which
 * this design system's CSS-variables setup leaves static), so the swap is done in
 * plain CSS rather than a JS mode check.
 */
export default function AzureDevOpsIcon({ size = 24 }: { size?: number }): JSX.Element {
  const uid = useId().replace(/:/g, '');
  const gradientId = `azure-devops-gradient-${uid}`;
  const pathClass = `azure-devops-path-${uid}`;
  return (
    <svg height={size} width={size} viewBox="0 0 34 35" fill="none" aria-hidden="true">
      <style>{`html[data-color-scheme='dark'] .${pathClass} { fill: #fff; }`}</style>
      <path
        className={pathClass}
        d="M34 6.375V27.0725L25.5 34.0425L12.325 29.24V34L4.86625 24.2462L26.605 25.9463V7.31L34 6.375ZM26.7538 7.41625L14.5562 0V4.86625L3.3575 8.16L0 12.4737V22.27L4.8025 24.395V11.8363L26.7538 7.41625Z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient id={gradientId} x1="17" y1="33.9362" x2="17" y2="0.0637506" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0078D4" />
          <stop offset="0.16" stopColor="#1380DA" />
          <stop offset="0.53" stopColor="#3C91E5" />
          <stop offset="0.82" stopColor="#559CEC" />
          <stop offset="1" stopColor="#5EA0EF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
