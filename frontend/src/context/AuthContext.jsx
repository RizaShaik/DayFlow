import { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi.js';
import { setAccessToken, setAuthFailureHandler } from '../api/tokenStore.js';
import { AuthContext } from './auth-context.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | unauthenticated

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    setAuthFailureHandler(clearSession);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { accessToken } = await authApi.refresh();
        setAccessToken(accessToken);
        const { user: me } = await authApi.me();
        if (!cancelled) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) clearSession();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const signIn = useCallback(async (identifier, password) => {
    const { accessToken, user: signedInUser } = await authApi.signin({ identifier, password });
    setAccessToken(accessToken);
    setUser(signedInUser);
    setStatus('authenticated');
    return signedInUser;
  }, []);

  const signUp = useCallback((payload) => authApi.signup(payload), []);

  const verifyEmail = useCallback(async (token) => {
    const { accessToken, user: verifiedUser } = await authApi.verifyEmail(token);
    setAccessToken(accessToken);
    setUser(verifiedUser);
    setStatus('authenticated');
    return verifiedUser;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const changePassword = useCallback(async (payload) => {
    await authApi.changePassword(payload);
    setUser((u) => (u ? { ...u, mustChangePassword: false } : u));
  }, []);

  // Re-syncs the navbar/session copy of the current user after edits made
  // elsewhere (e.g. uploading your own avatar from the profile page).
  const refreshMe = useCallback(async () => {
    const { user: me } = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signUp, verifyEmail, signOut, changePassword, refreshMe }),
    [user, status, signIn, signUp, verifyEmail, signOut, changePassword, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
