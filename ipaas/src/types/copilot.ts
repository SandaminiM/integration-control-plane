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

export const MessageType = {
  REGULAR: 'REGULAR',
  APICHAT: 'APICHAT',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const DataCollectorStatus = {
  ENABLED: 'Enabled',
  DISABLED: 'Disabled',
} as const;

export type DataCollectorStatus = (typeof DataCollectorStatus)[keyof typeof DataCollectorStatus];

export interface IMessage {
  id: string;
  content: { data: string | ApiChatExecutionResult[] };
  fromUser: boolean;
  type: MessageType;
}

export interface CopilotRegion {
  name: string;
  id: string;
  externalVhost: string;
  copilot_accessible: boolean;
  disconnected: boolean;
}

export interface QueryData {
  query: string;
  description?: string;
}

export interface ApiChatExecutionResult {
  id: number;
  result: string;
}

export interface NavigationResponse {
  content: string;
  navigate: {
    button_path: string;
    path: string;
  };
}
