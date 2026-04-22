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

import { Box, ColorSchemeImage, Divider, Grid, Link, Stack, Typography } from '@wso2/oxygen-ui';
import { type JSX } from 'react';
import { Link as NavLink } from 'react-router';
import LoginForm from '../components/LoginForm';
import { privacyPolicyUrl } from '../paths';

const Footer = () => (
  <Box component="footer" sx={{ mt: 4 }}>
    <Stack direction="row" justifyContent="center" spacing={1} flexWrap="wrap">
      <Link href="https://wso2.com/integration-platform/" target="_blank" rel="noopener noreferrer" underline="hover" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
        More details at wso2.com/integration-platform
      </Link>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <Link component={NavLink} to={privacyPolicyUrl()} underline="hover" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
        Privacy Policy
      </Link>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <Link href="https://wso2.com/devant/terms-of-use" target="_blank" rel="noopener noreferrer" underline="hover" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
        Terms of Use
      </Link>
    </Stack>
  </Box>
);

export default function Login(): JSX.Element {
  const base = import.meta.env.BASE_URL;

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      <Grid container sx={{ flex: 1 }}>
        <Grid
          size={{ xs: 12, md: 8 }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start', // Move content to the left
            justifyContent: 'center',
            padding: { xs: 4, md: 8 },
            position: 'relative',
            overflow: 'hidden',
          }}>
          <Stack direction="column" alignItems="flex-start" gap={3} display={{ xs: 'none', md: 'flex' }} sx={{ width: '100%' }}>
            <ColorSchemeImage
              src={{ light: `${base}assets/images/logo/WSO2-Integration-Platform-Black.svg`, dark: `${base}assets/images/logo/WSO2-Integration-Platform-White.svg` }}
              alt={{ light: 'WSO2 Integration Platform Logo', dark: 'WSO2 Integration Platform Logo' }}
              height={60}
              width="auto"
              style={{ alignSelf: 'flex-start' }}
            />
            <Typography variant="h3" component="h1" sx={{ textAlign: 'left', width: '100%' }}>
              Get Started with WSO2 Integration Platform
            </Typography>
            <Box sx={{ maxWidth: 520, width: '100%' }}>
              <Typography variant="h6" sx={{ textAlign: 'left', width: '100%', mb: 1 }}>
                The AI iPaaS for Smarter Integrations
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'left', width: '100%', mb: 1 }}>
                A platform for building and managing integrations with AI-assistance.
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0, color: 'text.secondary' }}>
                {[
                  'AI-assisted low-code and pro-code development',
                  'Built-in support for HTTP, GraphQL, gRPC, WebSockets, TCP, Websub, and much more',
                  'Integrate GenAI models, knowledge bases, AI Agents, and systems',
                  'Seamless deployments with CI/CD and Kubernetes',
                  'Comprehensive analytics and insights to optimize performance',
                ].map((item) => (
                  <Typography key={item} component="li" variant="body2" sx={{ mb: 0.5 }}>
                    {item}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Stack>
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'flex-end',
              alignItems: 'center',
              mt: 2,
              width: '100%',
            }}>
            <img src={`${base}assets/images/WIP-login.svg`} alt="Login illustration" style={{ maxWidth: '90%', maxHeight: '280px', objectFit: 'contain' }} />
          </Box>
        </Grid>

        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{
            display: 'flex',
            padding: 4,
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
          <Box
            sx={{
              width: '100%',
              maxWidth: 400,
              margin: '0 auto',
            }}>
            <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
              <ColorSchemeImage
                src={{ light: `${base}assets/images/logo/WSO2-Integration-Platform-Black.svg`, dark: `${base}assets/images/logo/WSO2-Integration-Platform-White.svg` }}
                alt={{ light: 'WSO2 Integration Platform Logo', dark: 'WSO2 Integration Platform Logo' }}
                height={48}
                width="auto"
              />
            </Box>
            <LoginForm />
            <Footer />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
