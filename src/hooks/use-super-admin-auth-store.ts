'use client';

import { useState, useEffect, useCallback } from 'react';

const AUTH_KEY = 'superAdminLoggedIn';
const CREDENTIALS_KEY = 'superAdminCredentials';

const defaultCredentials = {
  email: 'superadmin@example.com',
  password: 'superadmin'
};

export function useSuperAdminAuthStore() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // Initialize credentials in localStorage if they don't exist
  useEffect(() => {
    try {
      const storedCreds = localStorage.getItem(CREDENTIALS_KEY);
      if (!storedCreds) {
        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(defaultCredentials));
      }
      const isLoggedIn = localStorage.getItem(AUTH_KEY);
      setIsAuthenticated(isLoggedIn === 'true');
    } catch (error) {
      console.error("Failed to initialize super admin auth", error);
      setIsAuthenticated(false);
    }
    setIsAuthInitialized(true);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const storedCreds = localStorage.getItem(CREDENTIALS_KEY);
      // NOTE: For simulation. In a real app, never store credentials in localStorage.
      const creds = storedCreds ? JSON.parse(storedCreds) : defaultCredentials;
      
      if (email === creds.email && password === creds.password) {
        localStorage.setItem(AUTH_KEY, 'true');
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
       console.error("Failed to login super admin", error);
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      setIsAuthenticated(false);
      window.location.assign('/super-admin/login');
    } catch (error) {
        console.error("Failed to logout super admin", error);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
        const storedCreds = localStorage.getItem(CREDENTIALS_KEY);
        if (!storedCreds) {
            return { success: false, message: 'Could not find credential data.' };
        }
        const creds = JSON.parse(storedCreds);

        if (creds.password !== currentPassword) {
            return { success: false, message: 'Current password does not match.' };
        }

        const newCreds = { ...creds, password: newPassword };
        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(newCreds));
        return { success: true, message: 'Password updated successfully.' };

    } catch (error) {
        console.error("Failed to change password", error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
  }, []);

  return { isAuthenticated, isAuthInitialized, login, logout, changePassword };
}
