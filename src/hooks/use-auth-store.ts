'use client';

import { useState, useEffect, useCallback } from 'react';
import { useClientStore } from './use-client-store';
import { type Client } from '@/lib/data';

const AUTH_KEY = 'loggedInClientId';

export function useAuthStore() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const { clients, isInitialized: clientsInitialized } = useClientStore();

  useEffect(() => {
    try {
      const loggedInClientId = localStorage.getItem(AUTH_KEY);
      setIsAuthenticated(!!loggedInClientId);
    } catch (error) {
      console.error("Failed to check auth status", error);
      setIsAuthenticated(false);
    }
    setIsAuthInitialized(true);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string; client?: Client; }> => {
    if (!clientsInitialized) {
        return { success: false, message: "Client data not ready. Please try again." };
    }
    
    const client = clients.find(c => c.email === email);

    // For this simulation, the password is the client's mobile number
    if (client && client.mobile === password) {
      try {
        localStorage.setItem(AUTH_KEY, client.id);
        setIsAuthenticated(true);
        // Add a small delay to allow client store to update
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, client: client };
      } catch (error) {
         console.error("Failed to save auth status", error);
         return { success: false, message: "Could not save session." };
      }
    }
    return { success: false, message: "Invalid email or password." };
  }, [clients, clientsInitialized]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
      setIsAuthenticated(false);
    } catch (error) {
        console.error("Failed to logout", error);
    }
  }, []);

  return { isAuthenticated, isAuthInitialized, login, logout };
}
