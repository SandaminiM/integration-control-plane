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

import { Avatar, Box, Typography } from '@wso2/oxygen-ui';
import { User } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import type { SxProps, Theme } from '@wso2/oxygen-ui';
import AIIcon from '../../assets/icons/ai/AIIcon';

const USER_BUBBLE_SX: SxProps<Theme> = {
  maxWidth: '78%',
  px: 2.5,
  py: 1.75,
  bgcolor: 'action.hover',
  color: 'text.primary',
  borderRadius: 1,
  borderTopRightRadius: 0.25,
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
};

const USER_AVATAR_SX: SxProps<Theme> = {
  width: 32,
  height: 32,
  flexShrink: 0,
  bgcolor: 'action.hover',
  color: 'text.secondary',
};

export function AgentAvatar(): JSX.Element {
  return <AIIcon width={25} height={25} style={{ flexShrink: 0 }} />;
}

export function UserMessage({ query }: { query: string }): JSX.Element {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.25, alignItems: 'flex-start' }}>
      <Box sx={USER_BUBBLE_SX}>
        <Typography variant="body2">{query}</Typography>
      </Box>
      <Avatar sx={USER_AVATAR_SX}>
        <User size={16} />
      </Avatar>
    </Box>
  );
}
