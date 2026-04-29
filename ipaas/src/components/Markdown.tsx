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

import { Box } from '@wso2/oxygen-ui';
import { type JSX } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

// Allow className on <code> so syntax-highlighting classes (e.g. language-js) survive sanitization
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
  },
};

const rehypePlugins = [rehypeRaw, [rehypeSanitize, sanitizeSchema]] as Parameters<typeof ReactMarkdown>[0]['rehypePlugins'];

// <details>/<summary> rendered as styled native collapsibles matching Devant's accordion look
const markdownComponents: Components = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  details: ({ node: _node, ...props }) => (
    <Box
      component="details"
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1.5,
        overflow: 'hidden',
        '& > summary::before': { content: '"▸ "', color: 'primary.main' },
        '&[open] > summary::before': { content: '"▾ "', color: 'primary.main' },
      }}
      {...(props as object)}
    />
  ),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  summary: ({ node: _node, ...props }) => (
    <Box
      component="summary"
      sx={{
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        userSelect: 'none',
        fontWeight: 600,
        bgcolor: 'action.hover',
        borderColor: 'divider',
        listStyle: 'none',
        '&::-webkit-details-marker': { display: 'none' },
      }}
      {...(props as object)}
    />
  ),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  a: ({ node: _node, ...props }) => (
    <a target="_blank" rel="noopener noreferrer" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  img: ({ node: _node, ...props }) => (
    <Box component="img" sx={{ maxWidth: '100%', height: 'auto', display: 'block' }} {...(props as object)} />
  ),
};

const containerSx = {
  '& h1': { mt: 2, mb: 1 },
  '& h2, & h3': { fontSize: '0.9rem', fontWeight: 700, mt: 2, mb: 0.75 },
  '& p': { mb: 1.5, lineHeight: 1.7 },
  '& ul, & ol': { pl: 2.5, mb: 1.5 },
  '& li': { mb: 0.5 },
  '& code': { fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5, fontSize: '0.85em' },
  '& pre': { bgcolor: 'action.hover', p: 2, borderRadius: 1, overflow: 'auto', mb: 2 },
  '& pre code': { bgcolor: 'transparent', px: 0 },
  '& a': { color: 'primary.main' },
  '& table': { borderCollapse: 'collapse', width: '100%', mb: 2 },
  '& th, & td': { border: '1px solid', borderColor: 'divider', px: 1.5, py: 1, textAlign: 'left' },
  '& th': { bgcolor: 'action.hover', fontWeight: 600 },
  '& details > *:not(summary)': { px: 2.5 },
  '& details > ul, & details > ol': { pl: 5 },
} as const;

interface MarkdownProps {
  children: string;
}

export default function Markdown({ children }: MarkdownProps): JSX.Element {
  return (
    <Box sx={containerSx}>
      <ReactMarkdown rehypePlugins={rehypePlugins} components={markdownComponents}>
        {children}
      </ReactMarkdown>
    </Box>
  );
}
