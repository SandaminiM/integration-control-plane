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

import { Fragment, type JSX } from 'react';
import { Box } from '@wso2/oxygen-ui';
import AppAvatar from './AppAvatar';
import DirectionArrow from './DirectionArrow';

interface AppIconsRowProps {
  applications: string[];
  bidirectional?: boolean;
  avatarSize?: number;
  bgcolor?: string;
}

export default function AppIconsRow({ applications, bidirectional = false, avatarSize = 28, bgcolor = 'background.paper' }: AppIconsRowProps): JSX.Element {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor, p: 1.25, borderRadius: 1, flexShrink: 0 }}>
      {applications.map((app, i) => (
        <Fragment key={`${app}-${i}`}>
          {i > 0 && (
            <Box sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center' }}>
              <DirectionArrow bidirectional={bidirectional} />
            </Box>
          )}
          <AppAvatar name={app} size={avatarSize} />
        </Fragment>
      ))}
    </Box>
  );
}
