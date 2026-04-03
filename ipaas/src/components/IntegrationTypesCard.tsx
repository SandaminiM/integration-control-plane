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

import { Card, CardContent, Divider, Stack, Typography } from '@wso2/oxygen-ui';
import { PlugZap } from '@wso2/oxygen-ui-icons-react';
import type { GqlComponent } from '../api/queries';
import type { JSX } from 'react';

function getDisplayLabel(displayType: string, componentSubType: string | null): string {
  switch (componentSubType) {
    case 'ballerinaFileIntegration':
    case 'miFileIntegration':
      return 'File Integration';
    case 'aiAgent':
      return 'AI Agent';
    case 'mcpServer':
      return 'MCP Server';
  }
  switch (displayType) {
    case 'ballerinaService':
    case 'buildpackService':
    case 'byoiService':
    case 'byocService':
    case 'miApiService':
    case 'graphql':
    case 'thirdPartyApi':
    case 'prismMockService':
    case 'service':
      return 'Integration as API';
    case 'scheduledTask':
    case 'byocCronjob':
    case 'byoiCronjob':
    case 'miCronjob':
    case 'buildpackCronJob':
      return 'Automation';
    case 'manualTrigger':
      return 'Manual Trigger';
    case 'proxy':
    case 'gitProxy':
      return 'REST API Proxy';
    case 'webhook':
    case 'byocWebhook':
    case 'miWebhook':
    case 'buildpackWebhook':
    case 'ballerinaWebhook':
      return 'Webhook';
    case 'byocEventHandler':
    case 'miEventHandler':
    case 'buildpackEventHandler':
    case 'ballerinaEventHandler':
      return 'Event Integration';
    case 'restApi':
    case 'byocRestApi':
    case 'miRestApi':
    case 'buildRestApi':
      return 'Integration as an API';
    case 'byocWebApp':
    case 'byocWebAppsDockerfileLess':
    case 'byoiWebApp':
    case 'buildpackWebApp':
      return 'Web Application';
    case 'byocTestRunner':
    case 'buildpackTestRunner':
    case 'byocTestRunnerDockerfileLess':
      return 'Test Runner';
    case 'externalConsumer':
      return 'External Consumer';
    case 'byocJob':
    case 'byoiJob':
    case 'miJob':
    case 'buildpackJob':
      return 'Manual Task';
    default:
      return displayType ?? 'Unknown';
  }
}

export default function IntegrationTypesCard({ components }: { components: GqlComponent[] }): JSX.Element {
  const counts = components.reduce<Record<string, number>>((acc, c) => {
    const type = getDisplayLabel(c.displayType ?? '', c.componentSubType ?? null);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <PlugZap size={20} aria-hidden="true" />
          Integration Types
        </Typography>
        <Stack>
          {Object.entries(counts).map(([type, count]) => (
            <Stack key={type} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
              <Typography variant="body2">{type}</Typography>
              <Typography variant="body2">{count}</Typography>
            </Stack>
          ))}
          <Divider sx={{ my: 0.5 }} />
          <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Total
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {components.length}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
