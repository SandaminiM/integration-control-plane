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

import { describe, it, expect } from 'vitest';
import { buildSchema } from 'graphql';
import { operationsFromSchema } from './graphqlSchema';

const schema = buildSchema(`
  "A user in the system."
  type User { id: Int!, name: String!, email: String! }
  input NewUser { name: String!, email: String! }
  interface Node { id: Int! }
  type Query {
    greeting: String!
    profile(id: Int!): User!
    node: Node!
    legacy: String @deprecated(reason: "old")
  }
  type Mutation {
    addUser(user: NewUser!): User!
  }
`);

describe('operationsFromSchema', () => {
  const ops = operationsFromSchema(schema);
  const query = ops.find((o) => o.name === 'Query');
  const mutation = ops.find((o) => o.name === 'Mutation');

  it('groups fields by operation type', () => {
    expect(ops.map((o) => o.name)).toEqual(['Query', 'Mutation']);
    expect(query?.fields.map((f) => f.name)).toEqual(['greeting', 'profile', 'node', 'legacy']);
    expect(mutation?.fields.map((f) => f.name)).toEqual(['addUser']);
  });

  it('renders SDL type names and leaves scalar responses without attributes', () => {
    const greeting = query?.fields.find((f) => f.name === 'greeting');
    expect(greeting?.responseType).toBe('String!');
    expect(greeting?.responseAttributes).toEqual([]);
    expect(greeting?.params).toEqual([]);
  });

  it('expands object return types into a response attribute tree', () => {
    const profile = query?.fields.find((f) => f.name === 'profile');
    expect(profile?.responseType).toBe('User!');
    expect(profile?.responseAttributes.map((a) => `${a.name}:${a.type}`)).toEqual(['id:Int!', 'name:String!', 'email:String!']);
    expect(profile?.params).toEqual([{ name: 'id', type: 'Int!', attributes: [] }]);
  });

  it('expands input-object params into an attribute tree', () => {
    const addUser = mutation?.fields.find((f) => f.name === 'addUser');
    const userParam = addUser?.params[0];
    expect(userParam?.type).toBe('NewUser!');
    expect(userParam?.attributes.map((a) => a.name)).toEqual(['name', 'email']);
  });

  it('flags deprecated fields', () => {
    expect(query?.fields.find((f) => f.name === 'legacy')?.deprecated).toBe(true);
  });

  it('expands interface return types', () => {
    const node = query?.fields.find((f) => f.name === 'node');
    expect(node?.responseType).toBe('Node!');
    expect(node?.responseAttributes.map((a) => `${a.name}:${a.type}`)).toEqual(['id:Int!']);
  });
});
