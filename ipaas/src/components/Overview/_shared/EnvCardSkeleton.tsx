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

import { Divider, Skeleton, Stack } from '@wso2/oxygen-ui';
import type { ReactNode } from 'react';

/**
 * Common content skeleton for an env card's body, shown while the type's data
 * loads. Mirrors the body layout (a leading divider then a few content blocks)
 * so the card keeps a stable shape and only its content fades in — avoiding the
 * empty-then-pop jump every type's body would otherwise show.
 */
export default function EnvCardSkeleton(): ReactNode {
  return (
    <>
      <Divider sx={{ my: 2 }} />
      <Stack gap={1.5} aria-busy="true" aria-label="Loading">
        <Skeleton variant="rounded" height={24} width="35%" />
        <Skeleton variant="rounded" height={64} />
        <Skeleton variant="rounded" height={18} width="75%" />
      </Stack>
    </>
  );
}
