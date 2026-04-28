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

import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Link, Typography } from '@wso2/oxygen-ui';
import { X } from '@wso2/oxygen-ui-icons-react';
import { Link as NavLink } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { loginUrl, orgHomeUrl, privacyPolicyUrl } from '../paths';

const TOS_KEY = 'icp_tos_accepted';

export default function ProjectsRedirect(): JSX.Element {
  const { orgHandler } = useParams<{ orgHandler: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(TOS_KEY) === 'true') {
      navigate(orgHomeUrl(orgHandler!), { replace: true });
    } else {
      setOpen(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = () => {
    localStorage.setItem(TOS_KEY, 'true');
    setOpen(false);
    navigate(orgHomeUrl(orgHandler!), { replace: true });
  };

  const handleDecline = () => {
    setOpen(false);
    logout().then(() => navigate(loginUrl(), { replace: true }));
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth disableEscapeKeyDown>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Welcome to WSO2 Integration Platform!
          <IconButton size="small" onClick={handleDecline} aria-label="decline and close">
            <X size={18} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Please accept{' '}
          <Link href="https://wso2.com/devant/terms-of-use" target="_blank" rel="noopener noreferrer">
            Terms of Use
          </Link>{' '}
          and{' '}
          <Link component={NavLink} to={privacyPolicyUrl()} target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </Link>{' '}
          to continue!
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="secondary" onClick={handleDecline}>
          Decline
        </Button>
        <Button variant="contained" color="primary" onClick={handleAccept}>
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
}
