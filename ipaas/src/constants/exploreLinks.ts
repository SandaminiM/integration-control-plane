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

const DOCS = 'https://wso2.com/devant/docs/';

export interface ExploreLink {
  label: string;
  href: string;
}

export interface ExploreGroup {
  title: string;
  links: ExploreLink[];
}

/** The "Explore More" groups shown under the org's project list, mirroring Devant's. */
export const EXPLORE_GROUPS: readonly ExploreGroup[] = [
  {
    title: 'Tutorials',
    links: [
      { label: 'Schedule Your First Automation', href: `${DOCS}quick-start-guides/schedule-your-first-automation/` },
      { label: 'Develop Your First Integration as API', href: `${DOCS}quick-start-guides/develop-your-first-integration-as-api` },
      { label: 'Develop Your First AI Agent', href: `${DOCS}quick-start-guides/develop-your-first-ai-agent/` },
      { label: 'Develop Your First Event Integration', href: `${DOCS}quick-start-guides/develop-your-first-event-integration/` },
      { label: 'Develop Your First File Integration', href: `${DOCS}quick-start-guides/develop-your-first-file-integration/` },
    ],
  },
  {
    title: 'References',
    links: [
      { label: 'RAG Ingestion', href: `${DOCS}rag/rag-ingestion/` },
      { label: 'Manage Your Integrations with DevOps and CI/CD', href: `${DOCS}devops-and-ci-cd/` },
      { label: 'Observe Your Integration', href: `${DOCS}monitoring-and-insights/` },
    ],
  },
  {
    title: 'Support',
    links: [{ label: 'Get Support on Discord', href: 'https://discord.com/invite/wso2' }],
  },
];
