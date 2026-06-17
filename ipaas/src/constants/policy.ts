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

import type { TimeUnit } from '../types/policy';

export const TIME_UNITS: { value: TimeUnit; label: string }[] = [
  { value: 'MINUTE', label: 'Minute' },
  { value: 'HOUR', label: 'Hour' },
  { value: 'DAY', label: 'Day' },
];

// CORS defaults match ManageDrawer so a first-time enable produces the same shape.
export const DEFAULT_CORS_HEADERS = ['authorization', 'Access-Control-Allow-Origin', 'Content-Type', 'SOAPAction', 'apikey', 'testKey'];
export const DEFAULT_CORS_METHODS = ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'];
export const CORS_METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
