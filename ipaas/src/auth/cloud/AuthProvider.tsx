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

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { JSX, ReactNode } from 'react';
import { ThunderIDProvider, useThunderID } from '@thunderid/react';
import { hasAuthParamsInUrl, hasCalledForThisInstanceInUrl } from '@thunderid/browser';
import PageLoader from '../../components/PageLoader';
import { oidcCallbackUrl } from '../../paths';
import { editorSignInForwardUrl } from '../../utils/vscodeCallback';
import type { AuthContextValue } from '../contract';
import { decodeJwtPayload, isExpired, stringClaim } from './jwt';
import { connect, disconnect, type CloudSession, type CloudUser } from './session';
import { THUNDER_INSTANCE_ID, signInParams, thunderConfig } from './thunderConfig';

const ORG_HANDLE_KEY = 'org_handle';
const MISSING_ORG = 'Missing organization context after sign-in. Please try logging in again.';
const SIGNED_OUT_USER: CloudUser = { userId: '', username: '', displayName: '' };
// How long to wait for the SDK's startup refresh of an expired stored token.
const REFRESH_WAIT_MS = 5_000;
const RECHECK_MS = 250;

type Status = { kind: 'pending' } | { kind: 'signedIn'; session: CloudSession } | { kind: 'signedOut'; error: string | null };

const AuthContext = createContext<AuthContextValue | null>(null);

function isSignInLanding(): boolean {
  return window.location.pathname === oidcCallbackUrl();
}

/** The editor to forward this load's sign-in result to, before the SDK can act on the code. */
function editorForwardUrl(): string | null {
  if (!isSignInLanding()) return null;
  return editorSignInForwardUrl(new URLSearchParams(window.location.search), {
    origins: window.API_CONFIG?.editorCallbackOrigins ?? [],
    domains: window.API_CONFIG?.editorCallbackDomains ?? [],
  });
}

/** Whether the SDK will exchange a code on this load: one it asked for, returned to /signin. */
function sdkHasCode(): boolean {
  const { search } = window.location;
  return isSignInLanding() && hasAuthParamsInUrl(search) && hasCalledForThisInstanceInUrl(THUNDER_INSTANCE_ID, search);
}

function toSession(accessToken: string, idClaims: Record<string, unknown>): CloudSession | null {
  const access = decodeJwtPayload(accessToken);
  const orgHandle = stringClaim(access, 'ouHandle');
  const orgUuid = stringClaim(access, 'ouId');
  const userId = stringClaim(idClaims, 'sub') ?? stringClaim(access, 'sub');
  if (!orgHandle || !orgUuid || !userId) return null;

  const username = stringClaim(idClaims, 'username') ?? stringClaim(idClaims, 'preferred_username') ?? stringClaim(idClaims, 'email') ?? userId;
  return {
    user: {
      userId,
      username,
      displayName: stringClaim(idClaims, 'name') ?? stringClaim(idClaims, 'given_name') ?? username,
      pictureUrl: stringClaim(idClaims, 'picture'),
    },
    orgHandle,
    orgUuid,
  };
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [editorUrl] = useState(editorForwardUrl);
  const [config] = useState(thunderConfig);

  useEffect(() => {
    if (editorUrl) window.location.href = editorUrl;
  }, [editorUrl]);

  // The SDK never mounts for an editor's sign-in, so its code is forwarded untouched.
  if (editorUrl) return <PageLoader viewport label="Completing sign in…" />;

  return (
    <ThunderIDProvider {...config}>
      <CloudSessionProvider>{children}</CloudSessionProvider>
    </ThunderIDProvider>
  );
}

function CloudSessionProvider({ children }: { children: ReactNode }): JSX.Element {
  const { isInitialized, isLoading, isSignedIn, getAccessToken, getDecodedIdToken, clearSession, signIn, signOut } = useThunderID();
  const [hasCode] = useState(sdkHasCode);
  const [status, setStatus] = useState<Status>({ kind: 'pending' });
  const [mountedAt] = useState(Date.now);
  const [recheck, setRecheck] = useState(0);

  const endSession = useCallback(
    (error: string | null) => {
      disconnect();
      clearSession();
      setStatus({ kind: 'signedOut', error });
    },
    [clearSession],
  );

  // Settles once, from the SDK's state. `isLoading` alone can't say signed out:
  // it drops between initialising and restoring a stored session.
  useEffect(() => {
    if (status.kind !== 'pending' || !isInitialized) return;
    // Still exchanging the code it was handed.
    if (hasCode && isLoading && !isSignedIn) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settle = async (): Promise<void> => {
      const accessToken = await getAccessToken();
      if (cancelled) return;
      if (!accessToken) return setStatus({ kind: 'signedOut', error: null });
      // A stored session the SDK is still restoring — and refreshing, if it expired.
      if (!isSignedIn) return;
      if (isExpired(accessToken)) {
        // The SDK may report the session before its startup refresh lands.
        if (Date.now() - mountedAt < REFRESH_WAIT_MS) {
          timer = setTimeout(() => setRecheck((n) => n + 1), RECHECK_MS);
          return;
        }
        return endSession(null);
      }

      const session = toSession(accessToken, (await getDecodedIdToken()) as Record<string, unknown>);
      if (cancelled) return;
      if (!session) return endSession(MISSING_ORG);

      connect({ session, getAccessToken, onExpired: () => endSession(null) });
      // Read by AppLayout and the post-login routing to know the active org.
      localStorage.setItem(ORG_HANDLE_KEY, session.orgHandle);
      setStatus({ kind: 'signedIn', session });
    };
    settle().catch(() => {
      if (!cancelled) endSession(null);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [status.kind, hasCode, isInitialized, isLoading, isSignedIn, recheck, mountedAt, getAccessToken, getDecodedIdToken, endSession]);

  const loginWithOIDC = useCallback(
    async (fidp?: string) => {
      await signIn(signInParams(fidp));
    },
    [signIn],
  );

  const completeSignIn = useCallback(
    async (params: URLSearchParams) => {
      const oidcError = params.get('error');
      if (oidcError) throw new Error(`Authentication failed: ${params.get('error_description') || oidcError}`);
      if (status.kind !== 'signedIn') throw new Error(status.kind === 'signedOut' && status.error ? status.error : 'Sign-in did not complete. Please try logging in again.');
      // Thunder provisions the org at sign-up, so no one arrives without one.
      return { isNewUser: false, userId: status.session.user.userId };
    },
    [status],
  );

  const logout = useCallback(async () => {
    disconnect();
    localStorage.removeItem(ORG_HANDLE_KEY);
    // Clears the local session, then leaves for Thunder's end-session endpoint.
    await signOut();
    // Callers don't navigate over the redirect.
    return new Promise<void>(() => {});
  }, [signOut]);

  const value = useMemo<AuthContextValue>(() => {
    const user = status.kind === 'signedIn' ? status.session.user : SIGNED_OUT_USER;
    return {
      isAuthenticated: status.kind === 'signedIn',
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
      isOidcUser: true,
      // Thunder owns credentials; the console never asks for a password.
      requirePasswordChange: false,
      clearRequirePasswordChange: () => {},
      login: () => Promise.reject(new Error('Password sign-in is not available in the cloud console.')),
      loginWithOIDC,
      completeSignIn,
      completeOrgRegistration: () => Promise.reject(new Error('Organizations are created in Thunder; the cloud console has no registration step.')),
      logout,
    };
  }, [status, loginWithOIDC, completeSignIn, logout]);

  if (status.kind === 'pending') return <PageLoader viewport label={hasCode ? 'Completing sign in…' : undefined} />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
