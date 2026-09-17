import React, { createContext, useState, useEffect, useCallback } from "react";
import * as authApi from "../api/auth";

const STORAGE_KEY = "reading-nook-session";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // Starts true: we don't know yet whether a session exists in localStorage.
  // ProtectedRoute waits for this to settle before deciding to redirect,
  // otherwise a hard refresh on /mylist would bounce a logged-in user to /login.
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Rehydrate session on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.token && saved?.user) {
          setUser(saved.user);
          setToken(saved.token);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setInitializing(false);
    }
  }, []);

  function persistSession(nextUser, nextToken) {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: nextUser, token: nextToken })
    );
  }

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const data = await authApi.login({ email, password });
      persistSession(data.user, data.token);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setAuthError(null);
    try {
      const data = await authApi.register({ name, email, password });
      persistSession(data.user, data.token);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    initializing,
    authError,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
