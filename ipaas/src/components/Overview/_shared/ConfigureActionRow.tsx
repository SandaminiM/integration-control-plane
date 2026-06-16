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

import { Box, Button, Stack, Tooltip } from '@wso2/oxygen-ui';
import { Check } from '@wso2/oxygen-ui-icons-react';
import type { ComponentType, ReactNode } from 'react';

interface ConfigureActionRowProps {
  Icon: ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
}

/**
 * A "Configure …" action row in the Overview header: a text button (icon +
 * label) with a green success indicator beside it. Shared so every configure
 * action looks identical — e.g. Configure Security and (for MCP) Configure
 * Policies.
 */
export default function ConfigureActionRow({ Icon, label, onClick }: ConfigureActionRowProps): ReactNode {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <Button variant="text" size="small" startIcon={<Icon size={14} />} onClick={onClick} sx={{ color: 'text.secondary', textTransform: 'none', p: 0, minWidth: 0, '&:hover': { background: 'none', textDecoration: 'underline' } }}>
        {label}
      </Button>
      <Tooltip title="Configured">
        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
          <Check size={10} />
        </Box>
      </Tooltip>
    </Stack>
  );
}
