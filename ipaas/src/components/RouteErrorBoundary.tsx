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

import { Alert, Box, Button, Typography } from '@wso2/oxygen-ui';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
  info: string;
}

/** Catches render errors in a route subtree and shows the message instead of a blank screen. */
export default class RouteErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[RouteErrorBoundary]', error, info.componentStack);
    this.setState({ info: info.componentStack ?? '' });
  }

  render(): ReactNode {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    return (
      <Box sx={{ p: 3, maxWidth: 900 }}>
        <Alert severity="error">
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Something went wrong rendering this page.
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', mt: 1 }}>
            {error.message}
          </Typography>
          {info && (
            <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', mt: 1, opacity: 0.8, maxHeight: 240, overflow: 'auto' }}>
              {info}
            </Typography>
          )}
        </Alert>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => this.setState({ error: null, info: '' })}>
          Retry
        </Button>
      </Box>
    );
  }
}
