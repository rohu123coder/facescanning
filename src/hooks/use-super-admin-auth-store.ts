'use client';

import { useState, useEffect, useCallback } from 'react';

const AUTH_KEY = 'superAdminLoggedIn';
const SUPER_ADMIN_EMAIL = 'superadmin@example.com';
const SUPER_ADMIN_PASSWORD = 'superadmin';

export function useSuperAdminAuthStore() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  useEffect(() => {
    try {
      const isLoggedIn = localStorage.getItem(AUTH_KEY);
      setIsAuthenticated(isLoggedIn === 'true');
    } catch (error) {
      console.error("Failed to check super admin auth status", error);
      setIsAuthenticated(false);
    }
    setIsAuthInitialized(true);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      try {
        localStorage.setItem(AUTH_KEY, 'true');
        setIsAuthenticated(true);
        return true;
      } catch (error) {
         console.error("Failed to save super admin auth status", error);
         return false;
      }
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      setIsAuthenticated(false);
    } catch (error) {
        console.error("Failed to logout super admin", error);
    }
  }, []);

  return { isAuthenticated, isAuthInitialized, login, logout };
}
