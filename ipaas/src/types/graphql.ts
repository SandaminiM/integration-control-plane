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

/** A node in a parameter / response type tree (`type` is the SDL name, e.g. `User!`). */
export interface GraphqlAttrNode {
  name: string;
  type: string;
  children?: GraphqlAttrNode[];
}

export interface GraphqlParam {
  name: string;
  type: string;
  /** Expanded fields when the argument is an input object; empty for scalars. */
  attributes: GraphqlAttrNode[];
}

export interface GraphqlField {
  name: string;
  description: string;
  deprecated: boolean;
  params: GraphqlParam[];
  /** SDL name of the return type, e.g. `[User!]!`. */
  responseType: string;
  /** Expanded fields of the return type; empty for scalars. */
  responseAttributes: GraphqlAttrNode[];
}

/** A GraphQL operation group (`Query` / `Mutation` / `Subscription`) and its fields. */
export interface GraphqlOperation {
  name: string;
  fields: GraphqlField[];
}
