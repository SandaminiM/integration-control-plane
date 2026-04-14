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

import type { Sample } from '../types/samples';
import type { PrebuiltIntegration } from '../types/samples';
import samplesData from '../data/samples.json';
import prebuiltData from '../data/prebuilt-integrations.json';
import { ALLOWED_SAMPLE_TYPES, normalizeComponentType } from './integrations';

// BrowseSamples page constants
export const PAGE_SIZE = 9;

export const ALL_SAMPLES = (samplesData.samples as Sample[]).filter((s) => ALLOWED_SAMPLE_TYPES.has(s.componentType));
export const UNIQUE_TYPES = Array.from(new Set(ALL_SAMPLES.map((s) => normalizeComponentType(s.componentType))));
export const UNIQUE_BUILDPACKS = Array.from(new Set(ALL_SAMPLES.map((s) => s.buildPack)));
export const UNIQUE_TAGS = Array.from(new Set(ALL_SAMPLES.flatMap((s) => s.tags))).sort();

// CreateIntegrationOptions page constants
export const FEATURED_SAMPLES = (samplesData.samples as Sample[]).slice(0, 3);
export const FEATURED_PREBUILT = prebuiltData.prebuiltIntegrations as PrebuiltIntegration[];
