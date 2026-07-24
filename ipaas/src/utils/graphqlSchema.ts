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

import { buildClientSchema, GraphQLInterfaceType, GraphQLList, GraphQLNonNull, GraphQLObjectType, isInputObjectType, isScalarType, type GraphQLInputType, type GraphQLNamedType, type GraphQLOutputType, type GraphQLSchema } from 'graphql';
import type { GraphqlAttrNode, GraphqlOperation } from '../types/graphql';

const MAX_DEPTH = 3;

function getTypeName(type: GraphQLOutputType | GraphQLInputType): string {
  if (type instanceof GraphQLNonNull) return `${getTypeName(type.ofType)}!`;
  if (type instanceof GraphQLList) return `[${getTypeName(type.ofType)}]`;
  return type.name;
}

function unwrap(type: GraphQLOutputType | GraphQLInputType): GraphQLNamedType {
  let t: GraphQLOutputType | GraphQLInputType = type;
  while (t instanceof GraphQLNonNull || t instanceof GraphQLList) t = t.ofType;
  return t as GraphQLNamedType;
}

/** Expand an output/input type's fields into a tree, stopping at scalars, cycles, or MAX_DEPTH. */
function attributesOf(type: GraphQLOutputType | GraphQLInputType, depth = 0, visited = new Set<string>()): GraphqlAttrNode[] {
  const unwrapped = unwrap(type);
  if (isScalarType(unwrapped) || depth >= MAX_DEPTH || visited.has(unwrapped.name)) return [];
  const isObjectLike = unwrapped instanceof GraphQLObjectType || unwrapped instanceof GraphQLInterfaceType || isInputObjectType(unwrapped);
  if (!isObjectLike) return [];

  const next = new Set(visited).add(unwrapped.name);
  return Object.values((unwrapped as GraphQLObjectType).getFields()).map((field) => ({
    name: field.name,
    type: getTypeName(field.type),
    children: attributesOf(field.type, depth + 1, next),
  }));
}

/** Flatten a schema into Query / Mutation / Subscription operation groups (domain shape, serializable). */
export function operationsFromSchema(schema: GraphQLSchema): GraphqlOperation[] {
  const operations: GraphqlOperation[] = [];

  const addOperation = (name: string, type?: GraphQLObjectType | null) => {
    if (!type) return;
    operations.push({
      name,
      fields: Object.values(type.getFields()).map((field) => ({
        name: field.name,
        description: field.description ?? '',
        deprecated: Boolean(field.deprecationReason),
        params: field.args.map((arg) => ({ name: arg.name, type: getTypeName(arg.type), attributes: attributesOf(arg.type) })),
        responseType: getTypeName(field.type),
        responseAttributes: attributesOf(field.type),
      })),
    });
  };

  addOperation('Query', schema.getQueryType());
  addOperation('Mutation', schema.getMutationType());
  addOperation('Subscription', schema.getSubscriptionType());
  return operations;
}

/** Build operation groups from a raw GraphQL introspection response. */
export function buildOperations(introspection: unknown): GraphqlOperation[] {
  return operationsFromSchema(buildClientSchema(introspection as Parameters<typeof buildClientSchema>[0]));
}
