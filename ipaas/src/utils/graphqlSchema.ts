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

import { GraphQLList, GraphQLNonNull, GraphQLObjectType, isInputObjectType, isScalarType, type GraphQLInputType, type GraphQLOutputType, type GraphQLSchema } from 'graphql';

/** A GraphQL operation group (Query / Mutation / Subscription) and its fields. */
export interface GraphqlOperation {
  name: string;
  fields: GraphqlField[];
}

export interface GraphqlField {
  name: string;
  description: string;
  isDeprecated: boolean;
  params: Array<{ name: string; type: string }>;
  responseType: GraphQLOutputType;
}

/** Nested attribute tree: a leaf holds a type name under the `value` key. */
export type GraphqlAttrTree = Map<string, string | GraphqlAttrTree>;

const MAX_DEPTH = 3;

/** Render a GraphQL type to its SDL name, e.g. `[User!]!`. */
export function getTypeName(type: GraphQLOutputType | GraphQLInputType): string {
  if (type instanceof GraphQLNonNull) return `${getTypeName(type.ofType)}!`;
  if (type instanceof GraphQLList) return `[${getTypeName(type.ofType)}]`;
  return type.name;
}

/** Flatten a schema's root types into Query / Mutation / Subscription operation groups. */
export function parseSchema(schema: GraphQLSchema, noDescriptionText: string): GraphqlOperation[] {
  const operations: GraphqlOperation[] = [];

  const addOperation = (name: string, type?: GraphQLObjectType | null) => {
    if (!type) return;
    operations.push({
      name,
      fields: Object.values(type.getFields()).map((field) => ({
        name: field.name,
        description: field.description || noDescriptionText,
        isDeprecated: Boolean(field.deprecationReason),
        params: field.args?.map((arg) => ({ name: arg.name, type: getTypeName(arg.type) })) ?? [],
        responseType: field.type,
      })),
    });
  };

  addOperation('Query', schema.getQueryType());
  addOperation('Mutation', schema.getMutationType());
  addOperation('Subscription', schema.getSubscriptionType());

  return operations;
}

function unwrap(type: GraphQLOutputType | GraphQLInputType): GraphQLOutputType | GraphQLInputType {
  let t: GraphQLOutputType | GraphQLInputType = type;
  while (t instanceof GraphQLNonNull || t instanceof GraphQLList) t = t.ofType;
  return t;
}

/** Recursively expand an output type into a name→type attribute tree (for Response Attributes). */
export function extractAttributes(type: GraphQLOutputType, depth = 0, visited = new Set<string>()): GraphqlAttrTree {
  const attributes: GraphqlAttrTree = new Map();
  const unwrapped = unwrap(type);

  if (isScalarType(unwrapped) || depth >= MAX_DEPTH || !(unwrapped instanceof GraphQLObjectType) || visited.has(unwrapped.name)) {
    attributes.set('value', getTypeName(type));
    return attributes;
  }

  visited.add(unwrapped.name);
  Object.values(unwrapped.getFields()).forEach((field) => {
    attributes.set(field.name, extractAttributes(field.type, depth + 1, new Set(visited)));
  });
  return attributes;
}

/** Recursively expand an input type into a name→type attribute tree (for Parameter drill-down). */
export function extractInputTypeAttributes(type: GraphQLInputType, depth = 0, visited = new Set<string>()): GraphqlAttrTree {
  const attributes: GraphqlAttrTree = new Map();
  const unwrapped = unwrap(type);

  if (isScalarType(unwrapped) || depth >= MAX_DEPTH || !isInputObjectType(unwrapped) || visited.has(unwrapped.name)) {
    attributes.set('value', getTypeName(type));
    return attributes;
  }

  visited.add(unwrapped.name);
  Object.values(unwrapped.getFields()).forEach((field) => {
    attributes.set(field.name, extractInputTypeAttributes(field.type, depth + 1, new Set(visited)));
  });
  return attributes;
}
