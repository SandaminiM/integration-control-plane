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

/** Marketplace REST base for internal-marketplace services. */
export const MARKETPLACE_BASE = '/marketplace/0.1.0';

/** GenAI services are marketplace services filtered/tagged with this template type. */
export const GENAI_TEMPLATE_TYPE = 'GenAI';

/** Every GenAI service carries a mandatory endpoint base-URL connection field. */
export const SERVICE_URL_FIELD = 'ServiceURL';

/** Template default-config key that supplies the endpoint base URL. */
export const SERVICE_URL_CONFIG_KEY = 'serviceUrl';

/** Fixed attributes for a GenAI create payload (org-scoped, OpenAPI, REST). */
export const GENAI_SERVICE_TYPE = 'REST';
export const GENAI_IDL_TYPE = 'OpenAPI';
/** Marketplace stores third-party service definitions under this synthetic environment id. */
export const GENAI_IDL_ENVIRONMENT_ID = 'third-party-service';
export const GENAI_VISIBILITY = ['ORGANIZATION'];
export const GENAI_PROJECT_VISIBILITY = ['PROJECT'];
export const GENAI_DEFAULT_VERSION = 'v1';
export const GENAI_RESOURCE_TYPE = 'SERVICE';

/** Rows-per-page options for the services list (mirrors Devant). */
export const GENAI_PAGE_SIZE_OPTIONS = [5, 10, 15, 20];
export const GENAI_DEFAULT_PAGE_SIZE = 10;

/** Marketplace status → list-column label. PROTOTYPE/PUBLISHED are in the marketplace. */
export function marketplaceStatusLabel(status: string): 'Available' | 'Not Available' {
  return status === 'PUBLISHED' || status === 'PROTOTYPE' ? 'Available' : 'Not Available';
}

/** Public path prefix for the provider logo SVGs (copied from Devant). */
export const GENAI_LOGO_BASE = 'assets/images/genai/';

/**
 * Tokens found in a service's connection-parameter names that identify its source provider.
 * A service doesn't persist which template it came from, so this is how we recover the logo.
 * Order matters: Azure OpenAI keys also contain "OPENAI", so AZURE must be checked first.
 */
export const GENAI_PROVIDER_TOKENS: { token: string; provider: string }[] = [
  { token: 'AZURE', provider: 'Azure Open AI' },
  { token: 'OPENAI', provider: 'Open AI' },
  { token: 'ANTHROPIC', provider: 'Anthropic AI' },
  { token: 'CLAUDE', provider: 'Anthropic AI' },
  { token: 'MISTRAL', provider: 'Mistral AI' },
];

export interface GenAiProviderMeta {
  description: string;
  /** Logo filename under {@link GENAI_LOGO_BASE}. */
  logo: string;
}

/**
 * Static provider presentation (description + logo), keyed by the provider `name`
 * returned by `/templates/list`. Names are stable across environments; template ids
 * are not. Copy from Devant's `genAIServiceTypesInfo`.
 */
export const GENAI_PROVIDER_META: Record<string, GenAiProviderMeta> = {
  'Open AI': {
    description: 'Provides powerful endpoints for text generation, summarization, and question answering, enabling advanced NLP capabilities for developers.',
    logo: 'openai.svg',
  },
  'Mistral AI': {
    description: 'Provides customizable NLP endpoints for text generation, summarization, and analysis, supporting efficient AI integration in applications.',
    logo: 'mistral.svg',
  },
  'Anthropic AI': {
    description: 'Provides reliable NLP endpoints for text completion and conversation, prioritizing safety and ethical AI practices.',
    logo: 'anthropic.svg',
  },
  'Azure Open AI': {
    description: 'Integrates OpenAI models with Azure services to provide secure endpoints for text processing, AI-driven applications, and enterprise solutions.',
    logo: 'azure-openai.svg',
  },
};
