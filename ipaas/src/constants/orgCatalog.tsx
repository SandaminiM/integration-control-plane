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

import type { ReactNode } from 'react';
import { AudioLines, BookOpen, Database, DatabaseZap, MessageSquare, Puzzle } from '@wso2/oxygen-ui-icons-react';

export interface CatalogOption {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
}

export interface CatalogGroup {
  id: 'resources' | 'ai-services';
  title: string;
  /** The overview card's action. */
  actionLabel: string;
  description: string;
  options: CatalogOption[];
}

export const RESOURCES_GROUP: CatalogGroup = {
  id: 'resources',
  title: 'Resources',
  actionLabel: 'Create a Resource',
  description: 'Choose the kind of resource to add for your integrations.',
  options: [
    { id: 'databases', title: 'Database', description: 'Provision managed databases for your integrations.', icon: <Database size={22} /> },
    { id: 'vector-databases', title: 'Vector Database', description: 'Store and search embeddings for AI workloads.', icon: <DatabaseZap size={22} /> },
    // GenAI services are registered here too, as third-party services, rather than under AI Services.
    { id: 'third-party-services', title: 'Third-party Service', description: 'Register external services and AI models your integrations call.', icon: <Puzzle size={22} /> },
    { id: 'message-brokers', title: 'Message Broker', description: 'Create brokers for event-driven messaging.', icon: <MessageSquare size={22} /> },
  ],
};

export const AI_SERVICES_GROUP: CatalogGroup = {
  id: 'ai-services',
  title: 'AI Services',
  actionLabel: 'Create an AI Service',
  description: 'Choose the kind of AI service to add for your integrations and agents.',
  options: [
    { id: 'knowledge-bases', title: 'Knowledge Base', description: 'Organize the content your agents draw on.', icon: <BookOpen size={22} /> },
    { id: 'voice-agents', title: 'Voice Agent', description: 'Build agents that talk with your users.', icon: <AudioLines size={22} /> },
  ],
};
