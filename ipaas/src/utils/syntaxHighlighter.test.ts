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

import { describe, expect, it } from 'vitest';
import { prism, SyntaxHighlighter } from './syntaxHighlighter';

interface RenderedElement {
  props: { children: unknown; className?: string };
}

// react-syntax-highlighter's PrismLight doesn't expose a `listLanguages()` static,
// so registration is verified by invoking the component directly (no DOM/JSX needed)
// and checking that it produced real language tokens instead of a single plain-text node.
function highlightedTokenClassNames(language: string, code: string): (string | undefined)[] {
  const render = SyntaxHighlighter as unknown as (props: Record<string, unknown>) => RenderedElement;
  const element = render({ language, children: code, PreTag: 'pre', CodeTag: 'code' });
  const pre = element.props.children as RenderedElement;
  const codeChildren = pre.props.children as unknown[];
  const tokens = codeChildren[1] as RenderedElement[];
  return tokens.map((token) => token.props.className);
}

describe('syntaxHighlighter', () => {
  it('exports a truthy SyntaxHighlighter and prism style', () => {
    expect(SyntaxHighlighter).toBeTruthy();
    expect(prism).toBeTruthy();
  });

  it('registers the json language', () => {
    expect(highlightedTokenClassNames('json', '{"a":1}')).toContain('token token property');
  });

  it('registers the markup language (covers the xml alias)', () => {
    expect(highlightedTokenClassNames('markup', '<a>1</a>')).toContain('token token tag');
  });

  it('registers the yaml language', () => {
    expect(highlightedTokenClassNames('yaml', 'a: 1')).toContain('token token key atrule');
  });

  it('falls back to a single untokenized node for a language that was never registered', () => {
    expect(highlightedTokenClassNames('totally-bogus-lang', 'a: 1')).toEqual([undefined]);
  });
});
