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

import { Globe, Clock, Layers, Repeat, Server, Folder, HardDrive, Zap, Radio } from '@wso2/oxygen-ui-icons-react';
import { Box } from '@wso2/oxygen-ui';
import type { ReactNode } from 'react';
import type { IntegrationTypeOption } from '../types/import';

export const INTEGRATION_TYPES: IntegrationTypeOption[] = [
  {
    id: 'service',
    title: 'Integration as API',
    description: 'Expose your integration as a REST, GraphQL or WebSocket API',
    docLink: 'https://wso2.com/devant/docs/quick-start-guides/develop-your-first-integration-as-api',
    icons: [
      { icon: <Globe size={16} />, label: 'REST' },
      { icon: <Layers size={16} />, label: 'GraphQL' },
    ],
  },
  {
    id: 'automation',
    title: 'Automation',
    description: 'Run integrations on a schedule or as a recurring task',
    docLink: 'https://wso2.com/devant/docs/quick-start-guides/schedule-your-first-automation/',
    icons: [
      { icon: <Clock size={16} />, label: 'Scheduled' },
      { icon: <Repeat size={16} />, label: 'Recurring' },
    ],
  },
  {
    id: 'file-integration',
    title: 'File Integration',
    description: 'Process files from storage systems like FTP or AWS S3 when they arrive',
    docLink: 'https://wso2.com/integration-platform/docs/get-started/build-file-driven-integration',
    icons: [
      { icon: <Folder size={16} />, label: 'Files' },
      { icon: <HardDrive size={16} />, label: 'Storage' },
    ],
  },
  {
    id: 'event-integration',
    title: 'Event Integration',
    description: 'React to events from sources like Kafka, Azure Service Bus, RabbitMQ or NATS',
    docLink: 'https://wso2.com/integration-platform/docs/get-started/build-event-driven-integration',
    icons: [
      { icon: <Zap size={16} />, label: 'Events' },
      { icon: <Radio size={16} />, label: 'Streaming' },
    ],
  },
];

export const TECH_OPTIONS: { id: 'MI' | 'BI'; label: string; icon: ReactNode }[] = [
  {
    id: 'MI',
    label: 'WSO2 Micro Integrator',
    icon: <Server size={20} />,
  },
  {
    id: 'BI',
    label: 'Ballerina Integrator',
    icon: (
      <Box
        component="img"
        src="https://ballerina.io/favicon.ico"
        alt="Ballerina"
        sx={{ width: 20, height: 20, objectFit: 'contain' }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    ),
  },
];
